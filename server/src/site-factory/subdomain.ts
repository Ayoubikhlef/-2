import { prisma } from '../utils/prisma';
import { RESERVED_SUBDOMAINS } from './defaults';

export interface SubdomainCheck {
  available: boolean;
  normalized: string;
  reason?: 'invalid' | 'reserved' | 'taken' | 'error';
  message?: string;
  suggestions: string[];
}

const VALID = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;

export function normalizeSubdomain(value: string): string {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/\.pages\.dev$/i, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

function suffixSuggestions(base: string): string[] {
  const clean = base.replace(/-+$/g, '') || 'mysite';
  const candidates = [
    `${clean}-dz`,
    `${clean}-site`,
    `${clean}-1`,
    `${clean}-${new Date().getFullYear()}`,
    `${clean}-online`,
  ];
  return candidates.map((c) => c.slice(0, 40)).filter((c, i, arr) => arr.indexOf(c) === i).slice(0, 4);
}

export async function checkSubdomain(rawName: string, excludeSiteId?: string): Promise<SubdomainCheck> {
  const name = normalizeSubdomain(rawName);
  if (name.length < 3 || !VALID.test(name)) {
    return {
      available: false,
      normalized: name,
      reason: 'invalid',
      message: 'الاسم غير صالح. استعمل 3 إلى 40 حرفاً إنجليزياً أو رقماً، مع شرطات فقط في الوسط.',
      suggestions: suffixSuggestions(name || 'mysite'),
    };
  }
  if (RESERVED_SUBDOMAINS.has(name)) {
    return {
      available: false,
      normalized: name,
      reason: 'reserved',
      message: 'هذا الاسم محجوز. اختر اسماً آخر.',
      suggestions: suffixSuggestions(name),
    };
  }

  try {
    const [site, request] = await Promise.all([
      prisma.site.findUnique({ where: { subdomain: name } }),
      prisma.siteRequest.findFirst({
        where: {
          subdomain: name,
          status: { notIn: ['rejected', 'cancelled'] },
        },
        select: { id: true, status: true },
      }),
    ]);
    if ((site && site.id !== excludeSiteId) || request) {
      return {
        available: false,
        normalized: name,
        reason: 'taken',
        message: 'هذا الاسم محجوز لدينا بالفعل. جرّب أحد الاقتراحات.',
        suggestions: suffixSuggestions(name),
      };
    }
  } catch {
    return {
      available: false,
      normalized: name,
      reason: 'error',
      message: 'تعذر التحقق الآن. يمكنك المتابعة وسنتأكد من الاسم عند النشر.',
      suggestions: suffixSuggestions(name),
    };
  }

  return { available: true, normalized: name, suggestions: [] };
}

/** Optional: check whether the Pages project already exists in our account. */
export async function checkCloudflareProject(name: string): Promise<'free' | 'ours' | 'unknown'> {
  const token = (process.env.CLOUDFLARE_API_TOKEN || '').trim();
  const account = (process.env.CLOUDFLARE_ACCOUNT_ID || '').trim();
  if (!token || !account) return 'unknown';
  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account)}/pages/projects/${encodeURIComponent(name)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (res.status === 404) return 'free';
    if (res.ok) return 'ours';
    return 'unknown';
  } catch {
    return 'unknown';
  }
}
