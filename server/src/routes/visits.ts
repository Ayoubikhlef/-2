import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../utils/prisma';
import { resolveClientIp } from '../utils/trustProxy';

export const visitRouter = Router();

const VISITOR_COOKIE = 'aos_vid';
const VISITOR_COOKIE_MAX_AGE = 365 * 24 * 60 * 60 * 1000;
const VISITOR_ID_PATTERN = /^[a-f0-9-]{36}$/i;

// Common crawlers, CLI clients and preview bots. A real storefront visit comes
// from a browser that runs the footer script, so filtering the obvious ones
// keeps the public number meaningful.
const BOT_UA =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|python-requests|curl\/|wget\/|powershell|winhttp|go-http-client|okhttp|node-fetch|axios\/|libwww|scrapy|httpclient/i;

const DAY_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Africa/Algiers',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

// A client that does not keep the cookie must not create a new visit on every
// request. This in-memory guard allows one cookie-less visit per IP and day;
// the cookie then carries the stable id.
const cookielessSeen = new Map<string, string>();
const MAX_COOKIELESS_ENTRIES = 10_000;

function dayKey(): string {
  return DAY_FORMATTER.format(new Date());
}

function hashVisitor(value: string): string {
  return crypto
    .createHash('sha256')
    .update(`${value}|${process.env.VISIT_SALT || process.env.AI_IP_SALT || process.env.JWT_SECRET || 'aos-visit'}`)
    .digest('hex')
    .slice(0, 32);
}

function rememberCookieless(ip: string, day: string): boolean {
  if (cookielessSeen.get(ip) === day) return false;
  if (cookielessSeen.size >= MAX_COOKIELESS_ENTRIES) {
    for (const [key, seen] of cookielessSeen) {
      if (seen !== day) cookielessSeen.delete(key);
    }
    if (cookielessSeen.size >= MAX_COOKIELESS_ENTRIES) cookielessSeen.clear();
  }
  cookielessSeen.set(ip, day);
  return true;
}

async function readStats(): Promise<{ visitors: number; today: number }> {
  const day = dayKey();
  const [today, distinct] = await Promise.all([
    prisma.siteVisit.count({ where: { day } }),
    prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(DISTINCT "visitorHash") AS count FROM "SiteVisit"
    `,
  ]);
  const baseline = Math.max(0, Math.floor(Number(process.env.VISIT_BASE_COUNT || 0)) || 0);
  return {
    visitors: Number(distinct[0]?.count || 0) + baseline,
    today,
  };
}

/**
 * Records one visitor per browser per day and returns the public totals.
 * No IP is stored: the row holds a salted hash of a random first-party id.
 */
visitRouter.post('/track', async (req: Request, res: Response) => {
  try {
    const userAgent = String(req.headers['user-agent'] || '');
    if (BOT_UA.test(userAgent)) {
      return res.json(await readStats());
    }

    const cookieValue = req.cookies?.[VISITOR_COOKIE];
    const existing =
      typeof cookieValue === 'string' && VISITOR_ID_PATTERN.test(cookieValue) ? cookieValue : '';
    const visitorId = existing || crypto.randomUUID();
    const day = dayKey();

    if (existing) {
      const visitorHash = hashVisitor(existing);
      await prisma.siteVisit.upsert({
        where: { day_visitorHash: { day, visitorHash } },
        update: {},
        create: { day, visitorHash },
      });
    } else {
      const ip = resolveClientIp(req);
      if (ip && ip !== 'unknown' && rememberCookieless(ip, day)) {
        const visitorHash = hashVisitor(visitorId);
        await prisma.siteVisit.upsert({
          where: { day_visitorHash: { day, visitorHash } },
          update: {},
          create: { day, visitorHash },
        });
      }
      res.cookie(VISITOR_COOKIE, visitorId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: VISITOR_COOKIE_MAX_AGE,
        path: '/',
      });
    }

    res.json(await readStats());
  } catch (err) {
    console.error('[Visits] track failed:', err instanceof Error ? err.message : 'Error');
    // The counter is decorative: a database hiccup must never break the page.
    res.json({ visitors: 0, today: 0 });
  }
});

visitRouter.get('/stats', async (_req: Request, res: Response) => {
  try {
    res.json(await readStats());
  } catch (err) {
    console.error('[Visits] stats failed:', err instanceof Error ? err.message : 'Error');
    res.json({ visitors: 0, today: 0 });
  }
});
