export function getAllowedOrigins(): string[] {
  const raw = process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:4173,https://aostech.vercel.app';
  return raw
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
}

export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return false;
  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.includes(origin);
}
