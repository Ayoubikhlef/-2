export function getAllowedOrigins(): string[] {
  const raw = process.env.CORS_ORIGIN || 'http://localhost:5173,https://aostech.vercel.app,*.vercel.app';
  return raw
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
}

export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true;
  const allowedOrigins = getAllowedOrigins();
  if (allowedOrigins.includes(origin)) return true;
  return allowedOrigins.some((allowedOrigin) => {
    if (allowedOrigin.startsWith('*.')) {
      return origin.endsWith(allowedOrigin.slice(1));
    }
    return false;
  });
}
