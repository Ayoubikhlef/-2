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

export const subscriptionRouter = Router();

const planSchema = z.enum(['monthly', 'quarterly', 'yearly']);
const methodSchema = z.enum(['chargily', 'ccp', 'baridimob']);

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

/* -------------------------------------------------------------------------
 * Public plans
 * ---------------------------------------------------------------------- */

subscriptionRouter.get('/plans', (_req, res: Response) => {
  res.json({
    plans: planList(),
    currency: 'DZD',
    chargily: isChargilyConfigured(),
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

  // Reuse a recent pending manual payment so refreshing the page does not
  // create a new reference every time.
  if (method !== 'chargily') {
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

  res.json({
    mode: 'manual',
    payment: paymentView(payment),
    instructions: await manualPaymentDetails(),
  });
});

subscriptionRouter.post('/payments/:id/proof', requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = z
    .object({
      proof: z.string().max(900_000).optional(),
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
