/**
 * Mojibake detection and repair utility.
 *
 * Arabic text that was UTF-8 encoded, then the bytes were interpreted as
 * Latin-1 (ISO-8859-1) and re-encoded to UTF-8, produces garbled text like:
 *   "كرت" → UTF-8 bytes D9 83 D8 B1 → interpreted as Latin-1 → "ÙƒØ±Øª"
 *
 * This module detects and reverses that double-encoding.
 */

function isMojibakeCandidate(str: string): boolean {
  if (!str || typeof str !== 'string') return false;

  const hasHighLatin = /[\u00C0-\u00FF]/.test(str);

  const hasArabic =
    /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(str);

  if (hasArabic) return false;
  if (!hasHighLatin) return false;

  const hasCommonMojibake =
    /\u00C3[\u0080-\u00BF]/.test(str) ||
    /\u00C2[\u0080-\u00BF]/.test(str) ||
    /\u00D9[\u0080-\u00BF]/.test(str) ||
    /\u00D8[\u0080-\u00BF]/.test(str);

  return hasCommonMojibake;
}

function tryFixMojibake(str: string): string {
  try {
    const bytes = Buffer.from(str, 'latin1');
    const decoded = bytes.toString('utf8');

    const hasArabic =
      /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(decoded);

    const hasReplacementChar = decoded.includes('\uFFFD');

    if (hasArabic && !hasReplacementChar) {
      return decoded;
    }
    return str;
  } catch {
    return str;
  }
}

export function fixMojibake(str: string): string {
  if (!str || typeof str !== 'string') return str;
  if (!isMojibakeCandidate(str)) return str;
  const fixed = tryFixMojibake(str);
  if (fixed !== str) {
    console.log(`[Encoding] Fixed mojibake in string (${str.length} chars)`);
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
