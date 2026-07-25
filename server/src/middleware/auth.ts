import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { prisma } from '../utils/prisma';
import { Unauthorized } from '../utils/errors';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export async function requireAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new Unauthorized('No token provided');

  try {
    const payload = verifyAccessToken(header.slice(7));
    const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { isActive: true } });
    if (!user || !user.isActive) throw new Unauthorized('Account is deactivated');
    req.userId = payload.userId;
    req.userRole = payload.role;
    next();
  } catch {
    throw new Unauthorized('Invalid or expired token');
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      throw new Unauthorized('Insufficient permissions');
    }
    next();
  };
}
