import { sendSecurityAlertEmail } from '../services/emailAlerts';
import { sendTelegramMessage } from '../services/telegram';

const ADMIN_URL = process.env.PUBLIC_SITE_URL || 'https://aostech.vercel.app';

function money(value: number): string {
  return `${Math.round(Number(value) || 0).toLocaleString('fr-FR')} د.ج`;
}

function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function clean(value: unknown): string {
  return String(value ?? '').replace(/[\r\n]+/g, ' ').slice(0, 200);
}

async function notifyOwner(subject: string, text: string, html: string): Promise<void> {
  const results = await Promise.allSettled([
    sendSecurityAlertEmail(subject, text),
    sendTelegramMessage(html),
  ]);
  if (process.env.NODE_ENV !== 'production') {
    const email = results[0].status === 'fulfilled' ? results[0].value : false;
    const telegram = results[1].status === 'fulfilled' ? results[1].value : false;
    console.log(`[SiteFactory] Notification "${subject}" — email=${email} telegram=${telegram}`);
  }
}

export async function notifyNewSiteRequest(request: any, template: any, pack: any): Promise<void> {
  const subject = `🏗️ طلب موقع جديد — ${request.ref}`;
  const text = [
    'طلب موقع جديد',
    '━━━━━━━━━━━━',
    `المرجع: ${request.ref}`,
    `الموقع: ${request.siteName}`,
    `القالب: ${template?.nameAr || request.templateSlug}`,
    `الباقة: ${pack?.nameAr || request.packageSlug} — ${money(request.price)}`,
    `النطاق الفرعي: ${request.subdomain}.pages.dev`,
    `الهاتف: ${request.phone}`,
    request.email ? `البريد: ${request.email}` : '',
    request.city ? `المدينة: ${request.city}` : '',
    `المعاينة: ${ADMIN_URL}${request.previewUrl || ''}`,
    `لوحة الإدارة: ${ADMIN_URL}/#admin`,
  ].filter(Boolean).join('\n');

  const html = [
    '<b>🏗️ طلب موقع جديد</b>',
    '━━━━━━━━━━━━',
    `🔖 المرجع: <b>${esc(request.ref)}</b>`,
    `🏪 ${esc(request.siteName)}`,
    `🎨 ${esc(template?.nameAr || request.templateSlug)} — ${esc(pack?.nameAr || request.packageSlug)}`,
    `💰 ${esc(money(request.price))}`,
    `🌐 ${esc(request.subdomain)}.pages.dev`,
    `📞 ${esc(request.phone)}`,
    request.email ? `✉️ ${esc(request.email)}` : '',
    `📊 الحالة: ${esc(request.status)}`,
  ].filter(Boolean).join('\n');

  await notifyOwner(subject, text, html);
}

export async function notifyReceiptUploaded(request: any): Promise<void> {
  const subject = `🧾 وصل دفع جديد — ${request.ref}`;
  const text = [
    'تم استلام وصل دفع جديد',
    '━━━━━━━━━━━━',
    `المرجع: ${request.ref}`,
    `الموقع: ${request.siteName}`,
    `المبلغ: ${money(request.price)}`,
    `الهاتف: ${request.phone}`,
    `اسم الملف: ${request.receiptName || 'receipt'}`,
    `راجع الطلب: ${ADMIN_URL}/#admin`,
  ].join('\n');
  const html = [
    '<b>🧾 وصل دفع جديد</b>',
    '━━━━━━━━━━━━',
    `🔖 <b>${esc(request.ref)}</b> — ${esc(request.siteName)}`,
    `💰 ${esc(money(request.price))}`,
    `📞 ${esc(request.phone)}`,
    `📎 ${esc(request.receiptName || 'receipt')}`,
    'افتح لوحة الإدارة لمراجعة الوصل وتأكيد الطلب.',
  ].join('\n');
  await notifyOwner(subject, text, html);
}

export async function notifyNewSiteOrder(site: any, order: any): Promise<void> {
  const items = Array.isArray(order.items) ? order.items : [];
  const itemsText = items.map((item: any) => `• ${item.name} × ${item.quantity}`).join('\n');
  const subject = `🛒 طلب جديد على ${site.name} — ${order.ref}`;
  const text = [
    `طلب جديد من موقع ${site.name}`,
    '━━━━━━━━━━━━',
    `المرجع: ${order.ref}`,
    `العميل: ${order.customerName} — ${order.phone}`,
    `العنوان: ${order.wilaya}${order.city ? ` - ${order.city}` : ''} — ${order.address}`,
    '━━━━━━━━━━━━',
    itemsText,
    '━━━━━━━━━━━━',
    `المجموع: ${money(order.total)}`,
    `الموقع: https://${site.customDomain || `${site.subdomain}.pages.dev`}`,
  ].join('\n');
  const itemsHtml = items
    .map((item: any) => `• <b>${esc(item.name)}</b> × ${Number(item.quantity) || 0}`)
    .join('\n');
  const html = [
    '<b>🛒 طلب جديد من موقع عميل</b>',
    '━━━━━━━━━━━━',
    `🔖 ${esc(order.ref)}`,
    `🌐 ${esc(site.name)}`,
    `👤 ${esc(order.customerName)} | ${esc(order.phone)}`,
    `📍 ${esc(order.wilaya)}${order.city ? ` - ${esc(order.city)}` : ''}`,
    `📌 ${esc(order.address)}`,
    '━━━━━━━━━━━━',
    itemsHtml,
    '━━━━━━━━━━━━',
    `💰 <b>${esc(money(order.total))}</b>`,
  ].join('\n');
  await notifyOwner(subject, text, html);
}

export async function notifyNewSiteLead(site: any, lead: any): Promise<void> {
  const subject = `✉️ رسالة جديدة من ${site.name}`;
  const text = [
    `رسالة جديدة من موقع ${site.name}`,
    '━━━━━━━━━━━━',
    `الاسم: ${lead.name}`,
    lead.phone ? `الهاتف: ${lead.phone}` : '',
    lead.email ? `البريد: ${lead.email}` : '',
    '━━━━━━━━━━━━',
    clean(lead.message),
    `الموقع: https://${site.customDomain || `${site.subdomain}.pages.dev`}`,
  ].filter(Boolean).join('\n');
  const html = [
    '<b>✉️ رسالة جديدة من موقع عميل</b>',
    '━━━━━━━━━━━━',
    `🌐 ${esc(site.name)}`,
    `👤 ${esc(lead.name)}`,
    lead.phone ? `📞 ${esc(lead.phone)}` : '',
    lead.email ? `✉️ ${esc(lead.email)}` : '',
    '━━━━━━━━━━━━',
    esc(clean(lead.message)),
  ].filter(Boolean).join('\n');
  await notifyOwner(subject, text, html);
}
