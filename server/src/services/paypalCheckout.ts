/**
 * Shared PayPal checkout for real store orders and site-factory deposits.
 *
 * Amounts are always recomputed from the database here. The browser only sends
 * a reference id, so a tampered client cannot choose what to pay. The same
 * signed webhook as subscriptions confirms a payment when the browser never
 * returns; `custom_id` carries a prefix so the webhook can route the event.
 */
import { prisma } from '../utils/prisma';
import { getFactorySettings } from '../site-factory/service';
import {
  capturePaypalOrder,
  createPaypalOrder,
  isPaypalConfigured,
  paypalAmountDzdToUsd,
} from './paypal';

export const ORDER_PREFIX = 'ORDER:';
export const SITE_PREFIX = 'SITE:';

export function publicBaseUrl(): string {
  return (process.env.PUBLIC_SITE_URL || 'https://aos-tech.store').trim().replace(/\/+$/, '');
}

function siteUrl(): string {
  return (process.env.PUBLIC_SITE_URL || 'https://aos-tech.store').trim().replace(/\/+$/, '');
}

function amountMatches(capturedUsd: string, dzd: number): boolean {
  const expected = Number(paypalAmountDzdToUsd(dzd));
  return Boolean(expected) && Math.abs(Number(capturedUsd) - expected) <= 0.02;
}

function returnUrls(kind: 'order' | 'site', ref: string) {
  const base = publicBaseUrl();
  return {
    returnUrl: `${base}/api/paypal/return?kind=${kind}&ref=${encodeURIComponent(ref)}`,
    cancelUrl: `${base}/api/paypal/cancel?kind=${kind}&ref=${encodeURIComponent(ref)}`,
  };
}

/* -------------------------------------------------------------------------
 * Store product orders
 * ---------------------------------------------------------------------- */

export async function startOrderCheckout(orderId: string) {
  if (!isPaypalConfigured()) throw new Error('PayPal is not configured');
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.paymentMethod !== 'paypal') throw new Error('Order not found');
  if (order.paymentStatus === 'paid') throw new Error('Order already paid');
  if (order.status === 'cancelled') throw new Error('Order is cancelled');
  const amountUsd = paypalAmountDzdToUsd(Number(order.total));
  if (!amountUsd) throw new Error('PayPal conversion rate is not configured');

  const { returnUrl, cancelUrl } = returnUrls('order', order.id);
  const created = await createPaypalOrder({
    amountUsd,
    reference: order.id,
    customId: `${ORDER_PREFIX}${order.id}`,
    description: `AOS Tech Store order ${order.id}`,
    returnUrl,
    cancelUrl,
  });
  await prisma.order.update({
    where: { id: order.id },
    data: { providerRef: created.id, checkoutUrl: created.approveUrl, paymentStatus: 'pending' },
  });
  return { checkoutUrl: created.approveUrl, reference: order.id };
}

export async function completeOrderCheckout(orderId: string, paypalOrderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error('Order not found');
  if (order.paymentStatus === 'paid') return { duplicate: true };
  if (order.providerRef && order.providerRef !== paypalOrderId) throw new Error('PayPal order mismatch');

  const captured = await capturePaypalOrder(paypalOrderId);
  if (captured.status !== 'COMPLETED') throw new Error(`PayPal capture status ${captured.status || 'unknown'}`);
  if (!amountMatches(captured.amountUsd, Number(order.total))) throw new Error('PayPal amount does not match the order');

  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentMethod: 'paypal',
      paymentStatus: 'paid',
      providerRef: paypalOrderId,
      checkoutUrl: null,
    },
  });
  return { paid: true, reference: order.id, redirect: `${siteUrl()}/?paypal=success&kind=order&ref=${encodeURIComponent(order.id)}` };
}

export async function cancelOrderCheckout(orderId: string) {
  await prisma.order.updateMany({
    where: { id: orderId, paymentStatus: { in: ['pending', null] } },
    data: { paymentStatus: 'cancelled', checkoutUrl: null },
  });
}

/* -------------------------------------------------------------------------
 * Site-factory deposits
 * ---------------------------------------------------------------------- */

export async function startSiteCheckout(ref: string) {
  if (!isPaypalConfigured()) throw new Error('PayPal is not configured');
  const request = await prisma.siteRequest.findUnique({ where: { ref } });
  if (!request) throw new Error('Site request not found');
  if (request.status === 'confirmed' || request.paymentMethod === 'paypal-paid') throw new Error('Deposit already paid');
  const settings = await getFactorySettings();
  const percent = Math.min(100, Math.max(0, Number(settings.depositPercent) || 0));
  const deposit = Math.round((Number(request.price) || 0) * percent) / 100;
  if (deposit <= 0) throw new Error('Site deposit amount is not available');
  const amountUsd = paypalAmountDzdToUsd(deposit);
  if (!amountUsd) throw new Error('PayPal conversion rate is not configured');

  const { returnUrl, cancelUrl } = returnUrls('site', request.ref);
  const created = await createPaypalOrder({
    amountUsd,
    reference: request.ref,
    customId: `${SITE_PREFIX}${request.ref}`,
    description: `AOS website ${request.ref} deposit`,
    returnUrl,
    cancelUrl,
  });
  await prisma.siteRequest.update({
    where: { id: request.id },
    data: { paymentRef: created.id, paymentMethod: 'paypal' },
  });
  return { checkoutUrl: created.approveUrl, reference: request.ref };
}

export async function completeSiteCheckout(ref: string, paypalOrderId: string) {
  const request = await prisma.siteRequest.findUnique({ where: { ref } });
  if (!request) throw new Error('Site request not found');
  if (request.status === 'confirmed') return { duplicate: true };
  if (request.paymentRef && request.paymentRef !== paypalOrderId) throw new Error('PayPal order mismatch');

  const settings = await getFactorySettings();
  const percent = Math.min(100, Math.max(0, Number(settings.depositPercent) || 0));
  const deposit = Math.round((Number(request.price) || 0) * percent) / 100;
  const captured = await capturePaypalOrder(paypalOrderId);
  if (captured.status !== 'COMPLETED') throw new Error(`PayPal capture status ${captured.status || 'unknown'}`);
  if (!amountMatches(captured.amountUsd, deposit)) throw new Error('PayPal amount does not match the deposit');

  await prisma.siteRequest.update({
    where: { id: request.id },
    data: { status: 'confirmed', paymentMethod: 'paypal-paid' },
  });
  await prisma.siteRequestEvent.create({
    data: { requestId: request.id, type: 'payment', message: 'PayPal deposit received; payment confirmed automatically.' },
  }).catch(() => null);
  return { paid: true, reference: request.ref, redirect: `${siteUrl()}/create-website?paypal=success&kind=site&ref=${encodeURIComponent(request.ref)}` };
}

export async function cancelSiteCheckout(ref: string) {
  await prisma.siteRequest.updateMany({
    where: { ref, status: 'new' },
    data: { paymentRef: null },
  });
}
