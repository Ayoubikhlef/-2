import { Pool } from 'pg';
import { z } from 'zod';

let pool: Pool | null = null;
function getPool() {
  if (!pool) pool = new Pool({ connectionString: process.env.POSTGRES_URL, max: 3 });
  return pool;
}

async function query(text: string, params?: any[]) {
  const c = await getPool().connect();
  try { return await c.query(text, params); } finally { c.release(); }
}

const initSchema = z.object({
  orderId: z.string(),
  method: z.enum(['cib', 'edahabia', 'baridimob', 'cod']),
  phone: z.string().optional(),
});

function getInstructions(method: string): string {
  switch (method) {
    case 'cib':
      return 'Pay by CIB card via the secure payment gateway. You will be redirected after confirmation.';
    case 'edahabia':
      return 'Pay with Edahabia card. You will be redirected to the CIP portal.';
    case 'baridimob':
      return 'Pay with BaridiMob mobile wallet. You will receive an SMS to confirm.';
    case 'cod':
      return 'Cash on delivery. Pay when you receive your order.';
    default:
      return '';
  }
}

export default async function handler(req: any, res: any) {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const parts = url.pathname.replace(/^\/api\/payment\/?/, '').split('/').filter(Boolean);

  try {
    // POST /api/payment/init
    if (req.method === 'POST' && parts.length === 1 && parts[0] === 'init') {
      const { orderId, method } = initSchema.parse(req.body);
      
      const r = await query(`SELECT id, total, status FROM aos_orders WHERE id = $1`, [orderId]);
      if (!r.rows.length) return res.status(404).json({ error: 'Order not found' });
      
      const order = r.rows[0];
      if (order.status !== 'new' && order.status !== 'pending' && order.status !== 'new_order') {
        return res.status(400).json({ error: 'Order already processed' });
      }

      const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

      await query(
        `UPDATE aos_orders SET status = 'processing', payment_method = $1, payment_id = $2 WHERE id = $3`,
        [method, paymentId, orderId]
      );

      console.log(`[Payment] Initiated ${method.toUpperCase()} for order ${orderId}: ${order.total} DZD`);

      return res.json({
        success: true,
        paymentId,
        amount: order.total,
        method,
        instructions: getInstructions(method),
      });
    }

    // POST /api/payment/confirm
    if (req.method === 'POST' && parts.length === 1 && parts[0] === 'confirm') {
      const { paymentId } = z.object({ paymentId: z.string() }).parse(req.body);
      
      const r = await query(`SELECT id FROM aos_orders WHERE payment_id = $1`, [paymentId]);
      if (!r.rows.length) return res.status(404).json({ error: 'Payment not found' });

      await query(
        `UPDATE aos_orders SET status = 'paid', paid_at = NOW() WHERE payment_id = $1`,
        [paymentId]
      );
      console.log(`[Payment] Confirmed ${paymentId}`);
      return res.json({ success: true, status: 'paid' });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: err.errors });
    }
    console.error('[Payment API]', err);
    res.status(500).json({ error: err.message });
  }
}
