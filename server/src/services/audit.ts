import { prisma } from '../utils/prisma';
import { Prisma } from '@prisma/client';

export async function logAction(
  userId: string | undefined,
  action: string,
  resource: string | undefined,
  details?: Prisma.InputJsonValue,
  ipAddress?: string
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        details,
        ipAddress,
      },
    });
  } catch (err) {
    console.error('[AuditService] Failed to log action:', err);
  }
}
