import crypto from 'crypto';
import { prisma } from '../utils/prisma';

/* -------------------------------------------------------------------------
 * Plans
 * ---------------------------------------------------------------------- */

export type PlanId = 'monthly' | 'quarterly' | 'yearly';
export type LangString = { ar: string; fr: string; en: string };

export const PLAN_IDS: PlanId[] = ['monthly', 'quarterly', 'yearly'];

export const PLANS: Record<
  PlanId,
  {
    id: PlanId;
    price: number;
    months: number;
    popular?: boolean;
    name: LangString;
    tagline: LangString;
    features: LangString[];
  }
> = {
  monthly: {
    id: 'monthly',
    price: 1900,
    months: 1,
    name: { ar: 'شهري', fr: 'Mensuel', en: 'Monthly' },
    tagline: {
      ar: 'جرّب النظام شهراً كاملاً بدون التزام.',
      fr: 'Testez le système un mois complet, sans engagement.',
      en: 'Try the full system for one month, no commitment.',
    },
    features: [
      { ar: 'استخدام غير محدود لأدوات الذكاء الاصطناعي الـ13', fr: 'Accès illimité aux 13 outils IA', en: 'Unlimited use of all 13 AI tools' },
      { ar: 'نتائج بالعربية والفرنسية والإنجليزية', fr: 'Résultats en arabe, français et anglais', en: 'Results in Arabic, French and English' },
      { ar: 'حفظ نتائج الحاسبة في حسابك', fr: 'Calculs enregistrés dans votre compte', en: 'Calculator results saved to your account' },
      { ar: 'دعم عبر واتساب', fr: 'Support WhatsApp', en: 'WhatsApp support' },
    ],
  },
  quarterly: {
    id: 'quarterly',
    price: 4900,
    months: 3,
    popular: true,
    name: { ar: '3 أشهر', fr: '3 mois', en: '3 months' },
    tagline: {
      ar: 'الأكثر اختياراً: وفّر 14% مقارنة بالشهري.',
      fr: 'Le plus choisi : économisez 14 % par rapport au mensuel.',
      en: 'Most popular: save 14% versus monthly.',
    },
    features: [
      { ar: 'كل ميزات الاشتراك الشهري', fr: 'Toutes les fonctionnalités du mensuel', en: 'Everything in the monthly plan' },
      { ar: 'توفير 800 دج على 3 أشهر', fr: '800 DZD économisés sur 3 mois', en: 'Save 800 DZD over 3 months' },
      { ar: 'أولوية في الرد على واتساب', fr: 'Réponse WhatsApp prioritaire', en: 'Priority WhatsApp replies' },
      { ar: 'مراجعة واحدة مجانية لصفحة منتج', fr: 'Une revue gratuite de page produit', en: 'One free product page review' },
    ],
  },
  yearly: {
    id: 'yearly',
    price: 17900,
    months: 12,
    name: { ar: 'سنوي', fr: 'Annuel', en: 'Yearly' },
    tagline: {
      ar: 'أفضل سعر: وفّر 21% طوال السنة.',
      fr: 'Meilleur prix : économisez 21 % toute l’année.',
      en: 'Best price: save 21% for the whole year.',
    },
    features: [
      { ar: 'كل ميزات الاشتراك ربع السنوي', fr: 'Toutes les fonctionnalités du trimestriel', en: 'Everything in the quarterly plan' },
      { ar: 'توفير 4 900 دج على السنة', fr: '4 900 DZD économisés sur l’année', en: 'Save 4 900 DZD over the year' },
      { ar: 'تحديثات وميزات جديدة أولاً', fr: 'Nouvelles fonctionnalités en avant-première', en: 'New features first' },
      { ar: 'جلسة استشارية واحدة للمتجر', fr: 'Une session conseil boutique', en: 'One store consulting session' },
    ],
  },
};

/** One extra preview after the visitor signs in. */
export const ACCOUNT_FREE_PREVIEWS = 1;
/** One free answer per tool for a visitor who is not signed in. */
export const GUEST_FREE_PER_TOOL = 1;
/** Guests are counted over a rolling window so shared IPs are not locked forever. */
const GUEST_WINDOW_DAYS = 30;

export function planOf(value: unknown): (typeof PLANS)[PlanId] | null {
  return typeof value === 'string' && value in PLANS ? PLANS[value as PlanId] : null;
}

export function planList() {
  return PLAN_IDS.map((id) => {
    const plan = PLANS[id];
    return {
      id: plan.id,
      price: plan.price,
      months: plan.months,
      perMonth: Math.round(plan.price / plan.months),
      popular: Boolean(plan.popular),
      name: plan.name,
      tagline: plan.tagline,
      features: plan.features,
    };
  });
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getTime());
  const day = result.getDate();
  result.setMonth(result.getMonth() + months);
  // 31 January + 1 month should land on 28/29 February, not 3 March.
  if (result.getDate() < day) result.setDate(0);
  return result;
}

/* -------------------------------------------------------------------------
 * Subscriptions
 * ---------------------------------------------------------------------- */

export async function getActiveSubscription(userId: string) {
  const subscription = await prisma.subscription.findUnique({ where: { userId } });
  if (!subscription) return null;
  if (subscription.status !== 'active') return null;
  if (subscription.endsAt && subscription.endsAt.getTime() <= Date.now()) {
    await prisma.subscription
      .update({ where: { userId }, data: { status: 'expired' } })
      .catch(() => null);
    return null;
  }
  return subscription;
}

export function publicSubscription(
  subscription: Awaited<ReturnType<typeof getActiveSubscription>>,
) {
  if (!subscription) return null;
  return {
    plan: subscription.plan,
    planName: planOf(subscription.plan)?.name || { ar: subscription.plan, fr: subscription.plan, en: subscription.plan },
    status: subscription.status,
    price: subscription.price,
    startsAt: subscription.startsAt,
    endsAt: subscription.endsAt,
    active: true,
  };
}

export async function previewsUsed(userId: string): Promise<number> {
  return prisma.aiUsage.count({ where: { userId } });
}

export async function activateSubscription(input: {
  userId: string;
  plan: PlanId;
  paymentId?: string;
  price?: number;
}) {
  const plan = PLANS[input.plan];
  if (!plan) throw new Error('Unknown plan');
  const now = new Date();
  const existing = await prisma.subscription.findUnique({ where: { userId: input.userId } });
  const base =
    existing?.status === 'active' && existing.endsAt && existing.endsAt.getTime() > now.getTime()
      ? existing.endsAt
      : now;
  const endsAt = addMonths(base, plan.months);

  const subscription = await prisma.subscription.upsert({
    where: { userId: input.userId },
    create: {
      userId: input.userId,
      plan: input.plan,
      status: 'active',
      price: input.price ?? plan.price,
      startsAt: now,
      endsAt,
    },
    update: {
      plan: input.plan,
      status: 'active',
      price: input.price ?? plan.price,
      startsAt: now,
      endsAt,
    },
  });

  if (input.paymentId) {
    await prisma.subscriptionPayment.update({
      where: { id: input.paymentId },
      data: {
        status: 'paid',
        paidAt: now,
        subscriptionId: subscription.id,
      },
    });
  }

  return subscription;
}

/* -------------------------------------------------------------------------
 * AI usage gate
 * ---------------------------------------------------------------------- */

export function hashIp(ip: string): string {
  return crypto
    .createHash('sha256')
    .update(`${ip}|${process.env.AI_IP_SALT || process.env.JWT_SECRET || 'aos-ai'}`)
    .digest('hex')
    .slice(0, 40);
}

// `strict` is off in this package, so this stays a single shape with optional
// denial fields instead of a discriminated union (which does not narrow).
export type AiAccess = {
  allowed: boolean;
  subscribed: boolean;
  previewRemaining: number | null;
  status?: number;
  code?: string;
};

export async function resolveAiAccess(input: {
  userId?: string;
  ip: string;
  guestId?: string;
  tool: string;
}): Promise<AiAccess> {
  if (input.userId) {
    const subscription = await getActiveSubscription(input.userId);
    if (subscription) {
      return { allowed: true, subscribed: true, previewRemaining: null };
    }
    const used = await previewsUsed(input.userId);
    const remaining = Math.max(0, ACCOUNT_FREE_PREVIEWS - used);
    if (remaining > 0) {
      return { allowed: true, subscribed: false, previewRemaining: remaining };
    }
    return { allowed: false, subscribed: false, previewRemaining: 0, status: 402, code: 'subscription_required' };
  }

  const since = new Date(Date.now() - GUEST_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const visitorKey = input.guestId ? `guest:${input.guestId}` : `ip:${input.ip}`;
  const used = await prisma.aiUsage.count({
    where: {
      ipHash: hashIp(visitorKey),
      tool: input.tool,
      createdAt: { gte: since },
    },
  });
  if (used < GUEST_FREE_PER_TOOL) {
    return { allowed: true, subscribed: false, previewRemaining: null };
  }
  return { allowed: false, subscribed: false, previewRemaining: 0, status: 403, code: 'ai_login_required' };
}

export async function recordAiUsage(input: {
  userId?: string;
  ip: string;
  guestId?: string;
  tool: string;
}) {
  try {
    // The ipHash column stores the stable visitor key: a per-browser guest id
    // when the cookie exists, otherwise the resolved client IP. Using the
    // edge/proxy IP here would give a visitor a new trial on every request.
    const visitorKey = input.userId
      ? null
      : input.guestId
        ? `guest:${input.guestId}`
        : `ip:${input.ip}`;
    await prisma.aiUsage.create({
      data: {
        userId: input.userId || null,
        ipHash: visitorKey ? hashIp(visitorKey) : null,
        tool: input.tool,
      },
    });
  } catch (err: any) {
    // Never fail an answer the customer already received because the counter
    // row could not be written.
    console.error('[AI] Usage not recorded:', err?.message || err);
  }
}

/* -------------------------------------------------------------------------
 * Chargily Pay (v2)
 * ---------------------------------------------------------------------- */

const CHARGILY_API = 'https://pay.chargily.net/api/v2';

export function isChargilyConfigured(): boolean {
  return Boolean(process.env.CHARGILY_SECRET_KEY?.trim());
}

export function makeReference(prefix = 'AOS-SUB'): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${crypto
    .randomBytes(3)
    .toString('hex')
    .toUpperCase()}`;
}

export async function createChargilyCheckout(input: {
  amount: number;
  reference: string;
  paymentId: string;
  userId: string;
  plan: string;
  successUrl: string;
  failureUrl: string;
}) {
  const key = process.env.CHARGILY_SECRET_KEY?.trim();
  if (!key) {
    const error: any = new Error('Chargily is not configured');
    error.code = 'chargily_not_configured';
    throw error;
  }

  const response = await fetch(`${CHARGILY_API}/checkouts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      amount: Math.round(input.amount),
      currency: 'dzd',
      success_url: input.successUrl,
      failure_url: input.failureUrl,
      metadata: [
        { key: 'paymentId', value: input.paymentId },
        { key: 'userId', value: input.userId },
        { key: 'plan', value: input.plan },
        { key: 'reference', value: input.reference },
      ],
    }),
  });

  const body: any = await response.json().catch(() => ({}));
  if (!response.ok || !body?.checkout_url) {
    const error: any = new Error(body?.message || `Chargily checkout failed (${response.status})`);
    error.code = 'chargily_error';
    error.status = 502;
    throw error;
  }

  return {
    id: String(body.id || ''),
    checkoutUrl: String(body.checkout_url),
  };
}

/** Chargily signs the raw webhook body with HMAC-SHA256 using the API secret. */
export function verifyChargilySignature(rawBody: Buffer | string | undefined, signature: string | undefined): boolean {
  const key = process.env.CHARGILY_SECRET_KEY?.trim();
  if (!key || !rawBody || !signature) return false;
  const payload = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody);
  const expected = crypto.createHmac('sha256', key).update(payload).digest('hex');
  const received = signature.trim().toLowerCase();
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const receivedBuffer = Buffer.from(received, 'utf8');
  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

/* -------------------------------------------------------------------------
 * Owner payment details (reuses the website factory configuration)
 * ---------------------------------------------------------------------- */

export async function manualPaymentDetails() {
  const { getFactorySettings } = await import('../site-factory/service');
  const settings = await getFactorySettings().catch(() => null);
  const digits = (value: string) => String(value || '').replace(/[^\d]/g, '');
  const whatsapp = digits(settings?.ownerWhatsapp || '') || digits(settings?.ownerPhone || '') || '213674113290';
  return {
    ownerName: settings?.ownerName || 'AOS Tech Store',
    ccp: settings?.ccp || '',
    ccpKey: settings?.ccpKey || '',
    baridimob: settings?.baridimob || '',
    bankName: settings?.bankName || 'Algérie Poste',
    whatsapp,
    note: settings?.paymentNote || null,
  };
}
