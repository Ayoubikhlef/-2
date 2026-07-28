"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const nodemailer_1 = __importDefault(require("nodemailer"));
const prisma_1 = require("../utils/prisma");
const auth_1 = require("../middleware/auth");
exports.emailRouter = (0, express_1.Router)();
const sendSchema = zod_1.z.object({
    subject: zod_1.z.string().min(1).max(200),
    body: zod_1.z.string().min(1).max(50000),
    testEmail: zod_1.z.string().email().optional(),
});
const smtpPass = (process.env.SMTP_PASS || '').replace(/\s/g, '');
const smtpConfig = {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER || '',
        pass: smtpPass,
    },
    connectionTimeout: 10000,
};
const isConfigured = () => !!(smtpConfig.host && smtpConfig.auth.user && smtpConfig.auth.pass);
exports.emailRouter.post('/send', auth_1.requireAuth, (0, auth_1.requireRole)('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
    try {
        const { subject, body, testEmail } = sendSchema.parse(req.body);
        if (!isConfigured()) {
            console.log(`[Email] SMTP not configured. Would send: subject="${subject}" body="${body.substring(0, 100)}..."`);
            return res.json({ sent: true, mode: 'log', note: 'SMTP not configured, email logged only' });
        }
        let recipients;
        if (testEmail) {
            recipients = [testEmail];
        }
        else {
            const rows = await prisma_1.prisma.newsletterSubscriber.findMany({ select: { email: true } });
            recipients = rows.map(r => r.email);
        }
        if (recipients.length === 0) {
            return res.status(400).json({ error: 'No recipients' });
        }
        const transporter = nodemailer_1.default.createTransport(smtpConfig);
        const info = await transporter.sendMail({
            from: `"Ayoub Office Services" <${smtpConfig.auth.user}>`,
            to: testEmail || recipients[0],
            bcc: testEmail ? undefined : recipients,
            subject,
            html: body,
        });
        console.log(`[Email] Sent to ${recipients.length} recipients. MessageId: ${info.messageId}`);
        res.json({ sent: true, count: recipients.length, messageId: info.messageId });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: err.errors });
        }
        console.error('[Email] Send error:', err);
        res.status(500).json({ error: 'Failed to send email' });
    }
});
exports.emailRouter.get('/config-status', (_req, res) => {
    res.json({ configured: isConfigured() });
});
//# sourceMappingURL=email.js.map