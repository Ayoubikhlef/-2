import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth';
import {
  ACCOUNT_FREE_PREVIEWS,
  PLANS,
  activateSubscription,
  createChargilyCheckout,
  getActiveSubscription,
  isChargilyConfigured,
  makeReference,
  manualPaymentDetails,
  planList,
  planOf,
  previewsUsed,
  publicSubscription,
  verifyChargilySignature,
} from '../services/subscription';
import {
  capturePaypalOrder,
  createPaypalOrder,
  isPaypalConfigured,
  paypalAmountDzdToUsd,
  verifyPaypalWebhook,
} from '../services/paypal';

export const subscriptionRouter = Router();

const planSchema = z.enum(['monthly', 'quarterly', 'yearly']);
const methodSchema = z.enum(['chargily', 'paypal', 'ccp', 'baridimob']);

function paymentView(payment: any) {
  return {
    id: payment.id,
    plan: payment.plan,
    amount: payment.amount,
    method: payment.method,
    status: payment.status,
    reference: payment.reference,
    checkoutUrl: payment.checkoutUrl || null,
    note: payment.note || null,
    hasProof: Boolean(payment.proofUrl),
    paidAt: payment.paidAt,
    createdAt: payment.createdAt,
  };
}

function publicBaseUrl(): string {
  const configured = (process.env.PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '');
  return configured || 'https://aos-tech.store';
}

/** Finalize a PayPal order: capture it, check the amount, then grant access. */
async function completePaypalPayment(payment: any, orderId: string) {
  if (payment.status === 'paid') return { duplicate: true };
  const captured = await capturePaypalOrder(orderId);
  if (captured.status !== 'COMPLETED') {
    throw new Error(`PayPal capture status ${captured.status || 'unknown'}`);
  }
  const expected = Number(paypalAmountDzdToUsd(payment.amount));
  if (expected && Math.abs(Number(captured.amountUsd) - expected) > 0.02) {
    throw new Error('PayPal capture amount does not match the payment');
  }
  const plan = planOf(payment.plan);
  if (!plan) throw new Error('Unknown plan');
  await prisma.subscriptionPayment.update({
    where: { id: payment.id },
    data: { providerRef: orderId },
  });
  await activateSubscription({
    userId: payment.userId,
    plan: plan.id,
    paymentId: payment.id,
    price: payment.amount,
  });
  return { activated: true };
}

/* -------------------------------------------------------------------------
 * Public plans
 * ---------------------------------------------------------------------- */

subscriptionRouter.get('/plans', (_req, res: Response) => {
  res.json({
    plans: planList(),
    currency: 'DZD',
    chargily: isChargilyConfigured(),
    paypal: isPaypalConfigured(),
    previews: { limit: ACCOUNT_FREE_PREVIEWS },
  });
});

/* -------------------------------------------------------------------------
 * Customer endpoints
 * ---------------------------------------------------------------------- */

subscriptionRouter.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const [subscription, used, payments] = await Promise.all([
    getActiveSubscription(userId),
    previewsUsed(userId),
    prisma.subscriptionPayment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  res.json({
    subscription: publicSubscription(subscription),
    previews: {
      limit: ACCOUNT_FREE_PREVIEWS,
      used,
      remaining: subscription ? null : Math.max(0, ACCOUNT_FREE_PREVIEWS - used),
    },
    payments: payments.map(paymentView),
    chargily: isChargilyConfigured(),
    plans: planList(),
  });
});

subscriptionRouter.post('/checkout', requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = z
    .object({ plan: planSchema, method: methodSchema })
    .safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid plan or payment method',
      code: 'invalid_checkout',
      details: parsed.error.issues,
    });
  }

  const { plan: planId, method } = parsed.data;
  const plan = PLANS[planId];
  const userId = req.userId!;

  if (method === 'chargily' && !isChargilyConfigured()) {
    return res.status(400).json({
      error: 'Card payment is not configured yet',
      code: 'chargily_not_configured',
    });
  }
  if (method === 'paypal' && !isPaypalConfigured()) {
    return res.status(400).json({
      error: 'PayPal is not configured yet',
      code: 'paypal_not_configured',
    });
  }

  // Reuse a recent pending manual payment so refreshing the page does not
  // create a new reference every time.
  if (method !== 'chargily' && method !== 'paypal') {
    const existing = await prisma.subscriptionPayment.findFirst({
      where: {
        userId,
        plan: planId,
        method,
        status: 'pending',
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (existing) {
      return res.json({
        mode: 'manual',
        payment: paymentView(existing),
        instructions: await manualPaymentDetails(),
      });
    }
  }

  const reference = makeReference();
  const payment = await prisma.subscriptionPayment.create({
    data: {
      userId,
      plan: planId,
      amount: plan.price,
      method,
      status: 'pending',
      reference,
    },
  });

  if (method === 'chargily') {
    try {
      const checkout = await createChargilyCheckout({
        amount: plan.price,
        reference,
        paymentId: payment.id,
        userId,
        plan: planId,
        successUrl: `${publicBaseUrl()}/subscription?status=success&payment=${encodeURIComponent(reference)}`,
        failureUrl: `${publicBaseUrl()}/subscription?status=failed&payment=${encodeURIComponent(reference)}`,
      });
      const updated = await prisma.subscriptionPayment.update({
        where: { id: payment.id },
        data: {
          providerRef: checkout.id || null,
          checkoutUrl: checkout.checkoutUrl,
        },
      });
      return res.json({
        mode: 'redirect',
        checkoutUrl: checkout.checkoutUrl,
        payment: paymentView(updated),
      });
    } catch (err: any) {
      await prisma.subscriptionPayment
        .update({ where: { id: payment.id }, data: { status: 'failed', note: 'Chargily checkout failed' } })
        .catch(() => null);
      console.error('[Subscription] Chargily checkout failed:', err?.message || err);
      return res.status(502).json({
        error: 'Card payment could not be started. Choose CCP or BaridiMob.',
        code: 'chargily_error',
      });
    }
  }

  if (method === 'paypal') {
    const amountUsd = paypalAmountDzdToUsd(plan.price);
    if (!amountUsd) {
      await prisma.subscriptionPayment
        .update({ where: { id: payment.id }, data: { status: 'failed', note: 'PAYPAL_USD_RATE is missing or invalid' } })
        .catch(() => null);
      return res.status(500).json({ error: 'PayPal conversion rate is not configured', code: 'paypal_rate_invalid' });
    }
    try {
      const order = await createPaypalOrder({
        amountUsd,
        reference,
        paymentId: payment.id,
        returnUrl: `${publicBaseUrl()}/api/subscription/paypal/return?reference=${encodeURIComponent(reference)}`,
        cancelUrl: `${publicBaseUrl()}/api/subscription/paypal/cancel?reference=${encodeURIComponent(reference)}`,
      });
      const updated = await prisma.subscriptionPayment.update({
        where: { id: payment.id },
        data: { providerRef: order.id, checkoutUrl: order.approveUrl },
      });
      return res.json({
        mode: 'redirect',
        checkoutUrl: order.approveUrl,
        payment: paymentView(updated),
      });
    } catch (err: any) {
      await prisma.subscriptionPayment
        .update({ where: { id: payment.id }, data: { status: 'failed', note: String(err?.message || err).slice(0, 300) } })
        .catch(() => null);
      console.error('[Subscription] PayPal order failed:', err?.message || err);
      return res.status(502).json({ error: 'PayPal checkout could not be started', code: 'paypal_error' });
    }
  }

  res.json({
    mode: 'manual',
    payment: paymentView(payment),
    instructions: await manualPaymentDetails(),
  });
});

/* -------------------------------------------------------------------------
 * PayPal return + webhook
 * ---------------------------------------------------------------------- */

subscriptionRouter.get('/paypal/return', async (req, res: Response) => {
  const orderId = String(req.query.token || '');
  const reference = String(req.query.reference || '');
  const payment = reference
    ? await prisma.subscriptionPayment.findUnique({ where: { reference } })
    : orderId
      ? await prisma.subscriptionPayment.findFirst({ where: { providerRef: orderId } })
      : null;
  if (!payment || payment.method !== 'paypal' || (orderId && payment.providerRef !== orderId)) {
    return res.redirect(303, `${publicBaseUrl()}/subscription?status=failed&payment=paypal_invalid`);
  }
  try {
    await completePaypalPayment(payment, orderId || String(payment.providerRef || ''));
    return res.redirect(303, `${publicBaseUrl()}/subscription?status=success&payment=${encodeURIComponent(payment.reference)}&provider=paypal`);
  } catch (err: any) {
    console.error('[Subscription] PayPal return failed:', err?.message || err);
    return res.redirect(303, `${publicBaseUrl()}/subscription?status=failed&payment=${encodeURIComponent(payment.reference)}&provider=paypal`);
  }
});

subscriptionRouter.get('/paypal/cancel', async (req, res: Response) => {
  const reference = String(req.query.reference || '');
  const payment = reference
    ? await prisma.subscriptionPayment.findUnique({ where: { reference } })
    : null;
  if (payment && payment.method === 'paypal' && payment.status === 'pending') {
    await prisma.subscriptionPayment.update({ where: { id: payment.id }, data: { status: 'failed', note: 'PayPal checkout cancelled' } });
  }
  return res.redirect(303, `${publicBaseUrl()}/subscription?status=failed&payment=${encodeURIComponent(reference || 'paypal')}&provider=paypal`);
});

subscriptionRouter.post('/paypal/webhook', async (req, res: Response) => {
  const raw = (req as any).rawBody;
  if (!(await verifyPaypalWebhook(req.headers, raw || JSON.stringify(req.body || {})))) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }
  const event = req.body || {};
  const type = String(event.type || '');
  const resource = event.resource || {};
  const orderId = String(
    resource?.supplementary_data?.related_ids?.order_id ||
      resource?.custom_id ||
      resource?.id ||
      '',
  );

  if (type === 'PAYMENT.CAPTURE.COMPLETED' || type === 'CHECKOUT.ORDER.APPROVED') {
    const payment = orderId
      ? await prisma.subscriptionPayment.findFirst({ where: { providerRef: orderId, method: 'paypal' } })
      : null;
    if (!payment) return res.json({ ok: true, ignored: 'unknown_payment' });
    if (payment.status === 'paid') return res.json({ ok: true, duplicate: true });
    try {
      const result = await completePaypalPayment(payment, orderId);
      return res.json({ ok: true, ...result });
    } catch (err: any) {
      console.error('[Subscription] PayPal webhook failed:', err?.message || err);
      return res.status(500).json({ error: 'Could not complete payment' });
    }
  }
  return res.json({ ok: true, ignored: type || 'unknown_event' });
});

// Receipts are compressed to a JPEG data URL in the browser. Keeping the
// column limited to image data URLs stops an uploaded string from becoming a
// `data:text/html` page that an admin would open from the payments table.
const receiptSchema = z
  .string()
  .max(900_000)
  .refine(
    (value) => /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value),
    'Receipt must be an image',
  );

subscriptionRouter.post('/payments/:id/proof', requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = z
    .object({
      proof: receiptSchema.optional(),
      note: z.string().max(600).optional(),
    })
    .safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid receipt', code: 'invalid_proof' });
  }

  const payment = await prisma.subscriptionPayment.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!payment) return res.status(404).json({ error: 'Payment not found', code: 'not_found' });
  if (payment.method === 'chargily') {
    return res.status(400).json({ error: 'Card payments confirm automatically', code: 'auto_payment' });
  }
  if (payment.status === 'paid') {
    return res.status(409).json({ error: 'Payment already confirmed', code: 'already_paid' });
  }

  const updated = await prisma.subscriptionPayment.update({
    where: { id: payment.id },
    data: {
      ...(parsed.data.proof ? { proofUrl: parsed.data.proof } : {}),
      ...(parsed.data.note ? { note: parsed.data.note } : {}),
    },
  });

  res.json({ ok: true, payment: paymentView(updated) });
});

/* -------------------------------------------------------------------------
 * Chargily webhook
 * ---------------------------------------------------------------------- */

subscriptionRouter.post('/chargily/webhook', async (req, res: Response) => {
  const signature = Array.isArray(req.headers.signature)
    ? req.headers.signature[0]
    : req.headers.signature;
  const raw = (req as any).rawBody;
  if (!verifyChargilySignature(raw, signature)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = req.body || {};
  const type = String(event.type || '');
  const data = event.data || {};
  const metadata: Array<{ key: string; value: string }> = Array.isArray(data.metadata) ? data.metadata : [];
  const byKey = (key: string) => metadata.find((entry) => entry?.key === key)?.value || '';
  const paymentId = byKey('paymentId');
  const reference = byKey('reference') || '';
  const providerRef = String(data.id || '');

  if (type === 'checkout.paid') {
    const payment = paymentId
      ? await prisma.subscriptionPayment.findUnique({ where: { id: paymentId } })
      : reference
        ? await prisma.subscriptionPayment.findUnique({ where: { reference } })
        : providerRef
          ? await prisma.subscriptionPayment.findFirst({ where: { providerRef } })
          : null;

    if (!payment) return res.json({ ok: true, ignored: 'unknown_payment' });
    if (payment.status === 'paid') return res.json({ ok: true, duplicate: true });

    const plan = planOf(payment.plan);
    if (!plan) return res.json({ ok: true, ignored: 'unknown_plan' });

    await prisma.subscriptionPayment.update({
      where: { id: payment.id },
      data: { providerRef: providerRef || payment.providerRef },
    });
    await activateSubscription({
      userId: payment.userId,
      plan: plan.id,
      paymentId: payment.id,
      price: payment.amount,
    });
    return res.json({ ok: true, activated: true });
  }

  if (type === 'checkout.failed' || type === 'checkout.expired' || type === 'checkout.canceled') {
    const payment = paymentId
      ? await prisma.subscriptionPayment.findUnique({ where: { id: paymentId } })
      : null;
    if (payment && payment.status === 'pending') {
      await prisma.subscriptionPayment.update({
        where: { id: payment.id },
        data: { status: type === 'checkout.expired' ? 'expired' : 'failed' },
      });
    }
    return res.json({ ok: true });
  }

  res.json({ ok: true, ignored: type || 'unknown_event' });
});

/* -------------------------------------------------------------------------
 * Admin endpoints
 * ---------------------------------------------------------------------- */

subscriptionRouter.get(
  '/admin/payments',
  requireAuth,
  requireRole('SUPER_ADMIN', 'ADMIN'),
  async (req: AuthRequest, res: Response) => {
    const status = ['pending', 'paid', 'failed', 'rejected', 'expired'].includes(String(req.query.status))
      ? String(req.query.status)
      : undefined;
    const payments = await prisma.subscriptionPayment.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
      take: 150,
      include: { user: { select: { id: true, email: true, name: true } } },
    });
    res.json({
      payments: payments.map((payment) => ({
        ...paymentView(payment),
        proofUrl: payment.proofUrl || null,
        user: payment.user,
      })),
    });
  },
);

subscriptionRouter.post(
  '/admin/payments/:id/confirm',
  requireAuth,
  requireRole('SUPER_ADMIN', 'ADMIN'),
  async (req: AuthRequest, res: Response) => {
    const payment = await prisma.subscriptionPayment.findUnique({ where: { id: req.params.id } });
    if (!payment) return res.status(404).json({ error: 'Payment not found', code: 'not_found' });
    if (payment.status === 'paid') {
      return res.status(409).json({ error: 'Payment already confirmed', code: 'already_paid' });
    }
    const plan = planOf(payment.plan);
    if (!plan) return res.status(400).json({ error: 'Unknown plan', code: 'unknown_plan' });

    const subscription = await activateSubscription({
      userId: payment.userId,
      plan: plan.id,
      paymentId: payment.id,
      price: payment.amount,
    });
    res.json({
      ok: true,
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        startsAt: subscription.startsAt,
        endsAt: subscription.endsAt,
      },
    });
  },
);

subscriptionRouter.post(
  '/admin/payments/:id/reject',
  requireAuth,
  requireRole('SUPER_ADMIN', 'ADMIN'),
  async (req: AuthRequest, res: Response) => {
    const payment = await prisma.subscriptionPayment.findUnique({ where: { id: req.params.id } });
    if (!payment) return res.status(404).json({ error: 'Payment not found', code: 'not_found' });
    const updated = await prisma.subscriptionPayment.update({
      where: { id: payment.id },
      data: { status: 'rejected' },
    });
    res.json({ ok: true, payment: paymentView(updated) });
  },
);

subscriptionRouter.post(
  '/admin/grant',
  requireAuth,
  requireRole('SUPER_ADMIN', 'ADMIN'),
  async (req: AuthRequest, res: Response) => {
    const parsed = z
      .object({ email: z.string().email(), plan: planSchema })
      .safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Email and plan are required', code: 'invalid_grant' });
    }
    const email = parsed.data.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'No account with that email', code: 'no_account' });

    const plan = PLANS[parsed.data.plan];
    await prisma.subscriptionPayment.create({
      data: {
        userId: user.id,
        plan: plan.id,
        amount: plan.price,
        method: 'admin',
        status: 'paid',
        reference: makeReference('AOS-GRANT'),
        paidAt: new Date(),
      },
    });
    const subscription = await activateSubscription({
      userId: user.id,
      plan: plan.id,
      price: plan.price,
    });
    res.json({
      ok: true,
      user: { email: user.email, name: user.name },
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        endsAt: subscription.endsAt,
      },
    });
  },
);

subscriptionRouter.get(
  '/admin/subscriptions',
  requireAuth,
  requireRole('SUPER_ADMIN', 'ADMIN'),
  async (_req: AuthRequest, res: Response) => {
    const subscriptions = await prisma.subscription.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 150,
      include: { user: { select: { id: true, email: true, name: true } } },
    });
    res.json({
      subscriptions: subscriptions.map((subscription) => ({
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        price: subscription.price,
        startsAt: subscription.startsAt,
        endsAt: subscription.endsAt,
        user: subscription.user,
      })),
    });
  },
);

subscriptionRouter.post(
  '/admin/subscriptions/:userId/cancel',
  requireAuth,
  requireRole('SUPER_ADMIN', 'ADMIN'),
  async (req: AuthRequest, res: Response) => {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.params.userId },
    });
    if (!subscription) return res.status(404).json({ error: 'Subscription not found', code: 'not_found' });
    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'cancelled', endsAt: new Date() },
    });
    res.json({ ok: true, subscription: { status: updated.status, endsAt: updated.endsAt } });
  },
);
