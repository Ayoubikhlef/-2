/**
 * Must match `server/src/utils/phone.ts`: guest rows in the owner's dashboard
 * look up the flag the server stored under the normalized phone.
 */
export function normalizePhone(value: string | null | undefined): string {
  let digits = String(value ?? '').replace(/[^0-9]/g, '');
  if (!digits) return '';
  if (digits.startsWith('00213')) digits = digits.slice(5);
  else if (digits.startsWith('213') && digits.length >= 11) digits = digits.slice(3);
  if (digits.length === 9 && /^[5-7]/.test(digits)) return `0${digits}`;
  return digits;
}

export function normalizeEmail(value: string | null | undefined): string {
  return String(value ?? '').trim().toLowerCase();
}
