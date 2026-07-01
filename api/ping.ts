export default async function handler(req: any, res: any) {
  res.json({ pong: true, time: Date.now(), db: !!process.env.POSTGRES_URL });
}
