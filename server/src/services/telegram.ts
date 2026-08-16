const TELEGRAM_API = 'https://api.telegram.org';

function getBotToken(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN || null;
}

function getChatId(): string | null {
  return process.env.TELEGRAM_CHAT_ID || null;
}

export async function sendTelegramMessage(text: string): Promise<boolean> {
  const token = getBotToken();
  const chatId = getChatId();
  if (!token || !chatId) {
    if (process.env.NODE_ENV !== 'production' || process.env.LOG_NO_TELEGRAM === '1') {
      console.log(`[Telegram] Skipped (token=${!!token}, chatId=${!!chatId})`);
    }
    return false;
  }

  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[Telegram] API error ${res.status}: ${body.slice(0, 200)}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Telegram] Send error:', err);
    return false;
  }
}

export function sendNewOrderTelegramAlert(order: {
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
    .map(item => `• <b>${escapeHtml(item.name)}</b> × ${item.quantity}`)
    .join('\n');

  const text = `<b>🛒 طلب جديد!</b>
━━━━━━━━━━━━
👤 ${escapeHtml(order.customer)} | ${order.phone}
📍 ${escapeHtml(order.wilaya)} - ${escapeHtml(order.municipality)}
📌 ${escapeHtml(order.address)}
━━━━━━━━━━━━
${itemsText}
━━━━━━━━━━━━
💰 المجموع: <b>${order.total.toLocaleString()} د.ج</b>
🆔 #${order.id.slice(0, 8)}`;

  return sendTelegramMessage(text);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}