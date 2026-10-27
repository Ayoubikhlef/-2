import { Router, Response } from 'express';
import { isIP } from 'net';
import { prisma } from '../utils/prisma';
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth';
import {
  blockIp,
  getBlockedIps,
  getRecentIncidents,
  getSecurityStatus,
  sendTestSecurityAlert,
  unblockIp,
} from '../services/security';

export const securityRouter = Router();

securityRouter.use(requireAuth, requireRole('SUPER_ADMIN', 'ADMIN'));

securityRouter.get('/status', (_req, res: Response) => {
  res.json(getSecurityStatus());
});

securityRouter.get('/events', async (req: AuthRequest, res: Response) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 300);
  let history: any[] = [];
  try {
    history = await prisma.auditLog.findMany({
      where: { action: { startsWith: 'SECURITY_' } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        action: true,
        resource: true,
        details: true,
        ipAddress: true,
        createdAt: true,
      },
    });
  } catch {
    /* AuditLog table may not exist yet */
  }

  res.json({
    status: getSecurityStatus(),
    incidents: getRecentIncidents(limit),
    blockedIps: getBlockedIps(),
    history,
  });
});

securityRouter.post('/block', (req: AuthRequest, res: Response) => {
  const ip = String(req.body?.ip || '').trim();
  const minutes = Number(req.body?.minutes) || 60;
  const reason = String(req.body?.reason || 'Blocked manually from the admin dashboard');
  if (isIP(ip) === 0) {
    res.status(400).json({ error: 'Invalid IP address' });
    return;
  }
  const blocked = blockIp(ip, minutes, reason);
  if (!blocked) {
    res.status(400).json({ error: 'This IP cannot be blocked (private, loopback, or unknown)' });
    return;
  }
  res.json({ ok: true, blocked });
});

securityRouter.delete('/block/:ip', (req: AuthRequest, res: Response) => {
  const ip = decodeURIComponent(req.params.ip || '');
  const removed = unblockIp(ip);
  if (!removed) {
    res.status(404).json({ error: 'IP is not blocked' });
    return;
  }
  res.json({ ok: true });
});

securityRouter.post('/test-alert', async (_req: AuthRequest, res: Response) => {
  const result = await sendTestSecurityAlert();
  if (!result.delivered) {
    res.status(502).json({
      error:
        'No alert was delivered. Set SMTP_HOST/SMTP_USER/SMTP_PASS (+ SECURITY_ALERT_EMAIL), DISCORD_WEBHOOK_URL, or TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID on the API server.',
      channels: result.channels,
    });
    return;
  }
  res.json({ ok: true, channels: result.channels });
});
