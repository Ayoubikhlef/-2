import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { prisma } from '../utils/prisma';
import { Unauthorized } from '../utils/errors';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export async function requireAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return next(new Unauthorized('No token provided'));

    const payload = verifyAccessToken(header.slice(7));
    const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { isActive: true, role: true } });
    if (!user || !user.isActive) return next(new Unauthorized('Account is deactivated'));
    req.userId = payload.userId;
    // Always authorize against the current database role, so role changes
    // take effect immediately instead of when an old access token expires.
    req.userRole = user.role;
    next();
  } catch {
    next(new Unauthorized('Invalid or expired token'));
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return next(new Unauthorized('Insufficient permissions'));
    }
    next();
  };
}
