/**
 * People often paste a Google Images search/result page instead of the image
 * file itself. Pull the real file out when we can, otherwise return the input
 * trimmed and de-quoted.
 */
export function normalizeImageUrl(raw?: string | null): string {
  const value = (raw || '').trim().replace(/^['"]+|['"]+$/g, '');
  if (!value) return '';

  const fromImgres = value.match(/[?&]imgurl=([^&#]+)/);
  if (fromImgres) {
    try {
      const decoded = decodeURIComponent(fromImgres[1]);
      if (/^(https?:\/\/|\/)/i.test(decoded)) return decoded;
    } catch {}
  }

  return value;
}

export function isImageUrl(url?: string | null): boolean {
  const value = normalizeImageUrl(url);
  if (!/^(https?:\/\/|\/)/i.test(value)) return false;
  try {
    // A Google results page is a link, not a picture — the classic mistake.
    const parsed = new URL(value, 'https://placeholder.invalid');
    if (/(^|\.)google\./i.test(parsed.hostname) && parsed.pathname.startsWith('/search')) return false;
  } catch {}
  return true;
}
