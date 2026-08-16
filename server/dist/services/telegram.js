"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTelegramMessage = sendTelegramMessage;
exports.sendNewOrderTelegramAlert = sendNewOrderTelegramAlert;
exports.sendDiscordWebhook = sendDiscordWebhook;
exports.sendNewOrderDiscordAlert = sendNewOrderDiscordAlert;
const TELEGRAM_API = 'https://api.telegram.org';
function getBotToken() {
    return process.env.TELEGRAM_BOT_TOKEN || null;
}
function getChatId() {
    return process.env.TELEGRAM_CHAT_ID || null;
}
async function sendTelegramMessage(text) {
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
    }
    catch (err) {
        console.error('[Telegram] Send error:', err);
        return false;
    }
}
function sendNewOrderTelegramAlert(order) {
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
function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
async function sendDiscordWebhook(text) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL || null;
    if (!webhookUrl) {
        console.log('[Discord] No DISCORD_WEBHOOK_URL set - skipped');
        return false;
    }
    try {
        const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: text }),
        });
        if (!res.ok) {
            const body = await res.text().catch(() => '');
            console.error(`[Discord] Webhook error ${res.status}: ${body.slice(0, 200)}`);
            return false;
        }
        return true;
    }
    catch (err) {
        console.error('[Discord] Send error:', err);
        return false;
    }
}
function sendNewOrderDiscordAlert(order) {
    const itemsText = order.items
        .map(item => `• **${item.name}** × ${item.quantity}`)
        .join('\n');
    const text = `**🛒 طلب جديد!**\n━━━━━━━━━━━━\n👤 ${order.customer} | ${order.phone}\n📍 ${order.wilaya} - ${order.municipality}\n📌 ${order.address}\n━━━━━━━━━━━━\n${itemsText}\n━━━━━━━━━━━━\n💰 المجموع: **${order.total.toLocaleString()} د.ج**\n🆔 #${order.id.slice(0, 8)}`;
    return sendDiscordWebhook(text);
}
//# sourceMappingURL=telegram.js.map