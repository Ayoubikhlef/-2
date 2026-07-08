const STATUS_TRANSLATIONS: Record<string, { ar: string; fr: string; en: string }> = {
  new: { ar: 'جديد', fr: 'Nouveau', en: 'New' },
  processing: { ar: 'قيد المعالجة', fr: 'En cours', en: 'Processing' },
  completed: { ar: 'مكتمل', fr: 'Complété', en: 'Completed' },
  cancelled: { ar: 'ملغي', fr: 'Annulé', en: 'Cancelled' },
};

export async function sendWhatsAppNotification(phone: string, customer: string, orderId: string, status: string, total?: number) {
  const s = STATUS_TRANSLATIONS[status] || { ar: status, fr: status, en: status };

  const arMsg = `مرحباً ${customer} 🙏\nطلبك رقم #${orderId.slice(0, 8)}: ${s.ar}${total ? `\nالمبلغ: ${total.toLocaleString()} د.ج` : ''}\nشكراً لتسوقك مع Ayoub Office Services ❤️`;
  const frMsg = `Bonjour ${customer} 🙏\nVotre commande #${orderId.slice(0, 8)}: ${s.fr}${total ? `\nMontant: ${total.toLocaleString()} DZD` : ''}\nMerci d'avoir choisi Ayoub Office Services ❤️`;
  const enMsg = `Hello ${customer} 🙏\nYour order #${orderId.slice(0, 8)}: ${s.en}${total ? `\nAmount: ${total.toLocaleString()} DZD` : ''}\nThank you for shopping at Ayoub Office Services ❤️`;

  const phoneClean = phone.replace(/[^0-9]/g, '');
  const country = phoneClean.startsWith('213') ? phoneClean : `213${phoneClean.replace(/^0/, '')}`;
  const waUrl = `https://wa.me/${country}?text=${encodeURIComponent(arMsg)}`;

  console.log(`[WhatsApp] Notification for ${phone}: order ${orderId} → ${status}`);
  console.log(`[WhatsApp] Link: ${waUrl}`);

  try {
    const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL;
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        }),
      });
    }
  } catch (err) {
    console.error('[WhatsApp] Webhook error:', err);
  }

  return waUrl;
}
