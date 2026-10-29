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

export function signAccessToken(payload: { userId: string; role: string }) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN as any });
}

export function signRefreshToken(payload: { userId: string }) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN as any });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, SECRET) as { userId: string; role: string };
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, REFRESH_SECRET) as { userId: string };
}
