import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { isPaypalConfigured } from '../services/paypal';
import {
  cancelOrderCheckout,
  cancelSiteCheckout,
  completeOrderCheckout,
  completeSiteCheckout,
  publicBaseUrl,
  startOrderCheckout,
  startSiteCheckout,
} from '../services/paypalCheckout';

export const paypalRouter = Router();

const checkoutSchema = z.object({
  kind: z.enum(['order', 'site']),
  ref: z.string().trim().min(4).max(80),
});

paypalRouter.get('/config', (_req, res: Response) => {
  res.set('Cache-Control', 'no-store');
  res.json({ paypal: isPaypalConfigured() });
});

paypalRouter.post('/checkout', async (req: Request, res: Response) => {
  if (!isPaypalConfigured()) {
    return res.status(503).json({ error: 'PayPal is not configured', code: 'paypal_not_configured' });
  }
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid checkout request', code: 'invalid_checkout' });
  }
  try {
    const result =
      parsed.data.kind === 'order'
        ? await startOrderCheckout(parsed.data.ref)
        : await startSiteCheckout(parsed.data.ref);
    return res.json({ mode: 'redirect', ...result });
  } catch (err: any) {
    console.error('[PayPal] checkout failed:', err?.message || err);
    return res.status(502).json({ error: 'PayPal checkout could not be started', code: 'paypal_error' });
  }
});

paypalRouter.get('/return', async (req: Request, res: Response) => {
  const kind = String(req.query.kind || '');
  const ref = String(req.query.ref || '');
  const orderId = String(req.query.token || '');
  const base = publicBaseUrl();
  const fail = `${base}/?paypal=failed&kind=${encodeURIComponent(kind || 'order')}&ref=${encodeURIComponent(ref)}`;
  if (!orderId || !ref || (kind !== 'order' && kind !== 'site')) return res.redirect(303, fail);
  try {
    const result =
      kind === 'order'
        ? await completeOrderCheckout(ref, orderId)
        : await completeSiteCheckout(ref, orderId);
    return res.redirect(303, result.redirect);
  } catch (err: any) {
    console.error('[PayPal] return failed:', err?.message || err);
    return res.redirect(303, fail);
  }
});

paypalRouter.get('/cancel', async (req: Request, res: Response) => {
  const kind = String(req.query.kind || '');
  const ref = String(req.query.ref || '');
  if (kind === 'order' && ref) await cancelOrderCheckout(ref).catch(() => null);
  if (kind === 'site' && ref) await cancelSiteCheckout(ref).catch(() => null);
  const base = publicBaseUrl();
  return res.redirect(303, `${base}/?paypal=cancelled&kind=${encodeURIComponent(kind || 'order')}&ref=${encodeURIComponent(ref)}`);
});
