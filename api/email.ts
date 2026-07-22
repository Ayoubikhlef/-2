import { Pool } from 'pg';
import nodemailer from 'nodemailer';
import { z } from 'zod';

let pool: Pool | null = null;
function getPool() {
  if (!pool) pool = new Pool({ connectionString: process.env.POSTGRES_URL, max: 3 });
  return pool;
}

async function query(text: string, params?: any[]) {
  const c = await getPool().connect();
  try { return await c.query(text, params); } finally { c.release(); }
}

const sendSchema = z.object({
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(50000),
  testEmail: z.string().email().optional(),
});

const smtpConfig = {
  host: process.env.SMTP_HOST || '',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
};

const isConfigured = () => !!(smtpConfig.host && smtpConfig.auth.user && smtpConfig.auth.pass);

export default async function handler(req: any, res: any) {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const parts = url.pathname.replace(/^\/api\/email\/?/, '').split('/').filter(Boolean);

  try {
    // GET /api/email/config-status
    if (req.method === 'GET' && parts.length === 1 && parts[0] === 'config-status') {
      return res.json({ configured: isConfigured() });
    }

    // POST /api/email/send
    if (req.method === 'POST' && parts.length === 1 && parts[0] === 'send') {
      const { subject, body, testEmail } = sendSchema.parse(req.body);

      if (!isConfigured()) {
        console.log(`[Email] SMTP not configured. Would send: subject="${subject}" body="${body.substring(0, 100)}..."`);
        return res.json({ sent: true, mode: 'log', note: 'SMTP not configured, email logged only' });
      }

      let recipients: string[];
      if (testEmail) {
        recipients = [testEmail];
      } else {
        const r = await query(`SELECT email FROM aos_newsletter`);
        recipients = r.rows.map(row => row.email);
      }

      if (recipients.length === 0) {
        return res.status(400).json({ error: 'No recipients' });
      }

      const transporter = nodemailer.createTransport(smtpConfig);
      const info = await transporter.sendMail({
        from: `"Ayoub Office Services" <${smtpConfig.auth.user}>`,
        to: testEmail || recipients[0],
        bcc: testEmail ? undefined : recipients,
        subject,
        html: body,
      });

      console.log(`[Email] Sent to ${recipients.length} recipients. MessageId: ${info.messageId}`);
      return res.json({ sent: true, count: recipients.length, messageId: info.messageId });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('[Email API]', err);
    res.status(500).json({ error: err.message });
  }
}
