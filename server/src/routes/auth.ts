import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import {
  signAccessToken,
  signRefreshToken,
  signTwoFactorChallenge,
  verifyRefreshToken,
  verifyTwoFactorChallenge,
} from '../utils/jwt';
import { AppError, BadRequest, Unauthorized } from '../utils/errors';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { logAction } from '../services/audit';
import { isTransactionalEmailConfigured, sendTransactionalEmail } from '../services/emailAlerts';
import { sendCustomerWelcomeEmail } from '../services/welcomeEmail';
import { clientIp, reportSecurityEvent, unblockIp } from '../services/security';
import { isTurnstileConfigured, verifyTurnstileToken } from '../services/turnstile';
import {
  TWO_FACTOR_ISSUER,
  buildOtpauthUrl,
  consumeBackupCode,
  generateBackupCodes,
  generateTwoFactorSecret,
  normalizeNumericCode,
  verifyTotp,
} from '../services/twoFactor';

export const authRouter = Router();

const normalizeEmail = (email: string) => email.trim().toLowerCase();

// --- Validation Schemas ---
const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
  // TOTP code or a one-time backup code, supplied on the second login step.
  twoFactorCode: z.string().trim().max(32).optional(),
  // Cloudflare Turnstile token, present when the customer login widget is on.
  captchaToken: z.string().trim().max(4096).optional(),
});

const forgotSchema = z.object({
  email: z.string().email(),
});

const resetSchema = z.object({
  // Copying a link from an email can pick up a trailing space or newline.
  token: z.string().trim().regex(/^[a-f0-9]{64}$/i),
  password: z.string().min(12),
});

const adminResetSchema = z.object({
  code: z.string().min(1),
  email: z.string().min(1),
  password: z.string().min(12),
  // Also clear the second factor when the owner lost their authenticator and
  // backup codes. Requires the admin gate code.
  resetTwoFactor: z.boolean().optional(),
});

const twoFactorChallengeSchema = z.object({
  challengeToken: z.string().min(20),
});

const twoFactorConfirmSchema = twoFactorChallengeSchema.extend({
  code: z.string().trim().min(6).max(32),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(12),
});

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Please enter your full name (at least 2 characters)')
    .max(120, 'Name is too long'),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address')
    .max(254, 'Email is too long'),
  phone: z
    .string()
    .trim()
    .max(32, 'Phone number is too long')
    .regex(/^[+0-9 ()-]*$/, 'Phone number contains invalid characters')
    .optional()
    .or(z.literal('')),
  password: z
    .string()
    .min(10, 'Password must be at least 10 characters')
    .max(200, 'Password is too long'),
});

const verifyEmailSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/i),
});

const MAX_FAILED_LOGINS = 5;
const LOGIN_LOCK_MINUTES = 15;
const PASSWORD_RESET_MINUTES = 30;
const EMAIL_VERIFICATION_HOURS = 24;

/** The two roles that own the store and its admin panel. */
function isAdminAccount(role: string): boolean {
  return role === 'SUPER_ADMIN' || role === 'ADMIN';
}

/** Roles allowed to sign in: the owner's admins and storefront customers. */
function canSignIn(role: string): boolean {
  return isAdminAccount(role) || role === 'CUSTOMER';
}

/** Two-factor is mandatory for the owner's accounts, never for customers. */
function twoFactorRequired(): boolean {
  return String(process.env.TWO_FACTOR_REQUIRED ?? 'true').toLowerCase() !== 'false';
}

function escapeHtml(value: string): string {
  return String(value || '').replace(/[&<>"']/g, (character) => {
    switch (character) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}

// The old six-digit gate code was published in the repository. A gate code is
// now only accepted when it is a long random value of at least 16 characters.
function resolveGateCode(): string | null {
  const code = (process.env.ADMIN_GATE_CODE || '').trim();
  if (!code || code.length < 16) return null;
  return code;
}

function gateCodeMatches(input: string, expected: string): boolean {
  const provided = Buffer.from(String(input || ''), 'utf8');
  const wanted = Buffer.from(String(expected || ''), 'utf8');
  if (!provided.length || provided.length !== wanted.length) return false;
  return crypto.timingSafeEqual(provided, wanted);
}

// --- Helpers ---
const sha256 = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

async function generateResetToken(): Promise<{ token: string; tokenHash: string; expiresAt: Date }> {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_MINUTES * 60 * 1000);
  return { token: rawToken, tokenHash: sha256(rawToken), expiresAt };
}

/** Public storefront URL: explicit setting, then the first real CORS origin. */
function siteUrl(): string {
  const explicit = (process.env.PUBLIC_SITE_URL || '').trim();
  if (explicit) return explicit.replace(/\/+$/, '');
  const cors = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((value) => value.trim())
    .find((value) => /^https?:\/\//i.test(value) && !/localhost|127\.0\.0\.1/i.test(value));
  return (cors || 'https://aos-tech.store').replace(/\/+$/, '');
}

/** Base URL of this API, used by links inside transactional emails. */
function apiBaseUrl(): string {
  // The storefront proxies /api/* to this service, so building the link on the
  // public site keeps it valid even if the API host is renamed or moved.
  const configured = (process.env.API_PUBLIC_URL || '').trim();
  const usable = /^https?:\/\//i.test(configured) && !/aostech\.vercel\.app|localhost|127\.0\.0\.1/i.test(configured);
  if (usable) return configured.replace(/\/+$/, '').replace(/\/api$/, '') + '/api';
  return `${siteUrl()}/api`;
}

// --- Social sign-in (Google / GitHub) ---
// Customers may sign in with a verified provider email. Owner/admin accounts
// stay on the password + second-factor flow in #hqpanel and are refused here.

type OAuthProvider = 'google' | 'github';

const OAUTH_FLOW_MINUTES = 10;
const OAUTH_COOKIE = 'aos_oauth';

function oauthCredentials(
  provider: OAuthProvider
): { clientId: string; clientSecret: string } | null {
  const prefix = provider === 'google' ? 'GOOGLE' : 'GITHUB';
  const clientId = (process.env[`${prefix}_CLIENT_ID`] || '').trim();
  const clientSecret = (process.env[`${prefix}_CLIENT_SECRET`] || '').trim();
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

function isOAuthProvider(value: string): value is OAuthProvider {
  return value === 'google' || value === 'github';
}

/**
 * Public callback URL. It must be registered verbatim in the provider console.
 * Defaults to the storefront domain because the browser reaches the API through
 * the Vercel /api rewrite, so the flow cookies live on the storefront origin.
 */
function oauthCallbackUrl(provider: OAuthProvider): string {
  const explicit = (process.env.OAUTH_CALLBACK_BASE || '').trim();
  if (/^https?:\/\//i.test(explicit)) {
    return `${explicit.replace(/\/+$/, '').replace(/\/api$/, '')}/api/auth/oauth/${provider}/callback`;
  }
  return `${siteUrl()}/api/auth/oauth/${provider}/callback`;
}

interface OAuthFlow {
  provider: OAuthProvider;
  state: string;
  verifier?: string;
  exp: number;
}

function oauthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/api/auth/oauth',
    maxAge: OAUTH_FLOW_MINUTES * 60 * 1000,
  };
}

/** Same attributes minus maxAge, as required by clearCookie. */
function oauthCookieClearOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/api/auth/oauth',
  };
}

/**
 * The OAuth flow cookie is signed so the state, provider and PKCE verifier
 * cannot be forged or swapped between providers.
 */
function signOAuthFlow(flow: OAuthFlow): string {
  const payload = Buffer.from(JSON.stringify(flow), 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', process.env.JWT_SECRET || '')
    .update(payload)
    .digest('base64url');
  return `${payload}.${signature}`;
}

function readOAuthFlow(value: string | undefined): OAuthFlow | null {
  if (!value) return null;
  const [payload, signature] = value.split('.');
  if (!payload || !signature) return null;

  const expected = crypto
    .createHmac('sha256', process.env.JWT_SECRET || '')
    .update(payload)
    .digest('base64url');
  const received = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  if (received.length !== wanted.length || !crypto.timingSafeEqual(received, wanted)) {
    return null;
  }

  try {
    const flow = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as OAuthFlow;
    if (!isOAuthProvider(flow.provider) || !flow.state || flow.exp < Date.now()) return null;
    return flow;
  } catch {
    return null;
  }
}

interface OAuthProfile {
  email: string;
  name: string;
  avatar?: string;
  emailVerified: boolean;
}

async function exchangeOAuthCode(
  provider: OAuthProvider,
  credentials: { clientId: string; clientSecret: string },
  code: string,
  redirectUri: string,
  verifier?: string
): Promise<string | null> {
  const body = new URLSearchParams({
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });
  if (verifier) body.set('code_verifier', verifier);

  const tokenUrl =
    provider === 'google'
      ? 'https://oauth2.googleapis.com/token'
      : 'https://github.com/login/oauth/access_token';

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: body.toString(),
    signal: AbortSignal.timeout(15_000),
  });
  const data: any = await response.json().catch(() => ({}));
  if (!response.ok || data?.error || !data?.access_token) return null;
  return String(data.access_token);
}

async function fetchOAuthProfile(
  provider: OAuthProvider,
  accessToken: string
): Promise<OAuthProfile | null> {
  if (provider === 'google') {
    const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(15_000),
    });
    const data: any = await response.json().catch(() => ({}));
    if (!response.ok || !data?.email) return null;
    return {
      email: normalizeEmail(String(data.email)),
      name: String(data.name || data.email.split('@')[0]).slice(0, 120),
      avatar: typeof data.picture === 'string' ? data.picture : undefined,
      emailVerified: data.email_verified === true,
    };
  }

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'aos-tech-store',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  const [userResponse, emailsResponse] = await Promise.all([
    fetch('https://api.github.com/user', { headers, signal: AbortSignal.timeout(15_000) }),
    fetch('https://api.github.com/user/emails', { headers, signal: AbortSignal.timeout(15_000) }),
  ]);
  const user: any = await userResponse.json().catch(() => ({}));
  if (!userResponse.ok || !user?.login) return null;

  const emails: any = await emailsResponse.json().catch(() => []);
  const list = Array.isArray(emails) ? emails : [];
  const primary =
    list.find((entry: any) => entry?.primary && entry?.verified) ||
    list.find((entry: any) => entry?.verified);

  return {
    email: primary?.email ? normalizeEmail(String(primary.email)) : '',
    name: String(user.name || user.login).slice(0, 120),
    avatar: typeof user.avatar_url === 'string' ? user.avatar_url : undefined,
    emailVerified: Boolean(primary),
  };
}

/**
 * Password sign-up. The welcome mail doubles as the confirmation mail: the
 * account is only created when this send succeeds, so one strong email greets
 * the customer and activates the account without a second message.
 */
async function sendVerificationEmail(email: string, token: string, userName: string): Promise<boolean> {
  const verifyUrl = `${apiBaseUrl()}/auth/verify-email?token=${encodeURIComponent(token)}`;
  return sendCustomerWelcomeEmail({
    email,
    name: userName,
    mode: 'verify',
    actionUrl: verifyUrl,
    storeUrl: siteUrl(),
    expiresHours: EMAIL_VERIFICATION_HOURS,
  });
}

/** Issues a fresh verification token and emails it; returns false if unsent. */
async function issueEmailVerification(user: {
  id: string;
  email: string;
  name: string;
}): Promise<boolean> {
  const token = crypto.randomBytes(32).toString('hex');
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationToken: sha256(token),
      emailVerificationExpires: new Date(Date.now() + EMAIL_VERIFICATION_HOURS * 60 * 60 * 1000),
    },
  });
  return sendVerificationEmail(user.email, token, user.name);
}

function publicUser(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string | null;
  twoFactorEnabled?: boolean;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone ?? null,
    twoFactorEnabled: Boolean(user.twoFactorEnabled),
  };
}

/** Issues a new access/refresh pair and keeps only this session alive. */
async function createSession(
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    tokenVersion: number;
    twoFactorEnabled?: boolean;
  },
  res: Response
): Promise<string> {
  const accessToken = signAccessToken({
    userId: user.id,
    role: user.role,
    tokenVersion: user.tokenVersion,
  });
  const refreshToken = signRefreshToken({ userId: user.id, tokenVersion: user.tokenVersion });

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken, lastActivityAt: new Date() },
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // Non-sensitive companion marker. The refresh token stays HttpOnly, but the
  // storefront needs a readable hint that a session may exist so it can restore
  // signed-in users (including OAuth redirects) without probing on every visit.
  res.cookie('aos_session', '1', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return accessToken;
}

/** Returns true when the failed attempt just triggered an account lock. */
async function recordFailedLogin(user: {
  id: string;
  failedLoginAttempts: number;
}): Promise<boolean> {
  const attempts = (user.failedLoginAttempts || 0) + 1;
  if (attempts >= MAX_FAILED_LOGINS) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: new Date(Date.now() + LOGIN_LOCK_MINUTES * 60 * 1000),
      },
    });
    return true;
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: attempts },
  });
  return false;
}

async function resolveTwoFactorChallenge(token: unknown): Promise<string | null> {
  try {
    return verifyTwoFactorChallenge(String(token || '')).userId;
  } catch {
    return null;
  }
}

async function sendResetEmail(email: string, token: string, userName: string) {
  const resetUrl = `${apiBaseUrl()}/auth/reset-password?token=${encodeURIComponent(token)}`;
  const storeUrl = siteUrl();

  // Uses the same transactional channel as the verification email: Render Free
  // blocks outbound SMTP ports, so Resend is the reliable path here.
  return sendTransactionalEmail(
    email,
    'Reset your password - AOS Tech Store',
    `Hello ${userName},\n\nWe received a request to reset your AOS Tech Store password:\n${resetUrl}\n\nThis link expires in ${PASSWORD_RESET_MINUTES} minutes. If you did not request this, ignore this message.`,
    `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e293b;">Reset Your Password</h2>
        <p>Hello ${escapeHtml(userName)},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #1e293b; color: #f1f5f9; padding: 12px 28px; text-decoration: none; border-radius: 20px; font-weight: 700;">Reset Password</a>
        </div>
        <p>This link will expire in ${PASSWORD_RESET_MINUTES} minutes.</p>
        <p>If the button does not work, copy this address into your browser:</p>
        <p style="word-break: break-all; color: #475569;">${resetUrl}</p>
        <p>If you didn't request this reset, please ignore this email or contact support if you have concerns.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #cbd5e1;">
        <p style="font-size: 12px; color: #64748b;">&copy; 2026 AOS Tech Store. All rights reserved.</p>
        <p style="font-size: 12px;"><a href="${storeUrl}" style="color: #64748b;">${storeUrl}</a></p>
      </div>
    `
  );
}

/**
 * Friendly page for reset links that lost their token or were altered. A raw
 * 400 text left the customer with no way forward; this page points them back
 * to the recovery form so they can request a fresh link.
 */
function sendInvalidResetPage(res: Response) {
  const storeUrl = siteUrl();
  res.status(400);
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'"
  );
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.type('html').send(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="noindex, nofollow" />
        <title>رابط إعادة التعيين غير صالح | AOS Tech Store</title>
        <style>
          body { font-family: system-ui, -apple-system, "Segoe UI", Tahoma, sans-serif; background: radial-gradient(circle at 50% 25%, #1e3a8a 0%, #0f172a 55%, #020617 100%); color: #e2e8f0; margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px; }
          .card { background: #111f38; border: 1px solid rgba(96,165,250,.25); border-radius: 28px; box-shadow: 0 0 60px rgba(59,130,246,.18); padding: 40px 32px; max-width: 440px; width: 100%; box-sizing: border-box; text-align: center; }
          .icon { display: grid; place-items: center; width: 64px; height: 64px; margin: 0 auto 18px; border-radius: 20px; background: rgba(239,68,68,.12); border: 1px solid rgba(239,68,68,.3); font-size: 30px; }
          h1 { margin: 0 0 10px; font-size: 21px; }
          p { margin: 0 0 8px; font-size: 14px; line-height: 1.9; color: #94a3b8; }
          .btn { display: block; margin: 24px 0 12px; padding: 14px 24px; border-radius: 16px; background: linear-gradient(90deg,#2563eb,#38bdf8); color: #fff; text-decoration: none; font-weight: 800; font-size: 15px; }
          .link { color: #94a3b8; font-size: 13px; }
          .muted { margin-top: 20px; font-size: 12px; color: #64748b; line-height: 1.8; }
        </style>
      </head>
      <body>
        <main class="card">
          <div class="icon" aria-hidden="true">🔒</div>
          <h1>رابط إعادة التعيين غير صالح</h1>
          <p>الرابط الذي فتحته غير مكتمل أو لم يعد صالحاً.</p>
          <p>اطلب رابطاً جديداً ثم أعد المحاولة.</p>
          <a class="btn" href="${storeUrl}/login?forgot=1">طلب رابط جديد</a>
          <a class="link" href="${storeUrl}">العودة إلى المتجر</a>
          <p class="muted" dir="ltr">Lien invalide ou incomplet. Demandez un nouveau lien.<br />Invalid or incomplete link. Request a new one.</p>
        </main>
      </body>
      </html>
    `);
}

/**
 * Result page for the password-reset form. The form posts natively (no inline
 * JavaScript) so it keeps working even when an edge CSP replaces the page's
 * own policy. Never reflect the token or the password in the response.
 */
function sendResetResultPage(res: Response, status: number, ok: boolean, message: string) {
  const storeUrl = siteUrl();
  const target = ok ? `${storeUrl}/login` : `${storeUrl}/login?forgot=1`;
  const label = ok ? 'تسجيل الدخول' : 'طلب رابط جديد';
  res.status(status);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.type('html').send(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="noindex, nofollow" />
        <title>${ok ? 'تم تغيير كلمة المرور' : 'تعذّر تغيير كلمة المرور'} | AOS Tech Store</title>
        <style>
          body { font-family: system-ui, -apple-system, "Segoe UI", Tahoma, sans-serif; background: radial-gradient(circle at 50% 25%, #1e3a8a 0%, #0f172a 55%, #020617 100%); color: #e2e8f0; margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px; }
          .card { background: #111f38; border: 1px solid rgba(96,165,250,.25); border-radius: 28px; box-shadow: 0 0 60px rgba(59,130,246,.18); padding: 40px 32px; max-width: 440px; width: 100%; box-sizing: border-box; text-align: center; }
          .icon { display: grid; place-items: center; width: 64px; height: 64px; margin: 0 auto 18px; border-radius: 20px; font-size: 30px; background: ${ok ? 'rgba(34,197,94,.12)' : 'rgba(239,68,68,.12)'}; border: 1px solid ${ok ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.3)'}; }
          h1 { margin: 0 0 10px; font-size: 21px; }
          p { margin: 0 0 8px; font-size: 14px; line-height: 1.9; color: #94a3b8; }
          .btn { display: block; margin: 24px 0 0; padding: 14px 24px; border-radius: 16px; background: linear-gradient(90deg,#2563eb,#38bdf8); color: #fff; text-decoration: none; font-weight: 800; font-size: 15px; }
        </style>
      </head>
      <body>
        <main class="card">
          <div class="icon" aria-hidden="true">${ok ? '✅' : '🔒'}</div>
          <h1>${ok ? 'تم تغيير كلمة المرور' : 'تعذّر تغيير كلمة المرور'}</h1>
          <p>${escapeHtml(message)}</p>
          <a class="btn" href="${escapeHtml(target)}">${label}</a>
        </main>
      </body>
      </html>
    `);
}

// --- Routes ---

// Public customer sign-up. Every account must confirm its email address before
// it can sign in, because order history is matched by email: an unverified
// account would otherwise be able to read someone else's orders.
authRouter.post('/register', async (req, res: Response) => {
  try {
    const { name, email: rawEmail, phone, password } = registerSchema.parse(req.body);
    const email = normalizeEmail(rawEmail);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'This email is already registered' });
    }

    if (!isTransactionalEmailConfigured()) {
      console.error('[Auth] Registration blocked: no transactional email provider is configured');
      return res.status(503).json({
        error: 'Account registration is temporarily unavailable. You can still order as a guest.',
      });
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return res.status(400).json({
        error: 'Password must contain uppercase, lowercase and a number',
      });
    }

    const passwordHash = await bcrypt.hash(password, 13);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Send first: if the mail cannot be delivered the account is not created,
    // so a customer never ends up with an unverifiable login.
    const sent = await sendVerificationEmail(email, verificationToken, name);
    if (!sent) {
      return res.status(502).json({
        error: 'We could not send the confirmation email. Please try again later.',
      });
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        passwordHash,
        role: 'CUSTOMER',
        emailVerified: false,
        emailVerificationToken: sha256(verificationToken),
        emailVerificationExpires: new Date(
          Date.now() + EMAIL_VERIFICATION_HOURS * 60 * 60 * 1000
        ),
      },
      select: { id: true, email: true, name: true },
    });

    await logAction(user.id, 'REGISTER', 'User', { role: 'CUSTOMER' }, clientIp(req));

    res.status(201).json({
      ok: true,
      message: 'Registration successful. Check your email to confirm the account.',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        error: err.issues[0]?.message || 'Validation failed',
        details: err.issues,
      });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return res.status(409).json({ error: 'This email is already registered' });
    }
    console.error('[Auth] Register error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

/**
 * Minimal branded HTML for the confirmation screen. It is deliberately
 * script-free: the storefront is served through Vercel, whose CSP applies to
 * every path and would block an inline handler, so the button is a plain form.
 */
function verificationPage(options: {
  title: string;
  body: string;
  token?: string;
  status: number;
}): string {
  const { title, body, token, status } = options;
  const back = `${siteUrl()}/#account`;
  return `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${escapeHtml(title)} - AOS Tech Store</title>
      <style>
        body { font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 20px; }
        .card { background: #1e293b; border-radius: 28px; box-shadow: 0 0 40px rgba(59,130,246,.15); padding: 40px; max-width: 420px; margin: 40px auto; text-align: center; }
        button { width: 100%; padding: 15px; background: #3b82f6; color: #fff; border: none; border-radius: 20px; font-size: 16px; font-weight: 700; cursor: pointer; }
        a { color: #93c5fd; }
        .hint { color: #94a3b8; font-size: 13px; line-height: 1.6; }
        .ok { color: #22c55e; }
        .bad { color: #ef4444; }
      </style>
    </head>
    <body data-status="${status}">
      <div class="card">
        <h2>${escapeHtml(title)}</h2>
        ${body}
        <p class="hint"><a href="${back}">العودة إلى المتجر / Back to the store</a></p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Confirmation page opened from the email. GET only renders; the POST below
 * performs the change so mail scanners that prefetch links cannot consume it.
 */
authRouter.get('/verify-email', (req, res) => {
  const token = String(req.query.token || '');
  if (!/^[a-f0-9]{64}$/i.test(token)) {
    return res
      .status(400)
      .type('html')
      .send(
        verificationPage({
          title: 'رابط غير صالح',
          status: 400,
          body: '<p class="bad">الرابط غير صالح أو منتهي الصلاحية.</p><p class="hint">Invalid or expired link.</p>',
        })
      );
  }

  res.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"
  );
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');

  res.type('html').send(
    verificationPage({
      title: 'تأكيد البريد الإلكتروني',
      status: 200,
      body: `
        <p class="hint">Confirm your email address to activate your AOS Tech Store account.</p>
        <form method="POST" action="/api/auth/verify-email">
          <input type="hidden" name="token" value="${escapeHtml(token)}">
          <button type="submit">تأكيد البريد / Confirm email</button>
        </form>
      `,
    })
  );
});

authRouter.post('/verify-email', async (req, res: Response) => {
  // The confirmation screen posts a normal form; scripts and API clients post JSON.
  const contentType = String(req.headers['content-type'] || '');
  const wantsHtml = contentType.startsWith('application/x-www-form-urlencoded');

  const respond = (status: number, payload: { ok?: boolean; error?: string }) => {
    if (!wantsHtml) return res.status(status).json(payload);
    return res
      .status(status)
      .type('html')
      .send(
        verificationPage({
          title: payload.ok ? 'تم تأكيد البريد' : 'تعذّر التأكيد',
          status,
          body: payload.ok
            ? '<p class="ok">تم تأكيد بريدك. يمكنك تسجيل الدخول الآن.</p><p class="hint">Email confirmed. You can sign in now.</p>'
            : `<p class="bad">${escapeHtml(payload.error || 'Verification failed')}</p>`,
        })
      );
  };

  try {
    const { token } = verifyEmailSchema.parse(req.body);
    // Conditional update makes the token single-use even with concurrent clicks.
    const result = await prisma.user.updateMany({
      where: {
        emailVerificationToken: sha256(token),
        emailVerificationExpires: { gt: new Date() },
      },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });
    if (result.count !== 1) {
      return respond(400, { error: 'Verification link is invalid or expired' });
    }
    return respond(200, { ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return respond(400, { error: 'Verification link is invalid or expired' });
    }
    console.error('[Auth] Verify email error:', err);
    return respond(500, { error: 'Failed to confirm the email address' });
  }
});

// Resend is intentionally generic: it never reveals whether an account exists.
authRouter.post('/resend-verification', async (req, res: Response) => {
  try {
    const parsed = forgotSchema.safeParse(req.body);
    if (!parsed.success) return res.status(200).json({ ok: true });

    const email = normalizeEmail(parsed.data.email);
    const user = await prisma.user.findUnique({ where: { email } });
    if (
      !user ||
      user.role !== 'CUSTOMER' ||
      user.emailVerified ||
      !user.isActive
    ) {
      return res.status(200).json({ ok: true });
    }

    if (!isTransactionalEmailConfigured()) {
      return res.status(200).json({ ok: true });
    }

    await issueEmailVerification(user);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[Auth] Resend verification error:', err);
    res.status(200).json({ ok: true });
  }
});

authRouter.post('/login', async (req, res: Response) => {
  try {
    // 1. Health check: Verify DB is reachable before anything else
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (dbErr) {
      console.error('[Auth] Database connection failed during login:', dbErr);
      return res.status(503).json({ error: 'Database is temporarily unavailable. Please try again later.' });
    }

    const { email: rawEmail, password, twoFactorCode, captchaToken } = loginSchema.parse(req.body);
    const email = normalizeEmail(rawEmail);

    // 2. Normal Login Flow
    const user = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });

    // A locked account stays locked even if the password is correct, so an
    // attacker cannot keep guessing while the owner waits out the lock.
    if (user?.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      const minutes = Math.max(
        1,
        Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60_000)
      );
      reportSecurityEvent({
        type: 'brute_force_detected',
        severity: 'high',
        req,
        details: `Login attempt on a locked account for ${email.slice(0, 3)}***`,
        autoBlock: false,
        notify: isAdminAccount(user.role),
      });
      return res.status(429).json({
        error: `Too many failed attempts. Try again in ${minutes} minute(s).`,
      });
    }

    const valid = user?.passwordHash
      ? await bcrypt.compare(password, user.passwordHash)
      : false;
    if (!user || !valid) {
      const locked = user ? await recordFailedLogin(user) : false;
      reportSecurityEvent({
        type: 'failed_login',
        severity: 'medium',
        req,
        details: `Failed login for ${email.slice(0, 3)}***`,
        autoBlock: false,
        // Customer sign-in noise stays in the audit log without paging the owner.
        notify: Boolean(user && isAdminAccount(user.role)),
      });
      if (locked) {
        return res.status(429).json({
          error: `Too many failed attempts. Try again in ${LOGIN_LOCK_MINUTES} minutes.`,
        });
      }
      throw new BadRequest('Invalid email or password');
    }

    // Turnstile gate for customer sign-ins. Admin sign-in is exempted on
    // purpose: the owner panel has mandatory two-factor authentication and
    // must remain reachable if the captcha provider is down. The password has
    // already been verified here, so an attacker cannot use the exemption to
    // probe account roles.
    if (!isAdminAccount(user.role) && isTurnstileConfigured()) {
      const captcha = await verifyTurnstileToken(captchaToken, clientIp(req));
      if (!captcha.ok) {
        if (captcha.unavailable) {
          return res.status(503).json({
            error: 'The security check is temporarily unavailable. Please try again in a moment.',
            code: 'CAPTCHA_UNAVAILABLE',
          });
        }
        reportSecurityEvent({
          type: 'captcha_failed',
          severity: 'low',
          req,
          details: `Turnstile rejected a customer login for ${email.slice(0, 3)}***`,
          autoBlock: false,
          notify: false,
        });
        return res.status(400).json({
          error: 'The security check failed. Please complete it again.',
          code: 'CAPTCHA_FAILED',
        });
      }
    }

    // A publicly known default admin password must never grant access.
    // Set a new SEED_ADMIN_PASSWORD in the server environment, restart, then log in.
    if (isAdminAccount(user.role)) {
      const usesKnownDefaultPassword = await bcrypt.compare('hydra', user.passwordHash || '');
      if (usesKnownDefaultPassword) {
        reportSecurityEvent({
          type: 'failed_login',
          severity: 'critical',
          req,
          details: 'Blocked login with the public default admin password',
          autoBlock: false,
        });
        res.status(403).json({
          error:
            'The default admin password is disabled. Set a new SEED_ADMIN_PASSWORD of at least 12 characters in the server environment, restart the API, then log in.',
        });
        return;
      }
    }

    if (!user.isActive) {
      // A customer blocked from the owner's dashboard must not learn anything
      // beyond the fact that the account is closed. Admins keep the generic
      // deactivation response used by the rest of the auth flow.
      if (user.role === 'CUSTOMER') {
        return res.status(403).json({
          error: 'This account has been blocked by the store. Please contact us if you think this is a mistake.',
          code: 'ACCOUNT_BLOCKED',
        });
      }
      throw new Unauthorized('Account is deactivated');
    }

    // Only the owner's admins and customers may sign in.
    if (!canSignIn(user.role)) {
      reportSecurityEvent({
        type: 'failed_login',
        severity: 'medium',
        req,
        details: `Blocked unknown role login for ${email.slice(0, 3)}***`,
        autoBlock: false,
        notify: false,
      });
      return res.status(403).json({
        error: 'This account does not have valid credentials.',
      });
    }

    // A customer account is only active after its email was confirmed. Without
    // this, anyone could register with a victim's address and read their orders.
    if (user.role === 'CUSTOMER' && !user.emailVerified) {
      return res.status(403).json({
        error:
          'Please confirm your email address before signing in. Check your inbox for the confirmation link.',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    // 3. Second factor. Mandatory enrolment applies to the owner's accounts
    // only; customers keep two-factor authentication optional.
    const mustEnrolTwoFactor = isAdminAccount(user.role) && twoFactorRequired();

    if (!user.twoFactorEnabled) {
      if (mustEnrolTwoFactor) {
        // The password is correct, but the account must enrol before it can
        // receive a session. The challenge token cannot access any API route.
        return res.json({
          twoFactorSetupRequired: true,
          challengeToken: signTwoFactorChallenge(user.id),
          user: { email: user.email, name: user.name },
        });
      }
      // Customers without a second factor continue to session creation.
    } else {
      const code = normalizeNumericCode(twoFactorCode || '');
      if (!code) {
        // 200: the password is valid and this is the expected next step, not
        // an error the client should treat as a failed login.
        return res.json({
          twoFactorRequired: true,
          challengeToken: signTwoFactorChallenge(user.id),
        });
      }

      let secondFactorOk = false;
      let remainingBackupCodes: string[] | null = null;

      if (/^\d{6}$/.test(code)) {
        secondFactorOk = verifyTotp(user.twoFactorSecret || '', code);
      }
      if (!secondFactorOk) {
        const consumed = consumeBackupCode(user.twoFactorBackupCodes || [], code);
        if (consumed.ok) {
          secondFactorOk = true;
          remainingBackupCodes = consumed.remaining;
        }
      }

      if (!secondFactorOk) {
        const locked = await recordFailedLogin(user);
        reportSecurityEvent({
          type: 'failed_totp',
          severity: 'high',
          req,
          details: `Failed second factor for ${email.slice(0, 3)}***`,
          autoBlock: false,
          notify: isAdminAccount(user.role),
        });
        if (locked) {
          return res.status(429).json({
            error: `Too many failed attempts. Try again in ${LOGIN_LOCK_MINUTES} minutes.`,
          });
        }
        return res.status(401).json({
          twoFactorRequired: true,
          error: 'Invalid two-factor code.',
        });
      }

      if (remainingBackupCodes) {
        await prisma.user.update({
          where: { id: user.id },
          data: { twoFactorBackupCodes: remainingBackupCodes },
        });
      }
    }

    // 4. Session Creation
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });

    const accessToken = await createSession(user, res);

    res.json({
      user: publicUser(user),
      accessToken,
    });

    await logAction(user.id, 'LOGIN', 'User', { email: user.email }, clientIp(req));

    // The owner asked to be paged for admin-panel sign-ins only; customer
    // logins stay quiet (their failures are still recorded without alerts).
    if (isAdminAccount(user.role)) {
      reportSecurityEvent({
        type: 'admin_login',
        severity: 'medium',
        req,
        details: `Admin signed in: ${email.slice(0, 3)}*** (${user.role})`,
        autoBlock: false,
      });
    }
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    console.error('[Auth Login Critical Error]:', err);
    throw new BadRequest('An unexpected error occurred. Please try again.');
  }
});

// --- Two-factor enrolment ------------------------------------------------
// These endpoints accept a short-lived challenge token, not a session: the
// password was verified, but no API access is granted until enrolment ends.

authRouter.post('/2fa/setup/start', async (req, res: Response) => {
  try {
    const { challengeToken } = twoFactorChallengeSchema.parse(req.body);
    const userId = await resolveTwoFactorChallenge(challengeToken);
    if (!userId) {
      return res.status(401).json({ error: 'Setup session expired. Sign in again.' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive || !canSignIn(user.role)) {
      return res.status(401).json({ error: 'Setup session is not valid for this account.' });
    }
    // Admins must have 2FA enabled, customers can optionally enroll
    if (user.twoFactorEnabled) {
      return res.status(400).json({ error: 'Two-factor authentication is already enabled.' });
    }

    const secret = generateTwoFactorSecret();
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorPendingSecret: secret },
    });

    res.json({
      issuer: TWO_FACTOR_ISSUER,
      account: user.email,
      secret,
      otpauthUrl: buildOtpauthUrl(secret, user.email),
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    console.error('[Auth] 2FA setup start error:', err);
    res.status(500).json({ error: 'Failed to start two-factor setup' });
  }
});

authRouter.post('/2fa/setup/confirm', async (req, res: Response) => {
  try {
    const { challengeToken, code } = twoFactorConfirmSchema.parse(req.body);
    const userId = await resolveTwoFactorChallenge(challengeToken);
    if (!userId) {
      return res.status(401).json({ error: 'Setup session expired. Sign in again.' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive || !canSignIn(user.role)) {
      return res.status(401).json({ error: 'Setup session is not valid for this account.' });
    }
    if (user.twoFactorEnabled) {
      return res.status(400).json({ error: 'Two-factor authentication is already enabled.' });
    }
    if (!user.twoFactorPendingSecret) {
      return res.status(400).json({ error: 'Start the setup before confirming a code.' });
    }

    if (!verifyTotp(user.twoFactorPendingSecret, code)) {
      reportSecurityEvent({
        type: 'failed_totp',
        severity: 'medium',
        req,
        details: 'Failed two-factor enrolment code',
        autoBlock: false,
        notify: isAdminAccount(user.role),
      });
      return res.status(400).json({
        error: 'Invalid code. Check your phone clock and try again.',
      });
    }

    const { codes, hashes } = generateBackupCodes();
    const tokenVersion = user.tokenVersion + 1;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: user.twoFactorPendingSecret,
        twoFactorPendingSecret: null,
        twoFactorBackupCodes: hashes,
        tokenVersion,
        refreshToken: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    const accessToken = await createSession(
      { ...user, tokenVersion, twoFactorEnabled: true },
      res
    );
    await logAction(user.id, 'TWO_FACTOR_ENABLED', 'User', undefined, clientIp(req));

    if (isAdminAccount(user.role)) {
      reportSecurityEvent({
        type: 'admin_login',
        severity: 'medium',
        req,
        details: `Admin completed 2FA setup and signed in: ${user.email.slice(0, 3)}*** (${user.role})`,
        autoBlock: false,
      });
    }

    res.json({
      ok: true,
      backupCodes: codes,
      user: publicUser({ ...user, twoFactorEnabled: true }),
      accessToken,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    console.error('[Auth] 2FA setup confirm error:', err);
    res.status(500).json({ error: 'Failed to enable two-factor authentication' });
  }
});

// Rotates the recovery codes. Requires a valid session and a current TOTP code.
authRouter.post('/2fa/backup-codes', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({ error: 'Two-factor authentication is not enabled.' });
    }
    const code = String(req.body?.code || '').replace(/\s+/g, '');
    if (!verifyTotp(user.twoFactorSecret || '', code)) {
      return res.status(401).json({ error: 'Invalid two-factor code.' });
    }

    const { codes, hashes } = generateBackupCodes();
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorBackupCodes: hashes },
    });
    await logAction(user.id, 'TWO_FACTOR_BACKUP_CODES_ROTATED', 'User', undefined, clientIp(req));
    res.json({ ok: true, backupCodes: codes });
  } catch (err) {
    console.error('[Auth] 2FA backup codes error:', err);
    res.status(500).json({ error: 'Failed to regenerate backup codes' });
  }
});

// Emergency recovery: if the security monitor blocked the owner's IP, this
// endpoint can clear that block with the admin gate code. It is deliberately
// reachable even while blocked (auth paths are exempt from the block check),
// and it never reveals the gate code.
authRouter.post('/unblock', async (req, res: Response) => {
  try {
    const code = String(req.body?.code || '');
    const envCode = resolveGateCode();
    if (!envCode) {
      return res.status(503).json({
        error: 'Admin gate is disabled. Set a new ADMIN_GATE_CODE of at least 16 characters in the server environment.',
      });
    }
    if (!gateCodeMatches(code, envCode)) {
      reportSecurityEvent({
        type: 'admin_gate',
        severity: 'high',
        req,
        details: 'Invalid admin gate code (unblock)',
        autoBlock: false,
      });
      return res.status(401).json({ error: 'Invalid gate code' });
    }
    const ip = clientIp(req);
    const removed = unblockIp(ip);
    res.json({ ok: true, unblocked: removed });
  } catch {
    res.status(500).json({ error: 'Failed to unblock' });
  }
});

authRouter.post('/forgot-password', async (req, res: Response) => {
  try {
    const { email: rawEmail } = forgotSchema.parse(req.body);
    const email = normalizeEmail(rawEmail);
    const user = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });

    if (!user) {
      return res.status(200).json({ ok: true });
    }

    // Password-reset emails are sent to all active admin and customer accounts.
    if (!canSignIn(user.role)) {
      return res.status(200).json({ ok: true });
    }

    // An unconfirmed account cannot sign in yet, so a reset link is useless.
    // Send the confirmation email instead; the response stays generic.
    if (user.role === 'CUSTOMER' && !user.emailVerified) {
      if (isTransactionalEmailConfigured()) await issueEmailVerification(user);
      return res.status(200).json({ ok: true });
    }

    const { token, tokenHash, expiresAt } = await generateResetToken();

    await prisma.user.update({
      where: { email },
      data: { resetToken: tokenHash, resetTokenExpires: expiresAt },
    });

    await sendResetEmail(email, token, user.name);
    res.status(200).json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    console.error('[Auth] Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

authRouter.post('/reset-password', async (req, res: Response) => {
  // The reset screen posts a normal HTML form; scripts and API clients post JSON.
  // Both paths share the exact same token validation and single-use update.
  const contentType = String(req.headers['content-type'] || '');
  const wantsHtml = contentType.startsWith('application/x-www-form-urlencoded');
  const respond = (status: number, error?: string, apiError?: string) => {
    if (!wantsHtml) {
      return error
        ? res.status(status).json({ error: apiError || error })
        : res.status(200).json({ ok: true });
    }
    return error
      ? sendResetResultPage(res, status, false, error)
      : sendResetResultPage(res, 200, true, 'تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.');
  };

  try {
    if (
      wantsHtml &&
      String(req.body?.confirmPassword ?? '') !== String(req.body?.password ?? '')
    ) {
      return respond(400, 'كلمتا المرور غير متطابقتين.');
    }

    const { token, password } = resetSchema.parse(req.body);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const now = new Date();
    const passwordHash = await bcrypt.hash(password, 12);
    // A conditional update makes the token single-use even if two reset
    // requests arrive at the same time. Only the raw token from the email
    // link can produce this stored hash.
    const result = await prisma.user.updateMany({
      where: { resetToken: tokenHash, resetTokenExpires: { gt: now } },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpires: null,
        refreshToken: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
        tokenVersion: { increment: 1 },
      },
    });
    if (result.count !== 1) {
      return respond(
        400,
        'الرابط غير صالح أو انتهت صلاحيته. اطلب رابطاً جديداً.',
        'Reset link is invalid or expired'
      );
    }

    return respond(200);
  } catch (err) {
    if (err instanceof z.ZodError) {
      if (wantsHtml) return respond(400, 'كلمة المرور يجب أن تكون 12 حرفاً على الأقل.');
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    console.error('[Auth] Reset password error:', err);
    return respond(500, 'تعذّر تغيير كلمة المرور. حاول مرة أخرى.', 'Failed to process request');
  }
});

authRouter.get('/reset-password', async (req, res) => {
  try {
    const { token } = req.query as { token?: string };
    // Tokens are generated as 32 random bytes encoded in hex. Enforcing that
    // format also keeps the value safe when it is embedded in the hidden form
    // field. Trim first: copying a link from an email often adds a space.
    const sanitizedToken = String(token || '').trim();
    if (!/^[a-f0-9]{64}$/i.test(sanitizedToken)) return sendInvalidResetPage(res);

    // No inline script here: the edge CSP can override a page-level nonce
    // policy, which used to turn the form into a native GET that dropped the
    // token and put the password in the address bar. A plain POST form works
    // under both the server and the edge policy.
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"
    );
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');

    res.type('html').send(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="noindex, nofollow" />
        <title>إعادة تعيين كلمة المرور | AOS Tech Store</title>
        <style>
          body { font-family: system-ui, -apple-system, "Segoe UI", Tahoma, sans-serif; background: radial-gradient(circle at 50% 25%, #1e3a8a 0%, #0f172a 55%, #020617 100%); color: #e2e8f0; margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px; }
          .card { background: #111f38; border: 1px solid rgba(96,165,250,.22); border-radius: 28px; box-shadow: 0 0 50px rgba(59,130,246,.16); padding: 40px 32px; max-width: 420px; width: 100%; box-sizing: border-box; }
          .brand { text-align: center; font-size: 12px; letter-spacing: .3em; color: #60a5fa; font-weight: 800; margin-bottom: 22px; }
          h1 { margin: 0 0 10px; font-size: 21px; text-align: center; }
          .hint { margin: 0 0 20px; font-size: 13.5px; line-height: 1.9; color: #94a3b8; text-align: center; }
          label { display: block; font-size: 12.5px; font-weight: 700; color: #cbd5e1; margin: 14px 0 6px; }
          input { width: 100%; box-sizing: border-box; padding: 14px 18px; background: #0a162b; border: 1px solid rgba(255,255,255,.08); border-radius: 16px; color: #e2e8f0; font-size: 15px; outline: none; }
          input:focus { border-color: rgba(56,189,248,.7); background: #0b1a32; }
          button { width: 100%; margin-top: 22px; padding: 15px; background: linear-gradient(90deg,#2563eb,#38bdf8); color: #fff; border: none; border-radius: 16px; font-size: 16px; font-weight: 800; cursor: pointer; }
          .muted { margin-top: 18px; font-size: 11.5px; color: #64748b; text-align: center; line-height: 1.8; }
        </style>
      </head>
      <body>
        <main class="card">
          <div class="brand">AOS TECH STORE</div>
          <h1>إعادة تعيين كلمة المرور</h1>
          <p class="hint">أدخل كلمة المرور الجديدة (12 حرفاً على الأقل).</p>
          <form method="POST" action="/api/auth/reset-password">
            <input type="hidden" name="token" value="${escapeHtml(sanitizedToken)}" />
            <label for="password">كلمة المرور الجديدة</label>
            <input id="password" type="password" name="password" required minlength="12" autocomplete="new-password" placeholder="••••••••••••" />
            <label for="confirmPassword">تأكيد كلمة المرور</label>
            <input id="confirmPassword" type="password" name="confirmPassword" required minlength="12" autocomplete="new-password" placeholder="••••••••••••" />
            <button type="submit">حفظ كلمة المرور</button>
          </form>
          <p class="muted" dir="ltr">New password (12+ characters) · Nouveau mot de passe (12 caractères minimum)</p>
        </main>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('[Auth] Reset password GET error:', err);
    res.status(500).send('Error');
  }
});

authRouter.post('/admin-reset-password', async (req, res: Response) => {
  try {
    const { code, email, password, resetTwoFactor } = adminResetSchema.parse(req.body);
    const envCode = resolveGateCode();
    if (!envCode) {
      return res.status(503).json({
        error:
          'Admin gate is disabled. Set a new ADMIN_GATE_CODE of at least 16 characters in the server environment.',
      });
    }
    if (!gateCodeMatches(code, envCode)) {
      reportSecurityEvent({
        type: 'admin_gate',
        severity: 'high',
        req,
        details: 'Invalid admin gate code (admin reset)',
        autoBlock: false,
      });
      return res.status(401).json({ error: 'Invalid gate code' });
    }
    const user = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        tokenVersion: { increment: 1 },
        refreshToken: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
        ...(resetTwoFactor
          ? {
              twoFactorEnabled: false,
              twoFactorSecret: null,
              twoFactorPendingSecret: null,
              twoFactorBackupCodes: [],
            }
          : {}),
      },
    });
    res.clearCookie('refreshToken');
    if (resetTwoFactor) {
      console.log('[Auth] Admin reset also cleared two-factor authentication');
    }
    console.log(`[Auth] Admin reset password for ${email.slice(0, 3)}***`);
    res.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    console.error('[Auth] Admin reset error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

authRouter.post('/refresh', async (req, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new Unauthorized('No refresh token');

  let payload: { userId: string; tokenVersion: number };
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new Unauthorized('Invalid refresh token');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || user.refreshToken !== token || !user.isActive) {
    throw new Unauthorized('Invalid refresh token');
  }

  // A password change or a second-factor change bumps tokenVersion and must
  // terminate every session issued before it.
  if (payload.tokenVersion !== user.tokenVersion) {
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: null } });
    throw new Unauthorized('Session expired. Sign in again.');
  }

  // Idle sessions are closed server-side, not only by the browser cookie.
  // This applies to every role, including the owner's admin accounts.
  const idleMinutes = Math.max(5, Number(process.env.SESSION_IDLE_MINUTES || 120) || 120);
  if (
    user.lastActivityAt &&
    Date.now() - user.lastActivityAt.getTime() > idleMinutes * 60 * 1000
  ) {
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: null } });
    throw new Unauthorized('Session expired due to inactivity');
  }

  // A customer whose email is no longer confirmed must not keep a session.
  if (user.role === 'CUSTOMER' && !user.emailVerified) {
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: null } });
    throw new Unauthorized('Please confirm your email address before signing in.');
  }

  // Admins must still have the mandatory second factor; customers keep it optional.
  if (isAdminAccount(user.role) && twoFactorRequired() && !user.twoFactorEnabled) {
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: null } });
    throw new Unauthorized('Two-factor authentication setup is required');
  }

  const accessToken = await createSession(user, res);
  res.json({
    user: publicUser(user),
    accessToken,
  });
});

authRouter.post('/logout', requireAuth, async (req: AuthRequest, res: Response) => {
  await prisma.user.update({
    where: { id: req.userId },
    data: { refreshToken: null },
  });

  res.clearCookie('refreshToken', { path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production', httpOnly: true });
  res.clearCookie('aos_session', { path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  await logAction(req.userId, 'LOGOUT', 'User', undefined, clientIp(req));
  res.json({ message: 'Logged out' });
});

authRouter.post('/change-password', requireAuth, async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) throw new Unauthorized('User not found');

  const validCurrent = user.passwordHash
    ? await bcrypt.compare(currentPassword, user.passwordHash)
    : false;
  if (!validCurrent) {
    reportSecurityEvent({
      type: 'failed_login',
      severity: 'high',
      req,
      details: 'Failed password change attempt',
      autoBlock: false,
      notify: isAdminAccount(user.role),
    });
    throw new BadRequest('Current password is incorrect');
  }

  if (user.passwordHash && (await bcrypt.compare(newPassword, user.passwordHash))) {
    throw new BadRequest('New password must be different from the current password');
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, tokenVersion: { increment: 1 }, refreshToken: null },
  });

  // Keep this device signed in with a fresh token pair; every other session
  // is invalidated by the tokenVersion bump above.
  const accessToken = await createSession(updated, res);
  await logAction(req.userId, 'PASSWORD_CHANGED', 'User', { role: user.role }, clientIp(req));
  res.json({ ok: true, accessToken });
});

authRouter.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: { addresses: true },
  });
  if (!user) throw new Unauthorized('User not found');

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    avatar: user.avatar,
    role: user.role,
    twoFactorEnabled: user.twoFactorEnabled,
    addresses: user.addresses,
  });
});

// --- Social sign-in routes ---

/**
 * Public capability probe. The storefront only renders a provider button when
 * that provider is actually configured, so customers never hit a dead button.
 * Credentials are never returned.
 */
authRouter.get('/oauth/providers', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({
    google: Boolean(oauthCredentials('google')),
    github: Boolean(oauthCredentials('github')),
  });
});

authRouter.get('/oauth/:provider', (req, res) => {
  const provider = String(req.params.provider || '').toLowerCase();
  if (!isOAuthProvider(provider)) return res.redirect(302, `${siteUrl()}/login?oauth=unavailable`);

  const credentials = oauthCredentials(provider);
  if (!credentials) return res.redirect(302, `${siteUrl()}/login?oauth=unavailable`);

  const state = crypto.randomBytes(24).toString('hex');
  const verifier = provider === 'google' ? crypto.randomBytes(48).toString('base64url') : undefined;
  const flow: OAuthFlow = {
    provider,
    state,
    verifier,
    exp: Date.now() + OAUTH_FLOW_MINUTES * 60 * 1000,
  };

  res.cookie(OAUTH_COOKIE, signOAuthFlow(flow), oauthCookieOptions());
  res.setHeader('Cache-Control', 'no-store');

  const redirectUri = oauthCallbackUrl(provider);

  if (provider === 'google') {
    const params = new URLSearchParams({
      client_id: credentials.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      prompt: 'select_account',
      code_challenge: crypto
        .createHash('sha256')
        .update(verifier as string)
        .digest('base64url'),
      code_challenge_method: 'S256',
    });
    return res.redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  }

  // GitHub OAuth Apps do not support PKCE; the signed state cookie still binds
  // the callback to this browser.
  const params = new URLSearchParams({
    client_id: credentials.clientId,
    redirect_uri: redirectUri,
    scope: 'read:user user:email',
    state,
    allow_signup: 'true',
  });
  return res.redirect(302, `https://github.com/login/oauth/authorize?${params.toString()}`);
});

authRouter.get('/oauth/:provider/callback', async (req, res) => {
  const provider = String(req.params.provider || '').toLowerCase();
  const fail = (reason: string) =>
    res.redirect(302, `${siteUrl()}/login?oauth=${encodeURIComponent(reason)}`);

  // The flow cookie is single-use, whatever the outcome.
  res.clearCookie(OAUTH_COOKIE, oauthCookieClearOptions());

  if (!isOAuthProvider(provider)) return fail('unavailable');
  const credentials = oauthCredentials(provider);
  if (!credentials) return fail('unavailable');

  // `error=access_denied` means the customer pressed cancel on the provider.
  if (req.query.error) return fail('denied');

  const flow = readOAuthFlow(req.cookies?.[OAUTH_COOKIE]);
  const state = String(req.query.state || '');
  if (!flow || flow.provider !== provider || flow.state !== state) return fail('failed');

  const code = String(req.query.code || '');
  if (!code) return fail('denied');

  try {
    const accessToken = await exchangeOAuthCode(
      provider,
      credentials,
      code,
      oauthCallbackUrl(provider),
      flow.verifier
    );
    if (!accessToken) return fail('failed');

    const profile = await fetchOAuthProfile(provider, accessToken);
    if (!profile) return fail('failed');
    if (!profile.email || !profile.emailVerified) return fail('denied');

    let user = await prisma.user.findUnique({ where: { email: profile.email } });

    if (user && user.role !== 'CUSTOMER') {
      // Owner/admin accounts remain on the password + second-factor path.
      // This is an admin sign-in attempt, so it alerts the owner.
      reportSecurityEvent({
        type: 'failed_login',
        severity: 'high',
        req,
        details: `Admin account attempted ${provider} social sign-in`,
        autoBlock: false,
        notify: true,
      });
      return fail('admin');
    }

    if (user && !user.isActive) return fail('disabled');

    if (!user) {
      // OAuth accounts start without a usable password. Forgot-password is the
      // path to set one later; the provider already verified the email.
      const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);
      user = await prisma.user.create({
        data: {
          email: profile.email,
          name: profile.name || profile.email.split('@')[0],
          passwordHash,
          emailVerified: true,
          avatar: profile.avatar ?? null,
          role: 'CUSTOMER',
        },
      });
      await logAction(user.id, 'OAUTH_REGISTER', 'User', { provider }, clientIp(req));
      // Social sign-up needs no confirmation step, so the welcome mail simply
      // announces that the account is ready. It must not delay the redirect.
      void sendCustomerWelcomeEmail({
        email: user.email,
        name: user.name,
        mode: 'ready',
        actionUrl: `${siteUrl()}/`,
        storeUrl: siteUrl(),
      }).catch((err) => console.error('[Auth] Welcome email failed:', err));
    } else {
      // The provider proved ownership of this address. Clear any password
      // lockout and fill a missing avatar without touching the local password.
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          failedLoginAttempts: 0,
          lockedUntil: null,
          avatar: user.avatar || profile.avatar || null,
        },
      });
      await logAction(user.id, 'OAUTH_LOGIN', 'User', { provider }, clientIp(req));
    }

    await createSession(user, res);
    return res.redirect(302, `${siteUrl()}/#account`);
  } catch (err) {
    console.error('[Auth] OAuth callback failed:', err);
    return fail('failed');
  }
});
