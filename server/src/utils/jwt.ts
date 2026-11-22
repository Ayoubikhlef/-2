import jwt from 'jsonwebtoken';

function requireEnv(name: string): string {
  const val = process.env[name]?.trim();
  if (!val || val.length < 32) {
    throw new Error(`[JWT] ${name} must be configured with at least 32 characters before the API can start`);
  }
  return val;
}

const SECRET = requireEnv('JWT_SECRET');
const REFRESH_SECRET = requireEnv('JWT_REFRESH_SECRET');
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const TWO_FACTOR_AUDIENCE = 'aos-2fa-challenge';
const SITE_ADMIN_AUDIENCE = 'aos-site-admin';

export interface AccessTokenPayload {
  userId: string;
  role: string;
  tokenVersion: number;
}

export function signAccessToken(payload: { userId: string; role: string; tokenVersion?: number }) {
  return jwt.sign(
    {
      userId: String(payload.userId),
      role: String(payload.role),
      tv: Number(payload.tokenVersion || 0),
    },
    SECRET,
    { expiresIn: EXPIRES_IN as any }
  );
}

export function signRefreshToken(payload: { userId: string; tokenVersion?: number }) {
  return jwt.sign(
    {
      userId: String(payload.userId),
      tv: Number(payload.tokenVersion || 0),
    },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN as any }
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, SECRET) as jwt.JwtPayload & {
    userId?: string;
    role?: string;
    tv?: number;
    typ?: string;
  };
  // Two-factor challenge tokens are signed with the same key but must never be
  // accepted as a session token.
  if (!payload?.userId || payload.typ) throw new Error('Invalid access token');
  return {
    userId: String(payload.userId),
    role: String(payload.role || ''),
    tokenVersion: Number(payload.tv || 0),
  };
}

export function verifyRefreshToken(token: string) {
  const payload = jwt.verify(token, REFRESH_SECRET) as jwt.JwtPayload & {
    userId?: string;
    tv?: number;
  };
  if (!payload?.userId) throw new Error('Invalid refresh token');
  return { userId: String(payload.userId), tokenVersion: Number(payload.tv || 0) };
}

/**
 * Short-lived proof that a password was verified but the second factor is
 * still pending. It is scoped to a dedicated audience so it cannot be used to
 * call authenticated endpoints.
 */
export function signTwoFactorChallenge(userId: string) {
  return jwt.sign({ userId: String(userId), typ: '2fa_challenge' }, SECRET, {
    expiresIn: '10m',
    audience: TWO_FACTOR_AUDIENCE,
  });
}

export function verifyTwoFactorChallenge(token: string) {
  const payload = jwt.verify(token, SECRET, { audience: TWO_FACTOR_AUDIENCE }) as jwt.JwtPayload & {
    userId?: string;
    typ?: string;
  };
  if (payload?.typ !== '2fa_challenge' || !payload?.userId) {
    throw new Error('Invalid two-factor challenge');
  }
  return { userId: String(payload.userId) };
}

/**
 * Short session for the owner dashboard of one generated site. The dedicated
 * audience means a normal user access token can never open a site dashboard,
 * and vice versa. `version` is bumped whenever the owner link is rotated,
 * which immediately invalidates every session issued from the old link.
 */
export function signSiteAdminSession(siteId: string, version: number) {
  return jwt.sign({ siteId: String(siteId), v: Number(version) || 0 }, SECRET, {
    expiresIn: '12h',
    audience: SITE_ADMIN_AUDIENCE,
  });
}

export function verifySiteAdminSession(token: string) {
  const payload = jwt.verify(token, SECRET, { audience: SITE_ADMIN_AUDIENCE }) as jwt.JwtPayload & {
    siteId?: string;
    v?: number;
  };
  if (!payload?.siteId) throw new Error('Invalid site admin session');
  return { siteId: String(payload.siteId), version: Number(payload.v || 0) };
}
