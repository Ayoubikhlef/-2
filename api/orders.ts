import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query, ensureTables, mapOrder } from '../shared/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const parts = url.pathname.replace(/^\/api\/orders\/?/, '').split('/').filter(Boolean);

  try {
    await ensureTables();

    // PATCH /api/orders/:id/status
    if (req.method === 'PATCH' && parts.length === 2 && parts[1] === 'status') {
      const id = parts[0];
      const { status } = req.body || {};
      if (!status) return res.status(400).json({ error: 'Missing status' });

      const result = await query(`UPDATE aos_orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`, [status, id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
      return res.json(mapOrder(result.rows[0]));
    }

    // POST /api/orders
    if (req.method === 'POST') {
      const { customer, phone, email, wilaya, municipality, address, note, items, total, source } = req.body || {};
      if (!customer || !phone) return res.status(400).json({ error: 'Missing required fields' });

      const id = crypto.randomUUID();
      const result = await query(
        `INSERT INTO aos_orders (id, customer, phone, email, wilaya, municipality, address, note, items, total, source) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [id, customer, phone, email || '', wilaya || '', municipality || '', address || '', note || '', JSON.stringify(items || []), total || 0, source || 'form']
      );
      return res.status(201).json(mapOrder(result.rows[0]));
    }

    // GET /api/orders
    if (req.method === 'GET') {
      const result = await query(`SELECT * FROM aos_orders ORDER BY created_at DESC`);
      return res.json(result.rows.map(mapOrder));
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[Orders]', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
