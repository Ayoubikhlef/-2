const STATUS_TRANSLATIONS: Record<string, { ar: string; fr: string; en: string }> = {
  new: { ar: 'جديد', fr: 'Nouveau', en: 'New' },
  processing: { ar: 'قيد المعالجة', fr: 'En cours', en: 'Processing' },
  completed: { ar: 'مكتمل', fr: 'Complété', en: 'Completed' },
  cancelled: { ar: 'ملغي', fr: 'Annulé', en: 'Cancelled' },
};

function getWebhookHeaders() {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export async function sendWhatsAppNotification(phone: string, customer: string, orderId: string, status: string, total?: number) {
  const s = STATUS_TRANSLATIONS[status] || { ar: status, fr: status, en: status };

  const arMsg = `مرحباً ${customer} 🙏\nطلبك رقم #${orderId.slice(0, 8)}: ${s.ar}${total ? `\nالمبلغ: ${total.toLocaleString()} د.ج` : ''}\nشكراً لتسوقك مع Ayoub Office Services ❤️`;
  const frMsg = `Bonjour ${customer} 🙏\nVotre commande #${orderId.slice(0, 8)}: ${s.fr}${total ? `\nMontant: ${total.toLocaleString()} DZD` : ''}\nMerci d'avoir choisi Ayoub Office Services ❤️`;
  const enMsg = `Hello ${customer} 🙏\nYour order #${orderId.slice(0, 8)}: ${s.en}${total ? `\nAmount: ${total.toLocaleString()} DZD` : ''}\nThank you for shopping at Ayoub Office Services ❤️`;

  const phoneClean = phone.replace(/[^0-9]/g, '');
  const country = phoneClean.startsWith('213') ? phoneClean : `213${phoneClean.replace(/^0/, '')}`;
  const waUrl = `https://wa.me/${country}?text=${encodeURIComponent(arMsg)}`;

  console.log(`[WhatsApp] Notification for ${phone.slice(0, 4)}****: order ${orderId.slice(0, 8)} → ${status}`);

  try {
    const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL;
    if (webhookUrl) {
      const body = webhookUrl.includes('graph.facebook.com')
        ? {
            messaging_product: 'whatsapp',
            to: country,
            type: 'text',
            text: { body: arMsg },
          }
        : {
            messaging_product: 'whatsapp',
            to: country,
            type: 'template',
            template: {
              name: 'order_status',
              language: { code: 'ar' },
              components: [{
                type: 'body',
                parameters: [
                  { type: 'text', text: customer },
                  { type: 'text', text: orderId.slice(0, 8) },
                  { type: 'text', text: s.ar },
                  { type: 'text', text: total ? `${total.toLocaleString()} DZD` : '' },
                ],
              }],
            },
          };
      await fetch(webhookUrl, {
        method: 'POST',
        headers: getWebhookHeaders(),
        body: JSON.stringify(body),
      });
    }
  } catch (err) {
    console.error('[WhatsApp] Webhook error:', err);
  }

  return waUrl;
}

export async function sendNewOrderAlert(order: {
  id: string;
  customer: string;
  phone: string;
  wilaya: string;
  municipality: string;
  address: string;
  total: number;
  items: { name: string; quantity: number }[];
}) {
  const itemsText = order.items
    .map(item => `• ${item.name} × ${item.quantity}`)
    .join('\n');

  const message = `🛒 *طلب جديد!*
━━━━━━━━━━━━
👤 ${order.customer} | ${order.phone}
📍 ${order.wilaya} - ${order.municipality}
📌 ${order.address}
━━━━━━━━━━━━
${itemsText}
━━━━━━━━━━━━
💰 المجموع: ${order.total.toLocaleString()} د.ج
🆔 #${order.id.slice(0, 8)}`;

  console.log(`[WhatsApp] New order alert for admin: ${order.id.slice(0, 8)}`);

  try {
    const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL;
    if (!webhookUrl) {
      console.warn('[WhatsApp] No WHATSAPP_WEBHOOK_URL set - admin alert skipped');
      return;
    }

    const adminPhone = process.env.ADMIN_WHATSAPP || '213674113290';
    const phoneClean = adminPhone.replace(/[^0-9]/g, '');
    const to = phoneClean.startsWith('213') ? phoneClean : `213${phoneClean.replace(/^0/, '')}`;

    await fetch(webhookUrl, {
      method: 'POST',
      headers: getWebhookHeaders(),
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: message },
      }),
    });
  } catch (err) {
    console.error('[WhatsApp] Admin alert error:', err);
  }
}
