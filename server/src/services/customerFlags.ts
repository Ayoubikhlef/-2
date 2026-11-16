import { prisma } from '../utils/prisma';
import { normalizeEmail, normalizePhone } from '../utils/phone';

/** Stable key for an account flag: one row per registered customer. */
export function accountFlagKey(userId: string): string {
  return `account:${userId}`;
}

/** Stable key for a guest flag: one row per normalized phone number. */
export function guestFlagKey(phone: string): string {
  return `guest:${normalizePhone(phone)}`;
}

/**
 * Returns the active block covering an identity, if any. Order creation calls
 * this with the phone/email typed at checkout, so a blocked customer cannot
 * order again by signing out or skipping the account form.
 */
export async function findActiveBlock(input: {
  userId?: string | null;
  phone?: string | null;
  email?: string | null;
}) {
  const phone = normalizePhone(input.phone);
  const email = normalizeEmail(input.email);
  const filters: { userId?: string; phone?: string; email?: string }[] = [];
  if (input.userId) filters.push({ userId: input.userId });
  if (phone) filters.push({ phone });
  if (email) filters.push({ email });
  if (filters.length === 0) return null;

  return prisma.customerFlag.findFirst({
    where: { blocked: true, OR: filters },
    select: { key: true, reason: true },
  });
}
