export default async function handler(_req: any, res: any) {
  let dbOk = false;
  let dbError = '';
  try {
    const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!url) throw new Error('No POSTGRES_URL env var');

    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(url);
    const result: any = await sql`SELECT 1 AS ok`;
    dbOk = result[0]?.ok === 1;
  } catch (err: any) {
    dbError = err.message;
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbOk ? 'connected' : `error: ${dbError}`,
  });
}
