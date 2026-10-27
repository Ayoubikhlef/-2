import nodemailer from 'nodemailer';

const EMAIL_PATTERN = /^[^\s@<>()[\]\\,;:]+@[^\s@<>()[\]\\,;:]+\.[^\s@<>()[\]\\,;:]{2,}$/;

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

export function isEmailAlertConfigured(): boolean {
  const config = smtpConfig();
  return Boolean(config.host && config.auth.pass && getSecurityAlertRecipient());
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendSecurityAlertEmail(subject: string, text: string): Promise<boolean> {
  if (!isEmailAlertConfigured()) {
    if (process.env.NODE_ENV !== 'production' || process.env.LOG_NO_EMAIL === '1') {
      console.log('[EmailAlerts] Skipped (SMTP or recipient not configured)');
    }
    return false;
  }

  const recipient = getSecurityAlertRecipient()!;
  const config = smtpConfig();
  const safeSubject = subject.replace(/[\r\n]+/g, ' ').slice(0, 180);
  const safeText = text.slice(0, 10_000);

  const html = `
    <div style="background:#0f172a;padding:24px;border-radius:12px;font-family:Arial,Helvetica,sans-serif;color:#e2e8f0">
      <h2 style="margin:0 0 16px;color:#f87171;font-size:18px">${escapeHtml(safeSubject)}</h2>
      <pre style="white-space:pre-wrap;word-break:break-word;margin:0;font-family:Consolas,monospace;font-size:13px;line-height:1.6;color:#cbd5e1">${escapeHtml(safeText)}</pre>
    </div>`;

  try {
    const transporter = nodemailer.createTransport(config);
    const info = await transporter.sendMail({
      from: `"AOS Security" <${smtpUser()}>`,
      to: recipient,
      subject: safeSubject,
      text: safeText,
      html,
    });
    console.log(`[EmailAlerts] Sent to ${recipient}. MessageId: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error('[EmailAlerts] Send error:', err);
    return false;
  }
}
