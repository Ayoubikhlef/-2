/**
 * Mojibake detection and repair utility.
 *
 * Arabic UTF-8 bytes interpreted as Windows-1252 then re-encoded to UTF-8
 * produces garbled text. This module detects and reverses that double-encoding.
 *
 * Example: "كرت" → UTF-8 bytes D9 83 → Windows-1252 "Ùƒ" → UTF-8 "Ùƒ"
 */

// Windows-1252 byte → Unicode code point mapping for 0x80-0x9F range
const WIN1252_TO_UNICODE: Record<number, number> = {
  0x80: 0x20AC, 0x81: 0xFFFD, 0x82: 0x201A, 0x83: 0x0192,
  0x84: 0x201E, 0x85: 0x2026, 0x86: 0x2020, 0x87: 0x2021,
  0x88: 0x02C6, 0x89: 0x2030, 0x8A: 0x0160, 0x8B: 0x2039,
  0x8C: 0x0152, 0x8D: 0xFFFD, 0x8E: 0x017D, 0x8F: 0xFFFD,
  0x90: 0xFFFD, 0x91: 0x2018, 0x92: 0x2019, 0x93: 0x201C,
  0x94: 0x201D, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014,
  0x98: 0x02DC, 0x99: 0x2122, 0x9A: 0x0161, 0x9B: 0x203A,
  0x9C: 0x0153, 0x9D: 0xFFFD, 0x9E: 0x017E, 0x9F: 0x0178,
};

// Reverse: Unicode code point → Windows-1252 byte
const UNICODE_TO_WIN1252: Record<number, number> = {};
for (const [byte, code] of Object.entries(WIN1252_TO_UNICODE)) {
  if (code !== 0xFFFD) UNICODE_TO_WIN1252[code] = Number(byte);
}

function unicodeToWin1252Byte(codePoint: number): number | null {
  // Direct mapping for 0x00-0x7F (ASCII)
  if (codePoint <= 0x7F) return codePoint;
  // Check Windows-1252 special range 0x80-0x9F
  if (UNICODE_TO_WIN1252[codePoint] !== undefined) return UNICODE_TO_WIN1252[codePoint];
  // Direct mapping for 0xA0-0xFF (same as Latin-1)
  if (codePoint >= 0xA0 && codePoint <= 0xFF) return codePoint;
  // Not a single-byte Windows-1252 character
  return null;
}

function tryDecodeMojibake(str: string): string {
  try {
    // Convert each character back to its Windows-1252 byte value
    const bytes: number[] = [];
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      // Handle surrogate pairs
      if (code >= 0xD800 && code <= 0xDBFF && i + 1 < str.length) {
        const next = str.charCodeAt(i + 1);
        if (next >= 0xDC00 && next <= 0xDFFF) {
          const full = ((code - 0xD800) << 10) + (next - 0xDC00) + 0x10000;
          return str; // Can't be Windows-1252 if it has surrogate pairs > 0xFF
        }
      }
      const byte = unicodeToWin1252Byte(code);
      if (byte === null) return str; // Can't be mojibake
      bytes.push(byte);
    }

    // Try to decode as UTF-8
    const buf = Buffer.from(bytes);
    const decoded = buf.toString('utf8');

    // Check for replacement characters (invalid UTF-8)
    if (decoded.includes('\uFFFD')) return str;

    // Check if decoded text has Arabic characters
    const hasArabic =
      /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(decoded);

    // Check if original had NO Arabic but decoded has Arabic → was mojibake
    const origHasArabic =
      /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(str);

    if (hasArabic && !origHasArabic) return decoded;

    // Also accept if decoded is shorter (fewer characters = was double-encoded)
    if (hasArabic) return decoded;

    return str;
  } catch {
    return str;
  }
}

function hasHighCodePoints(str: string): boolean {
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code > 0x7F) return true;
  }
  return false;
}

function containsArabic(str: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(str);
}

/**
 * Detects and fixes mojibake in a string.
 * Returns the original string if it doesn't appear to be mojibake.
 */
export function fixMojibake(str: string): string {
  if (!str || typeof str !== 'string') return str;
  // If it already has Arabic, it's not mojibake
  if (containsArabic(str)) return str;
  // If it has no high code points, it's plain ASCII — nothing to fix
  if (!hasHighCodePoints(str)) return str;

  const fixed = tryDecodeMojibake(str);
  if (fixed !== str) {
    console.log(`[Encoding] Fixed mojibake: "${str.substring(0, 40)}..." → "${fixed.substring(0, 40)}..."`);
  }
  return fixed;
}

function fixObjectMojibake(obj: any, depth: number = 0): any {
  if (depth > 20) return obj;
  if (typeof obj === 'string') return fixMojibake(obj);
  if (Array.isArray(obj)) return obj.map(item => fixObjectMojibake(item, depth + 1));
  if (obj !== null && typeof obj === 'object') {
    const result: any = {};
    for (const key of Object.keys(obj)) {
      result[key] = fixObjectMojibake(obj[key], depth + 1);
    }
    return result;
  }
  return obj;
}

/**
 * Fixes mojibake in any JSON-serializable data structure.
 * Works recursively on objects, arrays, and strings.
 */
export function fixMojibakeData<T>(data: T): T {
  return fixObjectMojibake(data) as T;
}
