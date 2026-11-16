/**
 * Canonical phone/email forms used to match customers across accounts, guest
 * orders and owner-managed blocks. The same algorithm runs in the browser so a
 * guest row can find the flag stored by the server.
 */
export function normalizePhone(value: string | null | undefined): string {
  let digits = String(value ?? '').replace(/[^0-9]/g, '');
  if (!digits) return '';
  // +213 / 00213 are the same Algerian number as the local 0-prefixed form.
  if (digits.startsWith('00213')) digits = digits.slice(5);
  else if (digits.startsWith('213') && digits.length >= 11) digits = digits.slice(3);
  if (digits.length === 9 && /^[5-7]/.test(digits)) return `0${digits}`;
  return digits;
}

export function normalizeEmail(value: string | null | undefined): string {
  return String(value ?? '').trim().toLowerCase();
}
