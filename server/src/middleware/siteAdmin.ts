import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { Unauthorized } from '../utils/errors';
import { verifySiteAdminSession } from '../utils/jwt';

export const SITE_ADMIN_COOKIE = 'aos_site_admin';

export interface SiteAdminRequest extends Request {
  siteId?: string;
  siteInfo?: { id: string; name: string; subdomain: string; status: string };
}

/**
 * The dashboard lives on the AOS origin, so the session is an HttpOnly cookie
 * scoped to /api/site-admin. It carries a site id, never a user id: a customer
 * can only ever reach the one site whose link they were given.
 */
export async function requireSiteAdmin(req: SiteAdminRequest, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[SITE_ADMIN_COOKIE];
    if (!token) return next(new Unauthorized('رابط الدخول غير صالح أو منتهي.'));
    const payload = verifySiteAdminSession(token);
    const site = await prisma.site.findUnique({
      where: { id: payload.siteId },
      select: { id: true, name: true, subdomain: true, status: true, adminSessionVersion: true },
    });
    if (!site || site.adminSessionVersion !== payload.version) {
      return next(new Unauthorized('تم تجديد رابط الدخول. اطلب رابطاً جديداً من AOS.'));
    }
    req.siteId = site.id;
    req.siteInfo = { id: site.id, name: site.name, subdomain: site.subdomain, status: site.status };
    next();
  } catch {
    next(new Unauthorized('رابط الدخول غير صالح أو منتهي.'));
  }
}
