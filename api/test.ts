import bcrypt from 'bcryptjs';

export default async function handler(_req: any, res: any) {
  try {
    const hash = await bcrypt.hash('test', 4);
    res.json({ ok: true, hash: hash.slice(0, 10) });
  } catch (err: any) {
    res.json({ ok: false, error: err.message });
  }
}
