import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb, ensureTables, mapOrder } from './lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const parts = url.pathname.replace(/^\/api\/orders\/?/, '').split('/').filter(Boolean);

  try {
    await ensureTables();
    const db = getDb();

    // PATCH /api/orders/:id/status
    if (req.method === 'PATCH' && parts.length === 2 && parts[1] === 'status') {
      const id = parts[0];
      const { status } = req.body || {};
      if (!status) return res.status(400).json({ error: 'Missing status' });

      const result: any[] = await db`UPDATE aos_orders SET status = ${status}, updated_at = NOW() WHERE id = ${id} RETURNING *`;
      if (result.length === 0) return res.status(404).json({ error: 'Order not found' });
      return res.json(mapOrder(result[0]));
    }

    // POST /api/orders
    if (req.method === 'POST') {
      const { customer, phone, email, wilaya, municipality, address, note, items, total, source } = req.body || {};
      if (!customer || !phone) return res.status(400).json({ error: 'Missing required fields' });

      const id = crypto.randomUUID();
      const result: any[] = await db`
        INSERT INTO aos_orders (id, customer, phone, email, wilaya, municipality, address, note, items, total, source)
        VALUES (${id}, ${customer}, ${phone}, ${email || ''}, ${wilaya || ''}, ${municipality || ''}, ${address || ''}, ${note || ''}, ${JSON.stringify(items || [])}, ${total || 0}, ${source || 'form'})
        RETURNING *
      `;
      return res.status(201).json(mapOrder(result[0]));
    }

    // GET /api/orders
    if (req.method === 'GET') {
      const rows: any[] = await db`SELECT * FROM aos_orders ORDER BY created_at DESC`;
      return res.json(rows.map(mapOrder));
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[Orders]', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
