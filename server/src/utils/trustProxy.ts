/**
 * Trusted reverse-proxy detection.
 *
 * Render (and Vercel) terminate TLS on their edge and forward the request
 * through one or more internal hops. The socket address the app sees is
 * therefore private (for example 10.28.x.x), and Render may also append a
 * private hop to X-Forwarded-For.
 *
 * Express must trust those private hops to reach the real client, but it must
 * never trust a public address: X-Forwarded-For is attacker-controlled, and
 * trusting its left-most value would let anyone forge their IP (and get an
 * arbitrary address blocked by the security monitor).
 *
 * `trust proxy` is set to this function, so Express walks the chain from the
 * socket outwards and stops at the first public address.
 */
export function normalizeIp(value: string | undefined | null): string {
  const raw = String(value || '').trim();
  if (!raw) return '';
  // IPv4-mapped IPv6, e.g. ::ffff:10.0.0.1
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(raw);
  if (mapped) return mapped[1];
  // Strip an IPv6 zone index, e.g. fe80::1%eth0
  return raw.split('%')[0];
}

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4) return false;
  if (parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b, c] = parts;
  return (
    a === 0 || // "this" network
    a === 10 || // private
    a === 127 || // loopback
    (a === 100 && b >= 64 && b <= 127) || // CGNAT
    (a === 169 && b === 254) || // link-local
    (a === 172 && b >= 16 && b <= 31) || // private
    (a === 192 && b === 168) || // private
    (a === 192 && b === 0 && c === 0) || // IETF protocol assignments
    (a === 198 && (b === 18 || b === 19)) // benchmarking
  );
}

function isPrivateIpv6(ip: string): boolean {
  const value = ip.toLowerCase();
  if (value === '::1' || value === '::') return true;
  // Link-local fe80::/10
  if (/^fe[89ab][0-9a-f]:/.test(value)) return true;
  // Unique local fc00::/7
  if (/^f[cd][0-9a-f]{2}:/.test(value)) return true;
  return false;
}

export function isTrustedProxy(ip: string): boolean {
  const address = normalizeIp(ip);
  if (!address) return false;
  if (address.includes(':')) return isPrivateIpv6(address);
  return isPrivateIpv4(address);
}

function firstHeaderIp(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return normalizeIp(String(raw || '').split(',')[0]);
}

/**
 * The real visitor address behind Cloudflare -> Vercel -> Render.
 *
 * Express's `req.ip` stops at the first public hop, which is the Cloudflare or
 * Vercel edge (for example 104.22.72.10) and can change between two requests
 * from the same visitor. Vercel overwrites `x-vercel-forwarded-for` with the
 * address it saw, and Cloudflare does the same for `cf-connecting-ip`, so those
 * are stable per visitor when the socket is a trusted proxy hop.
 *
 * A direct caller to the Render URL keeps its own socket address: the headers
 * are only honoured when the socket itself is a private proxy hop, so a
 * forged header cannot move the resolved address somewhere else.
 */
export function resolveClientIp(req: {
  headers?: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
}): string {
  const socket = normalizeIp(req.socket?.remoteAddress);
  if (!isTrustedProxy(socket)) return socket || 'unknown';

  const vercel = firstHeaderIp(req.headers?.['x-vercel-forwarded-for']);
  if (vercel && !isTrustedProxy(vercel)) return vercel;

  const cloudflare = firstHeaderIp(req.headers?.['cf-connecting-ip']);
  if (cloudflare && !isTrustedProxy(cloudflare)) return cloudflare;

  // Fall back to the right-most public hop: the left-most value in
  // X-Forwarded-For is attacker-controlled.
  const chain = String(req.headers?.['x-forwarded-for'] || '')
    .split(',')
    .map((part) => normalizeIp(part))
    .filter(Boolean);
  for (let index = chain.length - 1; index >= 0; index -= 1) {
    if (!isTrustedProxy(chain[index])) return chain[index];
  }

  return socket || 'unknown';
}
