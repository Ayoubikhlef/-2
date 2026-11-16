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
import { clientIp, reportSecurityEvent, unblockIp } from '../services/security';
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
});

const forgotSchema = z.object({
  email: z.string().email(),
});

const resetSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/i),
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

async function sendVerificationEmail(email: string, token: string, userName: string): Promise<boolean> {
  const verifyUrl = `${apiBaseUrl()}/auth/verify-email?token=${encodeURIComponent(token)}`;
  const storeUrl = siteUrl();
  return sendTransactionalEmail(
    email,
    'Confirm your email - AOS Tech Store',
    `Hello ${userName},\n\nConfirm your email address to activate your AOS Tech Store account:\n${verifyUrl}\n\nThis link expires in ${EMAIL_VERIFICATION_HOURS} hours. If you did not create this account, ignore this message.`,
    `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e293b;">Confirm your email</h2>
        <p>Hello ${escapeHtml(userName)},</p>
        <p>Click the button below to activate your AOS Tech Store account and view your orders.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background-color: #1e293b; color: #f1f5f9; padding: 12px 28px; text-decoration: none; border-radius: 20px; font-weight: 700;">Confirm email</a>
        </div>
        <p>This link expires in ${EMAIL_VERIFICATION_HOURS} hours.</p>
        <p>If the button does not work, copy this address into your browser:</p>
        <p style="word-break: break-all; color: #475569;">${verifyUrl}</p>
        <p>If you did not create this account, ignore this message.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #cbd5e1;">
        <p style="font-size: 12px; color: #64748b;">&copy; 2026 AOS Tech Store. All rights reserved.</p>
        <p style="font-size: 12px;"><a href="${storeUrl}" style="color: #64748b;">${storeUrl}</a></p>
      </div>
    `
  );
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

    const { email: rawEmail, password, twoFactorCode } = loginSchema.parse(req.body);
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
      });
      if (locked) {
        return res.status(429).json({
          error: `Too many failed attempts. Try again in ${LOGIN_LOCK_MINUTES} minutes.`,
        });
      }
      throw new BadRequest('Invalid email or password');
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

    if (!user.isActive) throw new Unauthorized('Account is deactivated');

    // Only the owner's admins and customers may sign in.
    if (!canSignIn(user.role)) {
      reportSecurityEvent({
        type: 'failed_login',
        severity: 'medium',
        req,
        details: `Blocked unknown role login for ${email.slice(0, 3)}***`,
        autoBlock: false,
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
  try {
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
      return res.status(400).json({ error: 'Reset link is invalid or expired' });
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    console.error('[Auth] Reset password error:', err);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

authRouter.get('/reset-password', async (req, res) => {
  try {
    const { token } = req.query as { token?: string };
    // Tokens are generated as 32 random bytes encoded in hex. Enforcing that
    // format also keeps the value safe when the reset page embeds it in JS.
    if (!token || !/^[a-f0-9]{64}$/i.test(token)) return res.status(400).send('Invalid reset token');
    const sanitizedToken = token;

    // Helmet's global policy blocks inline scripts, so this page gets its own
    // nonce-based policy. Without it the form silently does nothing in
    // production.
    const nonce = crypto.randomBytes(18).toString('base64');
    res.setHeader(
      'Content-Security-Policy',
      `default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'`
    );
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');

    res.type('html').send(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Password</title>
        <style>
          body { font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 20px; }
          .card { background: #1e293b; border-radius: 28px; box-shadow: 0 0 40px rgba(59,130,246,.15); padding: 40px; max-width: 400px; margin: 0 auto; }
          input { width: 100%; padding: 15px; margin: 10px 0; background: #1e293b; border: none; border-radius: 20px; color: #e2e8f0; }
          button { width: 100%; padding: 15px; background: #1e293b; color: #e2e8f0; border: none; border-radius: 20px; font-size: 16px; font-weight: 700; cursor: pointer; }
          .error { color: #ef4444; margin: 10px 0; }
          .success { color: #22c55e; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Reset Password</h2>
          <p>Enter your new password (at least 12 characters):</p>
          <form id="resetForm">
            <input type="password" name="password" required minlength="12" autocomplete="new-password" placeholder="New password">
            <input type="password" name="confirmPassword" required minlength="12" autocomplete="new-password" placeholder="Confirm password">
            <button type="submit">Set New Password</button>
          </form>
          <div id="error" class="error"></div>
          <div id="success" class="success"></div>
        </div>
        <script nonce="${nonce}">
          const form = document.getElementById('resetForm');
          const errorDiv = document.getElementById('error');
          const successDiv = document.getElementById('success');

          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = form.password.value;
            const confirmPassword = form.confirmPassword.value;

            if (password !== confirmPassword) {
              errorDiv.textContent = 'Passwords do not match';
              return;
            }

            if (password.length < 12) {
              errorDiv.textContent = 'Password must be at least 12 characters';
              return;
            }

            errorDiv.textContent = '';
            successDiv.textContent = '';

            try {
              const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: ${JSON.stringify(sanitizedToken)}, password })
              });
              const data = await response.json();

              if (data.ok) {
                successDiv.textContent = 'Password reset successful! You can now log in.';
                setTimeout(() => window.location.href = '/', 2000);
              } else {
                errorDiv.textContent = data.error || 'Failed to reset password';
              }
            } catch (err) {
              errorDiv.textContent = 'An error occurred';
            }
          });
        </script>
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
