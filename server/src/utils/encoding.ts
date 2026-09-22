/**
 * Mojibake detection and repair utility.
 *
 * Two corruption patterns can occur when UTF-8 bytes are mis-decoded and
 * re-encoded as UTF-8:
 *  1. Windows-1252: "كرت" → D9 83 → "Ùƒ" → UTF-8 "Ùƒ"
 *  2. IBM CP437:    "ماوس" → D9 85 C3 A0 ... → box-drawing/Latin-1 mix
 *                   (the pattern found in the production DB)
 * This module detects and reverses both.
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

// IBM CP437 high byte (0x80-0xFF) → Unicode code point.
// 0x00-0x7F map to themselves for text purposes.
// Indices 0xC0-0xFF are approximate; production Arabic data only uses ≤0xDF.
const CP437_HIGH: number[] = [
  0x00C7,0x00FC,0x00E9,0x00E2,0x00E4,0x00E0,0x00E5,0x00E7,0x00EA,0x00EB,0x00E8,0x00EF,0x00EE,0x00EC,0x00C4,0x00C5,
  0x00C9,0x00E6,0x00C6,0x00F4,0x00F6,0x00F2,0x00FB,0x00F9,0x00FF,0x00D6,0x00DC,0x00A2,0x00A3,0x00A5,0x20A7,0x0192,
  0x00E1,0x00ED,0x00F3,0x00FA,0x00F1,0x00D1,0x00AA,0x00BA,0x00BF,0x2310,0x00AC,0x00BD,0x00BC,0x00A1,0x00AB,0x00BB,
  0x2591,0x2592,0x2593,0x2502,0x2524,0x2561,0x2562,0x2556,0x2555,0x2563,0x2551,0x2557,0x255D,0x255C,0x255B,0x2510,
  0x2514,0x2534,0x252C,0x251C,0x2500,0x253C,0x255E,0x255F,0x255A,0x2554,0x2569,0x2566,0x2560,0x2550,0x256C,0x2567,
  0x2568,0x2564,0x2565,0x2559,0x2558,0x2552,0x2553,0x256B,0x256A,0x2518,0x250C,0x2588,0x2584,0x258C,0x2590,0x2580,
  0x25A0,0x2122,0x2219,0x221A,0x2248,0x2264,0x2265,0x00B5,0x2260,0x00B1,0x2265,0x2264,0x2320,0x2321,0x00AC,0x2261,
  0x00B7,0x221A,0x2219,0x222B,0x222E,0x2248,0x2264,0x2265,0x00B5,0x2260,0x00B1,0x2265,0x2264,0x2320,0x2321,0x00AC,
];

// Unicode code point → CP437 byte (first mapping wins)
const UNICODE_TO_CP437: Record<number, number> = {};
for (let b = 0; b < 128; b++) {
  if (UNICODE_TO_CP437[b] === undefined) UNICODE_TO_CP437[b] = b;
}
for (let i = 0; i < CP437_HIGH.length; i++) {
  const cp = CP437_HIGH[i];
  if (UNICODE_TO_CP437[cp] === undefined) UNICODE_TO_CP437[cp] = 0x80 + i;
}

/**
 * Reverse IBM CP437 double-encoding: each character → CP437 byte → UTF-8 decode.
 * Returns null if the string cannot be this corruption pattern.
 */
function tryDecodeMojibakeCP437(str: string): string | null {
  try {
    const bytes: number[] = [];
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      if (code >= 0xD800 && code <= 0xDBFF && i + 1 < str.length) {
        const next = str.charCodeAt(i + 1);
        if (next >= 0xDC00 && next <= 0xDFFF) return null; // surrogate pair → not CP437
      }
      const byte = UNICODE_TO_CP437[code];
      if (byte === undefined) return null;
      bytes.push(byte);
    }
    const decoded = Buffer.from(bytes).toString('utf8');
    if (decoded.includes('\uFFFD')) return null;
    return decoded;
  } catch {
    return null;
  }
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

// Glyphs that only appear via CP437 mis-decoding of UTF-8 — never in normal site prose
// (box drawing, block elements, some math/arrows from the CP437 high range).
function hasCp437CorruptionMarkers(str: string): boolean {
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    // Box drawing + block elements (CP437 0xB0-0xDF region mapped here)
    if (c >= 0x2500 && c <= 0x259F) return true;
    // Full block range edge cases
    if (c === 0x2588 || c === 0x2584 || c === 0x258C || c === 0x2590 || c === 0x2580) return true;
    // Other CP437-only glyphs that don't appear in normal FR/AR prose
    if (c === 0x2219 || c === 0x2310 || c === 0x20A7 || c === 0x0192) return true;
  }
  return false;
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

  // 1) Try IBM CP437 reverse (the production corruption pattern)
  const viaCp437 = tryDecodeMojibakeCP437(str);
  if (viaCp437 !== null) {
    const decodedHasArabic = containsArabic(viaCp437);
    const markers = hasCp437CorruptionMarkers(str);
    if ((decodedHasArabic && !containsArabic(str)) || markers) {
      console.log(`[Encoding] Fixed CP437 mojibake: "${str.substring(0, 40)}..." → "${viaCp437.substring(0, 40)}..."`);
      return viaCp437;
    }
  }

  // 2) Fallback: Windows-1252 reverse
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
