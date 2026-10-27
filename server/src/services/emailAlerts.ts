import nodemailer from 'nodemailer';

const EMAIL_PATTERN = /^[^\s@<>()[\]\\,;:]+@[^\s@<>()[\]\\,;:]+\.[^\s@<>()[\]\\,;:]{2,}$/;
const RESEND_API_URL = 'https://api.resend.com/emails';

export type EmailAlertProvider = 'resend' | 'smtp';

let lastEmailError: string | null = null;

function resendApiKey(): string {
  return (process.env.RESEND_API_KEY || '').trim();
}

function smtpUser(): string {
  return (process.env.SMTP_USER || '').trim();
}

function smtpConfig() {
  return {
    host: (process.env.SMTP_HOST || '').trim(),
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: smtpUser(),
      pass: (process.env.SMTP_PASS || '').replace(/\s/g, ''),
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  };
}

function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value) && value.length <= 254;
}

/**
 * Security alerts go to SECURITY_ALERT_EMAIL when it is a valid address.
 * Otherwise fall back to SMTP_USER, which is often the mailbox used to send
 * mail (SendGrid's "apikey" user is not an address and is skipped).
 */
export function getSecurityAlertRecipient(): string | null {
  const explicit = (process.env.SECURITY_ALERT_EMAIL || '').trim();
  if (explicit && isValidEmail(explicit)) return explicit;
  const fallback = smtpUser();
  if (fallback && isValidEmail(fallback)) return fallback;
  return null;
}

/**
 * Render Free blocks outbound SMTP ports (25, 465, 587), so an HTTPS email
 * API such as Resend is the recommended channel there. SMTP remains supported
 * for local development and paid Render instances.
 */
export function getEmailAlertProvider(): EmailAlertProvider | null {
  if (!getSecurityAlertRecipient()) return null;
  if (resendApiKey()) return 'resend';
  const config = smtpConfig();
  if (config.host && config.auth.pass) return 'smtp';
  return null;
}

export function isEmailAlertConfigured(): boolean {
  return getEmailAlertProvider() !== null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeError(err: unknown): string {
  let message: string;
  if (err instanceof Error) {
    const extra = err as Error & { code?: string; response?: string; responseCode?: number };
    message = [extra.code, extra.responseCode, extra.message, extra.response]
      .filter(Boolean)
      .join(' | ');
  } else {
    message = String(err);
  }
  for (const secret of [
    resendApiKey(),
    smtpUser(),
    (process.env.SMTP_PASS || '').replace(/\s/g, ''),
  ]) {
    if (secret) message = message.split(secret).join('***');
  }
  return message.replace(/[\r\n]+/g, ' ').slice(0, 300);
}

export function getLastEmailError(): string | null {
  return lastEmailError;
}

function buildHtml(subject: string, text: string): string {
  return `
    <div style="background:#0f172a;padding:24px;border-radius:12px;font-family:Arial,Helvetica,sans-serif;color:#e2e8f0">
      <h2 style="margin:0 0 16px;color:#f87171;font-size:18px">${escapeHtml(subject)}</h2>
      <pre style="white-space:pre-wrap;word-break:break-word;margin:0;font-family:Consolas,monospace;font-size:13px;line-height:1.6;color:#cbd5e1">${escapeHtml(text)}</pre>
    </div>`;
}

async function sendViaResend(
  recipient: string,
  subject: string,
  text: string,
  html: string
): Promise<boolean> {
  const from =
    (process.env.SECURITY_ALERT_FROM || '').trim() ||
    'AOS Security <onboarding@resend.dev>';

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [recipient],
      subject,
      text,
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Resend API ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = (await response.json().catch(() => ({}))) as { id?: string };
  console.log(`[EmailAlerts] Sent via Resend to ${recipient}. Id: ${data.id || 'unknown'}`);
  return true;
}

async function sendViaSmtp(
  recipient: string,
  subject: string,
  text: string,
  html: string
): Promise<boolean> {
  const transporter = nodemailer.createTransport(smtpConfig());
  const info = await transporter.sendMail({
    from: process.env.SECURITY_ALERT_FROM || `"AOS Security" <${smtpUser()}>`,
    to: recipient,
    subject,
    text,
    html,
  });
  console.log(`[EmailAlerts] Sent via SMTP to ${recipient}. MessageId: ${info.messageId}`);
  return true;
}

export async function sendSecurityAlertEmail(subject: string, text: string): Promise<boolean> {
  const recipient = getSecurityAlertRecipient();
  const provider = getEmailAlertProvider();
  if (!recipient || !provider) {
    lastEmailError = 'Email alerts are not configured or no valid recipient is available';
    if (process.env.NODE_ENV !== 'production' || process.env.LOG_NO_EMAIL === '1') {
      console.log('[EmailAlerts] Skipped (provider or recipient not configured)');
    }
    return false;
  }

  const safeSubject = subject.replace(/[\r\n]+/g, ' ').slice(0, 180);
  const safeText = text.slice(0, 10_000);
  const html = buildHtml(safeSubject, safeText);

  try {
    if (provider === 'resend') {
      await sendViaResend(recipient, safeSubject, safeText, html);
    } else {
      await sendViaSmtp(recipient, safeSubject, safeText, html);
    }
    lastEmailError = null;
    return true;
  } catch (err) {
    lastEmailError = sanitizeError(err);
    console.error('[EmailAlerts] Send error:', err);
    return false;
  }
}
