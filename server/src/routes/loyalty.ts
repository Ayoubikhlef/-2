import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const loyaltyRouter = Router();

const addPointsSchema = z.object({
  phone: z.string().min(1),
  name: z.string().min(1),
  amount: z.number().nonnegative(),
});

const redeemPointsSchema = z.object({
  phone: z.string().min(1),
  points: z.number().int().positive(),
});

pool.query(`CREATE TABLE IF NOT EXISTS aos_loyalty (customer_phone TEXT PRIMARY KEY, customer_name TEXT NOT NULL, points INTEGER DEFAULT 0, total_spent REAL DEFAULT 0, updated_at TIMESTAMPTZ DEFAULT NOW())`).catch(() => {});

loyaltyRouter.post('/add', async (req: Request, res: Response) => {
  try {
    const { phone, name, amount } = addPointsSchema.parse(req.body);
    const { rows } = await pool.query(
      `INSERT INTO aos_loyalty (customer_phone, customer_name, points)
       VALUES ($1, $2, $3)
       ON CONFLICT (customer_phone)
       DO UPDATE SET points = aos_loyalty.points + $3, customer_name = $2, updated_at = NOW()
       RETURNING *`,
      [phone, name, amount]
    );
    console.log(`[Loyalty] Added ${amount} points for ${phone}`);
    res.json({
      customerPhone: rows[0].customer_phone,
      customerName: rows[0].customer_name,
      points: rows[0].points,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('[Loyalty] Add points error:', err);
    res.status(500).json({ error: 'Failed to add points' });
  }
});

loyaltyRouter.post('/redeem', async (req: Request, res: Response) => {
  try {
    const { phone, points } = redeemPointsSchema.parse(req.body);
    const { rows: existing } = await pool.query('SELECT points FROM aos_loyalty WHERE customer_phone = $1', [phone]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Loyalty record not found' });
    }
    const currentPoints = Number(existing[0].points);
    if (currentPoints < points) {
      return res.status(400).json({ error: 'Insufficient points', available: currentPoints });
    }
    await pool.query('UPDATE aos_loyalty SET points = points - $1, updated_at = NOW() WHERE customer_phone = $2', [points, phone]);
    console.log(`[Loyalty] Redeemed ${points} points for ${phone}`);
    res.json({ phone, pointsRedeemed: points, remaining: currentPoints - points });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('[Loyalty] Redeem error:', err);
    res.status(500).json({ error: 'Failed to redeem points' });
  }
});

loyaltyRouter.get('/:phone', async (req: Request, res: Response) => {
  try {
    const { phone } = req.params;
    const { rows } = await pool.query('SELECT * FROM aos_loyalty WHERE customer_phone = $1', [phone]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Loyalty record not found' });
    }
    console.log(`[Loyalty] Fetched record for ${phone}`);
    res.json({
      customerPhone: rows[0].customer_phone,
      customerName: rows[0].customer_name,
      points: rows[0].points,
      totalSpent: rows[0].total_spent,
      updatedAt: rows[0].updated_at,
    });
  } catch (err) {
    console.error('[Loyalty] Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch loyalty record' });
  }
});
