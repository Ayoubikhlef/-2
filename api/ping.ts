export default async function handler(_req: any, res: any) {
  try {
    const url = process.env.POSTGRES_URL;
    const tls = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    const keys = Object.keys(process.env).filter(k => k.includes('POSTGRES') || k.includes('SUPABASE') || k.includes('TLS'));
    res.json({ env: { url: url ? 'yes' : 'no', tls, keys, node: process.version } });
  } catch (err: any) {
    res.json({ error: err.message });
  }
}
