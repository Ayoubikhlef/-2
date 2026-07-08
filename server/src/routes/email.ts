import { Router, Request, Response } from 'express';
import { z } from 'zod';
import nodemailer from 'nodemailer';
import { prisma } from '../utils/prisma';

export const emailRouter = Router();

const sendSchema = z.object({
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(50000),
  testEmail: z.string().email().optional(),
});

const smtpConfig = {
  host: process.env.SMTP_HOST || '',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
};

const isConfigured = () => !!(smtpConfig.host && smtpConfig.auth.user && smtpConfig.auth.pass);

emailRouter.post('/send', async (req: Request, res: Response) => {
  try {
    const { subject, body, testEmail } = sendSchema.parse(req.body);

    if (!isConfigured()) {
      console.log(`[Email] SMTP not configured. Would send: subject="${subject}" body="${body.substring(0, 100)}..."`);
      return res.json({ sent: true, mode: 'log', note: 'SMTP not configured, email logged only' });
    }

    let recipients: string[];
    if (testEmail) {
      recipients = [testEmail];
    } else {
      const rows = await prisma.$queryRaw<{ email: string }[]>`SELECT email FROM aos_newsletter`;
      recipients = rows.map(r => r.email);
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
    res.json({ sent: true, count: recipients.length, messageId: info.messageId });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('[Email] Send error:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

emailRouter.get('/config-status', (_req: Request, res: Response) => {
  res.json({ configured: isConfigured() });
});
