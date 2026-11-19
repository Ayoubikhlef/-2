import type { AiStudioLanguage } from './api';
import {
  LANDING_THEME_CSS,
  LANDING_THEME_COLOR,
  buildLandingSceneScript,
  resolveLandingTheme,
  type LandingThemeChoice,
  type LandingThemeId,
} from './landingThemes';

/**
 * The landing-page tool asks the AI for strictly labelled copy, then turns it
 * into a self-contained HTML page. Building the page locally keeps the answer
 * fast, guarantees valid markup, and lets the seller's product photo stay in
 * the browser instead of being uploaded to the AI provider.
 */
export type LandingPageContent = {
  seoTitle: string;
  metaDescription: string;
  hero: {
    headline: string;
    subheadline: string;
    cta: string;
    trust: string;
  };
  problem: string[];
  solution: string[];
  benefits: string[];
  audience: string[];
  included: string[];
  steps: string[];
  offer: { price: string; lines: string[] };
  guarantee: string[];
  socialProof: string[];
  faq: Array<{ question: string; answer: string }>;
  finalCta: { headline: string; line: string; button: string };
  microcopy: string[];
  rawText?: string;
};

export type LandingPageOptions = {
  image?: string;
  language: AiStudioLanguage;
  productName?: string;
  price?: string;
  contact?: string;
  theme?: LandingThemeChoice;
};

type SectionKey =
  | 'seoTitle'
  | 'meta'
  | 'hero'
  | 'problem'
  | 'solution'
  | 'benefits'
  | 'audience'
  | 'included'
  | 'steps'
  | 'offer'
  | 'guarantee'
  | 'social'
  | 'faq'
  | 'final'
  | 'micro';

const HEADING_ALIASES: Record<string, SectionKey> = {
  'SEO TITLE': 'seoTitle',
  'TITRE SEO': 'seoTitle',
  'TITRE DE LA PAGE': 'seoTitle',
  'عنوان SEO': 'seoTitle',
  'عنوان محرك البحث': 'seoTitle',

  'META DESCRIPTION': 'meta',
  'META DESC': 'meta',
  'DESCRIPTION META': 'meta',
  'وصف الميتا': 'meta',
  'الوصف التعريفي': 'meta',

  HERO: 'hero',
  'SECTION HERO': 'hero',
  'الهيرو': 'hero',
  'القسم الرئيسي': 'hero',
  'الواجهة الرئيسية': 'hero',

  PROBLEM: 'problem',
  'LE PROBLEME': 'problem',
  'المشكلة': 'problem',

  SOLUTION: 'solution',
  'LA SOLUTION': 'solution',
  'الحل': 'solution',

  'KEY BENEFITS': 'benefits',
  BENEFITS: 'benefits',
  AVANTAGES: 'benefits',
  'الفوائد': 'benefits',
  'المميزات': 'benefits',
  'الفوائد الرئيسية': 'benefits',

  'WHO IT IS FOR': 'audience',
  "WHO IT'S FOR": 'audience',
  'POUR QUI': 'audience',
  'لمن هذا المنتج': 'audience',
  'لمن': 'audience',

  'WHAT IS INCLUDED': 'included',
  "WHAT'S INCLUDED": 'included',
  'CE QUI EST INCLUS': 'included',
  'ماذا تحصل عليه': 'included',
  'محتويات العلبة': 'included',

  'HOW IT WORKS': 'steps',
  'COMMENT CA MARCHE': 'steps',
  'كيف يعمل': 'steps',
  'كيف يعمل المنتج': 'steps',

  'OFFER AND PRICE': 'offer',
  'OFFER & PRICE': 'offer',
  'OFFRE ET PRIX': 'offer',
  'العرض والسعر': 'offer',
  'العرض': 'offer',

  'GUARANTEE AND DELIVERY': 'guarantee',
  'GUARANTEE & DELIVERY': 'guarantee',
  'GARANTIE ET LIVRAISON': 'guarantee',
  'الضمان والتوصيل': 'guarantee',

  'SOCIAL PROOF': 'social',
  'PREUVE SOCIALE': 'social',
  'آراء العملاء': 'social',
  'الدليل الاجتماعي': 'social',

  FAQ: 'faq',
  'QUESTIONS FREQUENTES': 'faq',
  'الأسئلة الشائعة': 'faq',
  'الاسئلة الشائعة': 'faq',

  'FINAL CTA': 'final',
  'DERNIER CTA': 'final',
  'الدعوة الأخيرة': 'final',
  'النداء الأخير': 'final',
  'دعوة الشراء': 'final',

  MICROCOPY: 'micro',
  'MICRO COPY': 'micro',
  'نصوص صغيرة': 'micro',
};

const LABELS: Record<
  AiStudioLanguage,
  {
    navLabel: string;
    navBenefits: string;
    navHow: string;
    navFaq: string;
    order: string;
    seeOffer: string;
    price: string;
    problem: string;
    solution: string;
    benefits: string;
    audience: string;
    included: string;
    how: string;
    offer: string;
    guarantee: string;
    social: string;
    faq: string;
    final: string;
    details: string;
    productFallback: string;
    footerNote: string;
    defaultMicro: string;
  }
> = {
  ar: {
    navLabel: 'أقسام الصفحة',
    navBenefits: 'المميزات',
    navHow: 'كيف يعمل',
    navFaq: 'الأسئلة',
    order: 'اطلب الآن',
    seeOffer: 'شاهد العرض',
    price: 'السعر',
    problem: 'المشكلة',
    solution: 'الحل',
    benefits: 'لماذا هذا المنتج؟',
    audience: 'لمن هذا المنتج؟',
    included: 'ماذا تحصل عليه؟',
    how: 'كيف يعمل؟',
    offer: 'عرض المنتج',
    guarantee: 'الضمان والتوصيل',
    social: 'آراء العملاء',
    faq: 'الأسئلة الشائعة',
    final: 'جاهز للطلب؟',
    details: 'تفاصيل إضافية',
    productFallback: 'صفحة المنتج',
    footerNote: 'راجع تفاصيل المنتج والضمان قبل الطلب.',
    defaultMicro: 'للاستفسار والطلب، تواصل معنا مباشرة.',
  },
  fr: {
    navLabel: 'Sections de la page',
    navBenefits: 'Avantages',
    navHow: 'Comment ça marche',
    navFaq: 'FAQ',
    order: 'Commander',
    seeOffer: 'Voir l’offre',
    price: 'Prix',
    problem: 'Le problème',
    solution: 'La solution',
    benefits: 'Pourquoi ce produit ?',
    audience: 'Pour qui ?',
    included: 'Ce que vous recevez',
    how: 'Comment ça marche ?',
    offer: 'L’offre',
    guarantee: 'Garantie et livraison',
    social: 'Avis clients',
    faq: 'Questions fréquentes',
    final: 'Prêt à commander ?',
    details: 'Détails supplémentaires',
    productFallback: 'Page produit',
    footerNote: 'Vérifiez les détails et la garantie avant de commander.',
    defaultMicro: 'Pour toute question ou commande, contactez-nous directement.',
  },
  en: {
    navLabel: 'Page sections',
    navBenefits: 'Benefits',
    navHow: 'How it works',
    navFaq: 'FAQ',
    order: 'Order now',
    seeOffer: 'View the offer',
    price: 'Price',
    problem: 'The problem',
    solution: 'The solution',
    benefits: 'Why this product?',
    audience: 'Who is it for?',
    included: 'What you get',
    how: 'How it works',
    offer: 'The offer',
    guarantee: 'Guarantee and delivery',
    social: 'Customer reviews',
    faq: 'Frequently asked questions',
    final: 'Ready to order?',
    details: 'Additional details',
    productFallback: 'Product page',
    footerNote: 'Review the product details and guarantee before ordering.',
    defaultMicro: 'For questions or orders, contact us directly.',
  },
};

const IMAGE_DATA_URL = /^data:image\/(?:png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/;
const PLACEHOLDER = /\[[^\]\n]{1,120}\]/;

function normalizeLabel(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u064B-\u0652]/g, '')
    .replace(/[：]/g, ':')
    .replace(/[^A-Z0-9\u0600-\u06FF ]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function cleanLine(line: string): string {
  return line
    .replace(/^\s*(?:[-–—•*]+|\d+[.)])\s*/, '')
    .replace(/^\s*>\s*/, '')
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .trim();
}

function isRule(line: string): boolean {
  return /^\s*[-–—_=]{3,}\s*$/.test(line);
}

function display(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function isPublic(value: string): boolean {
  return Boolean(value) && !PLACEHOLDER.test(value);
}

function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

function toBullets(lines: string[]): string[] {
  const out: string[] = [];
  for (const raw of lines) {
    if (isRule(raw)) continue;
    const cleaned = cleanLine(raw);
    if (!cleaned) continue;
    for (const part of cleaned.split(/\s+•\s+/)) {
      const item = part.trim();
      if (item) out.push(item);
    }
  }
  return dedupe(out);
}

function toParagraphs(lines: string[]): string[] {
  const blocks: string[] = [];
  let buffer: string[] = [];
  const flush = () => {
    const text = buffer.map(cleanLine).filter(Boolean).join(' ').trim();
    if (text) blocks.push(text);
    buffer = [];
  };
  for (const line of lines) {
    if (!line.trim() || isRule(line)) {
      flush();
      continue;
    }
    // Keep a bulleted list as separate short paragraphs instead of joining the
    // bullets into one long block.
    if (/^\s*(?:[-–—•*]|\d+[.)])\s+/.test(line)) {
      flush();
      const item = cleanLine(line);
      if (item) blocks.push(item);
      continue;
    }
    buffer.push(line);
  }
  flush();
  return blocks;
}

function readKeyValues(lines: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  let current = '';
  for (const raw of lines) {
    // A bullet starts a new item, not a continuation of the previous value.
    if (/^\s*(?:[-–—•*]|\d+[.)])\s+/.test(raw)) {
      current = '';
      continue;
    }
    const line = cleanLine(raw);
    if (!line) continue;
    const match = line.match(/^([^:]{2,40}):\s*(.*)$/);
    if (match) {
      current = normalizeLabel(match[1]).toLowerCase();
      map[current] = match[2].trim();
    } else if (current) {
      map[current] = `${map[current]} ${line}`.trim();
    }
  }
  return map;
}

function pick(map: Record<string, string>, keys: string[]): string {
  for (const key of keys) {
    const value = display(map[key] || '');
    if (value) return value;
  }
  return '';
}

function detectHeading(line: string): { key: SectionKey; rest: string } | null {
  const trimmed = line
    .trim()
    .replace(/^[\s>*#_`-]+/, '')
    .replace(/[*_`#]+$/, '')
    .trim();
  if (!trimmed || trimmed.startsWith('```')) return null;

  const colon = trimmed.indexOf(':');
  const label = colon >= 0 ? trimmed.slice(0, colon) : trimmed;
  if (label.length > 48) return null;
  const key = HEADING_ALIASES[normalizeLabel(label)];
  if (!key) return null;
  return { key, rest: colon >= 0 ? trimmed.slice(colon + 1).trim() : '' };
}

function firstLine(lines: string[]): string {
  for (const raw of lines) {
    const line = cleanLine(raw).replace(/^["'“”«»]+|["'“”«»]+$/g, '').trim();
    if (line) return line;
  }
  return '';
}

function parseHero(lines: string[]): LandingPageContent['hero'] {
  const map = readKeyValues(lines);
  const headline = pick(map, ['headline', 'title', 'عنوان', 'العنوان الرئيسي', 'titre']);
  const subheadline = pick(map, [
    'subheadline',
    'sub title',
    'subtitle',
    'الوصف',
    'العنوان الفرعي',
    'sous titre',
  ]);
  const cta = pick(map, [
    'primary cta',
    'cta',
    'button',
    'call to action',
    'زر الشراء',
    'دعوة الشراء',
    'bouton',
  ]);
  const trust = pick(map, ['trust line', 'trust', 'سطر الثقة', 'الثقة']);

  if (headline) return { headline, subheadline, cta, trust };

  const fallback = toBullets(lines);
  return {
    headline: fallback[0] || '',
    subheadline: fallback[1] || '',
    cta: fallback[2] || '',
    trust: fallback[3] || '',
  };
}

function parseFinalCta(lines: string[]): LandingPageContent['finalCta'] {
  const map = readKeyValues(lines);
  return {
    headline: pick(map, ['headline', 'title', 'عنوان', 'العنوان']),
    line: pick(map, ['line', 'text', 'description', 'الوصف', 'السطر', 'ligne']),
    button: pick(map, ['button', 'cta', 'primary cta', 'زر', 'زر الشراء', 'bouton']),
  };
}

function parseFaq(lines: string[]): Array<{ question: string; answer: string }> {
  const items: Array<{ question: string; answer: string }> = [];
  let question = '';
  let answer: string[] = [];

  const flush = () => {
    const q = display(question);
    const a = display(answer.map(cleanLine).filter(Boolean).join(' '));
    if (q) items.push({ question: q, answer: a });
    question = '';
    answer = [];
  };

  for (const raw of lines) {
    const line = cleanLine(raw);
    if (!line) {
      if (answer.length > 0) answer.push('');
      continue;
    }
    const q = line.match(/^(?:Q\d*|س\d*|سؤال)\s*[:.)-]\s*(.+)$/i);
    const a = line.match(/^(?:A\d*|R\d*|ج\d*|جواب|إجابة)\s*[:.)-]\s*(.+)$/i);
    if (q) {
      flush();
      question = q[1].trim();
      continue;
    }
    if (a) {
      answer.push(a[1]);
      continue;
    }
    if (question) answer.push(line);
  }
  flush();
  return items.filter((item) => item.question && item.answer);
}

function parseOffer(lines: string[]): LandingPageContent['offer'] {
  const map = readKeyValues(lines);
  let price = pick(map, ['price', 'سعر', 'السعر', 'prix']);
  const bullets = toBullets(lines).filter(
    (line) => !/^(?:price|سعر|السعر|prix)\s*:/i.test(line),
  );

  if (!price) {
    const priceLine = lines
      .map(cleanLine)
      .find((line) => /\d/.test(line) && /(?:دج|da\b|dzd|€|\$|£|درهم|ريال)/i.test(line));
    if (priceLine) {
      price = display(priceLine);
      const index = bullets.indexOf(priceLine);
      if (index >= 0) bullets.splice(index, 1);
    }
  }

  return { price, lines: bullets };
}

/**
 * Parses the labelled AI answer. It is deliberately tolerant of Markdown
 * decorations and of the common heading translations, because models
 * occasionally format a section differently from the requested plain text.
 */
export function parseLandingPage(text: string): LandingPageContent | null {
  const buckets: Record<SectionKey, string[]> = {
    seoTitle: [],
    meta: [],
    hero: [],
    problem: [],
    solution: [],
    benefits: [],
    audience: [],
    included: [],
    steps: [],
    offer: [],
    guarantee: [],
    social: [],
    faq: [],
    final: [],
    micro: [],
  };

  let current: SectionKey | null = null;
  for (const line of text.replace(/\r\n?/g, '\n').split('\n')) {
    const hit = detectHeading(line);
    if (hit) {
      current = hit.key;
      if (hit.rest) buckets[current].push(hit.rest);
      continue;
    }
    if (current) buckets[current].push(line);
  }

  const content: LandingPageContent = {
    seoTitle: firstLine(buckets.seoTitle),
    metaDescription: firstLine(buckets.meta),
    hero: parseHero(buckets.hero),
    problem: toParagraphs(buckets.problem),
    solution: toParagraphs(buckets.solution),
    benefits: toBullets(buckets.benefits),
    audience: toBullets(buckets.audience),
    included: toBullets(buckets.included),
    steps: toBullets(buckets.steps),
    offer: parseOffer(buckets.offer),
    guarantee: toParagraphs(buckets.guarantee),
    socialProof: toParagraphs(buckets.social),
    faq: parseFaq(buckets.faq),
    finalCta: parseFinalCta(buckets.final),
    microcopy: toBullets(buckets.micro),
  };

  const filledSections = [
    content.problem.length,
    content.solution.length,
    content.benefits.length,
    content.audience.length,
    content.included.length,
    content.steps.length,
    content.guarantee.length,
    content.faq.length,
  ].filter((count) => count > 0).length;

  if (!content.hero.headline && filledSections < 3) return null;
  return content;
}

function escapeHtml(value: string): string {
  const escapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return value.replace(/[&<>"']/g, (character) => escapes[character] || character);
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

function splitBenefit(value: string): { title: string; body: string } {
  const dash = value.match(/^(.{3,90}?)\s+[—–]\s+(.+)$/);
  if (dash) return { title: dash[1].trim(), body: dash[2].trim() };
  const colon = value.match(/^(.{3,70}?):\s+(.+)$/);
  if (colon) return { title: colon[1].trim(), body: colon[2].trim() };
  return { title: value, body: '' };
}

function actionHref(
  contact: string,
  fallback: string,
): { href: string; external: boolean } {
  const email = contact.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  if (email) return { href: `mailto:${email}`, external: false };

  let digits = (contact.match(/\+?[\d\s().-]{8,}/)?.[0] || '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = `213${digits.slice(1)}`;
  if (/^[567]\d{8}$/.test(digits)) digits = `213${digits}`;

  if (digits.length >= 9 && digits.length <= 15) {
    return { href: `https://wa.me/${digits}`, external: true };
  }
  return { href: fallback, external: false };
}

function linkAttributes(external: boolean): string {
  return external ? ' target="_blank" rel="noopener noreferrer"' : '';
}

const BASE_CSS = `
:root{
  --ink:#14201d;--muted:#5d6b66;--paper:#fbf7ef;--card:#fff;
  --brand:#0f766e;--brand-2:#115e59;--accent:#f59e0b;--line:#e8e0d2;
  --shadow:0 24px 60px rgba(20,32,29,.12);--radius:22px;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--font-body);line-height:1.7;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
img{max-width:100%;display:block}
.container{width:min(1120px,calc(100% - 40px));margin-inline:auto}
.site-header{position:sticky;top:0;z-index:20;background:var(--header-bg);backdrop-filter:blur(14px);border-bottom:1px solid var(--header-line)}
.header-inner{display:flex;align-items:center;gap:24px;min-height:72px}
.brand{display:flex;align-items:center;gap:10px;font-weight:800;letter-spacing:-.02em;min-width:0}
.brand-mark{display:grid;place-items:center;width:38px;height:38px;border-radius:12px;background:var(--brand);color:#fff;font-size:14px;flex:0 0 auto}
.brand-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:280px}
.nav{display:flex;gap:22px;margin-inline-start:auto;font-size:14px;color:var(--muted)}
.nav a:hover{color:var(--brand)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:1px solid transparent;border-radius:var(--btn-radius);background:var(--brand);color:#fff;font-weight:800;padding:12px 20px;transition:transform .15s ease,background .15s ease;white-space:nowrap}
.btn:hover{background:var(--brand-2);transform:translateY(-1px)}
.btn-small{padding:10px 16px;font-size:13px}
.btn-lg{padding:16px 26px;font-size:16px}
.btn-ghost{background:transparent;color:var(--brand);border-color:var(--line)}
.btn-ghost:hover{background:var(--brand-soft)}
.btn-light{background:#fff;color:var(--brand)}
.btn-light:hover{background:#f3faf8}
.hero{padding:72px 0 64px;background:radial-gradient(circle at 12% 18%,var(--glow-1),transparent 38%),radial-gradient(circle at 88% 8%,var(--glow-2),transparent 34%),var(--hero-bg);overflow:hidden;position:relative}
.hero-grid{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(0,.92fr);gap:56px;align-items:center}
.eyebrow{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(15,118,110,.22);background:rgba(255,255,255,.65);color:var(--brand-2);border-radius:999px;padding:7px 14px;font-size:12px;font-weight:800;letter-spacing:.04em}
.hero h1{font-family:var(--font-head);font-size:clamp(2.25rem,5.2vw,4.15rem);line-height:1.08;letter-spacing:-.035em;margin:20px 0 18px;max-width:14ch}
.lead{font-size:clamp(1.02rem,1.7vw,1.22rem);color:var(--muted);max-width:56ch;margin:0 0 26px}
.hero-actions{display:flex;flex-wrap:wrap;gap:12px;align-items:center}
.trust{margin:18px 0 0;font-size:14px;color:var(--muted);display:flex;gap:8px;align-items:center}
.trust::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--accent);flex:0 0 auto}
.hero-media{position:relative}
.media-frame{position:relative;z-index:2;border-radius:32px;background:var(--frame-bg);box-shadow:var(--frame-shadow);padding:12px;border:1px solid var(--frame-border);transform:var(--frame-transform)}
.media-frame img{width:100%;aspect-ratio:1/1;object-fit:contain;background:#fff;border-radius:22px;transform:translateZ(24px);filter:var(--photo-shadow)}
.media-placeholder{display:grid;place-items:center;aspect-ratio:1/1;border-radius:22px;background:radial-gradient(circle at 35% 30%,#fff,#ccebe4 60%,#f2d49a);color:var(--brand-2);font-size:clamp(3rem,8vw,5rem);font-weight:900}
.trust-strip{background:var(--card);border-block:1px solid var(--line)}
.trust-strip-inner{display:flex;flex-wrap:wrap;gap:10px 30px;padding:16px 0;font-size:.85rem;font-weight:700;color:var(--muted)}
.trust-strip-inner span{display:inline-flex;align-items:center;gap:8px}
.trust-strip-inner span::before{content:"✓";display:grid;place-items:center;width:18px;height:18px;border-radius:50%;background:var(--brand-soft);color:var(--brand);font-size:11px;flex:0 0 auto}
.price-chip{position:absolute;inset-inline-end:26px;bottom:26px;background:#fff;border-radius:16px;padding:10px 14px;box-shadow:0 12px 30px rgba(20,32,29,.18);display:flex;flex-direction:column;gap:2px;min-width:120px}
.price-chip span{font-size:11px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.08em}
.price-chip strong{font-size:20px;color:var(--brand-2)}
.media-trust{margin:16px 8px 0;font-size:13px;color:var(--muted);text-align:center}
.section{padding:64px 0}
.section h2{font-family:var(--font-head);font-size:clamp(1.65rem,3vw,2.45rem);line-height:1.2;letter-spacing:-.025em;margin:0 0 18px}
.section p{margin:0 0 14px;color:var(--muted)}
.two-col{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px}
.panel{background:var(--card);border:1px solid var(--line);border-radius:var(--card-radius);padding:28px}
.kicker{display:inline-grid;place-items:center;width:38px;height:38px;border-radius:12px;background:var(--brand-soft);color:var(--brand);font-size:12px;font-weight:900;margin-bottom:16px}
.panel p:last-child{margin-bottom:0}
.benefit-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px}
.benefit{background:var(--card);border:1px solid var(--line);border-radius:var(--card-radius);padding:24px;position:relative;overflow:hidden}
.benefit::after{content:"";position:absolute;inset-inline-end:-30px;top:-30px;width:90px;height:90px;border-radius:50%;background:var(--accent-soft)}
.benefit-num{font-size:12px;font-weight:900;color:var(--accent);letter-spacing:.12em}
.benefit h3{font-family:var(--font-head);font-size:1.05rem;margin:10px 0 6px;line-height:1.35}
.benefit p{font-size:.92rem;margin:0;color:var(--muted)}
.chips{display:flex;flex-wrap:wrap;gap:10px}
.chip{background:#fff;border:1px solid var(--line);border-radius:999px;padding:9px 15px;font-size:.92rem;font-weight:700}
.split{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:32px;align-items:start}
.checklist{list-style:none;padding:0;margin:0;display:grid;gap:11px}
.checklist li{display:flex;gap:10px;align-items:flex-start;color:var(--muted)}
.checklist li::before{content:"✓";display:grid;place-items:center;width:20px;height:20px;border-radius:50%;background:var(--brand-soft);color:var(--brand);font-size:12px;font-weight:900;flex:0 0 auto;margin-top:2px}
.steps{list-style:none;padding:0;margin:0;display:grid;gap:16px}
.steps li{display:flex;gap:14px;align-items:flex-start}
.steps li span{display:grid;place-items:center;width:32px;height:32px;border-radius:10px;background:var(--brand);color:#fff;font-size:13px;font-weight:900;flex:0 0 auto}
.steps li p{margin:2px 0 0;color:var(--muted)}
.offer-section{padding-top:24px}
.offer-card{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(280px,.85fr);gap:32px;background:var(--offer-bg);color:var(--offer-text);border-radius:30px;padding:clamp(26px,5vw,48px);box-shadow:var(--shadow)}
.offer-card h2{color:var(--offer-text);margin-top:12px}
.offer-card .eyebrow{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.22);color:var(--offer-text)}
.offer-card .checklist li{color:var(--offer-muted)}
.offer-card .checklist li::before{background:rgba(255,255,255,.16);color:#fff}
.offer-box{background:#fff;color:var(--ink);border-radius:22px;padding:26px;display:flex;flex-direction:column;gap:10px;justify-content:center;text-align:center}
.offer-label{font-size:12px;font-weight:900;color:var(--muted);text-transform:uppercase;letter-spacing:.1em}
.offer-price{font-size:clamp(1.8rem,4vw,2.6rem);line-height:1.1;color:var(--brand-2)}
.offer-box small{color:var(--muted);font-size:12px;line-height:1.5}
.guarantee-card{display:flex;gap:18px;align-items:flex-start;background:var(--card);border:1px solid var(--line);border-radius:var(--card-radius);padding:26px}
.guarantee-icon{display:grid;place-items:center;width:46px;height:46px;border-radius:14px;background:var(--accent-soft);color:var(--accent);font-size:22px;font-weight:900;flex:0 0 auto}
.guarantee-card h2{font-family:var(--font-head);font-size:1.4rem;margin:0 0 8px}
.guarantee-card p:last-child{margin-bottom:0}
.quote-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px}
.quote{background:var(--card);border:1px solid var(--line);border-radius:var(--card-radius);padding:22px;color:var(--muted);font-size:.95rem}
.quote::before{content:"“";display:block;font-size:2.4rem;line-height:.8;color:var(--accent);margin-bottom:8px}
.narrow{max-width:820px}
.faq-list{display:grid;gap:10px}
details{background:var(--card);border:1px solid var(--line);border-radius:var(--card-radius);padding:16px 18px}
summary{cursor:pointer;font-weight:800;display:flex;align-items:center;justify-content:space-between;gap:16px;list-style:none}
summary::-webkit-details-marker{display:none}
summary span{display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:var(--brand-soft);color:var(--brand);font-size:18px;line-height:1;flex:0 0 auto;transition:transform .15s ease}
details[open] summary span{transform:rotate(45deg)}
details p{margin:12px 0 0;color:var(--muted);font-size:.95rem}
.final-cta{background:var(--final-bg);color:var(--final-text);padding:70px 0;text-align:center;position:relative;overflow:hidden}
.final-cta h2{font-family:var(--font-head);color:var(--final-text);font-size:clamp(1.8rem,4vw,3rem);max-width:20ch;margin:0 auto 14px}
.final-cta p{color:var(--final-muted);max-width:58ch;margin:0 auto 24px}
.final-cta .micro{margin:18px auto 0;font-size:12px;color:var(--final-micro)}
.raw-text{white-space:pre-wrap;background:var(--card);border:1px solid var(--line);border-radius:var(--card-radius);padding:24px;color:var(--muted);font-size:.95rem}
.site-footer{border-top:1px solid var(--line);padding:24px 0;background:var(--paper)}
.footer-inner{display:flex;flex-wrap:wrap;gap:8px 24px;justify-content:space-between;color:var(--muted);font-size:12px}
.footer-inner p{margin:0}
@media(max-width:900px){
  .nav{display:none}
  .hero-grid{grid-template-columns:1fr;gap:38px}
  .hero{padding:48px 0}
  .hero h1{max-width:18ch}
  .media-frame{transform:none;max-width:560px;margin-inline:auto}
  .offer-card{grid-template-columns:1fr}
}
@media(max-width:600px){
  .container{width:min(100% - 28px,1120px)}
  .header-inner{min-height:64px;gap:12px}
  .brand-name{max-width:170px;font-size:14px}
  .section{padding:46px 0}
  .hero-actions .btn{width:100%}
  .price-chip{inset-inline-end:18px;bottom:18px}
  .footer-inner{flex-direction:column}
}
`;

function paragraphHtml(lines: string[]): string {
  return lines.map((line) => `<p>${escapeHtml(line)}</p>`).join('');
}

function listHtml(lines: string[], className: string): string {
  return `<ul class="${className}">${lines.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ul>`;
}

/**
 * Builds a complete, self-contained HTML landing page. All AI/user text is
 * escaped, the image must be a local data URL, and the page contains no
 * scripts, so it can be previewed safely inside a sandboxed iframe.
 */
export function buildLandingPageHtml(
  content: LandingPageContent,
  options: LandingPageOptions,
): string {
  const language = options.language;
  const l = LABELS[language];
  const dir = language === 'ar' ? 'rtl' : 'ltr';
  const locale = language === 'ar' ? 'ar_DZ' : language === 'fr' ? 'fr_DZ' : 'en_DZ';

  const productName = display(options.productName || content.hero.headline || l.productFallback);
  const theme = resolveLandingTheme(options.theme, `${productName}|${content.hero.headline || ''}`);
  const heroHeadline = display(content.hero.headline) || productName;
  const heroSubheadline = isPublic(content.hero.subheadline) ? display(content.hero.subheadline) : '';
  const heroTrust = isPublic(content.hero.trust) ? display(content.hero.trust) : '';
  const ctaLabel = isPublic(content.hero.cta) ? display(content.hero.cta) : l.order;
  const price = display(options.price || content.offer.price);
  const image = options.image && IMAGE_DATA_URL.test(options.image) ? options.image : '';
  const initials = Array.from(productName.replace(/\s+/g, '')).slice(0, 2).join('') || '•';
  const action = actionHref(display(options.contact || ''), '#offer');

  const benefits = content.benefits.filter(isPublic);
  const audience = content.audience.filter(isPublic);
  const included = content.included.filter(isPublic);
  const steps = content.steps.filter(isPublic);
  const guarantee = content.guarantee.filter(isPublic);
  const social = content.socialProof.filter(isPublic);
  const faq = content.faq.filter((item) => isPublic(item.question) && isPublic(item.answer));
  const microcopy = content.microcopy.filter(isPublic);
  const offerLines = content.offer.lines.filter(isPublic);

  const seoTitle = truncate(
    display(content.seoTitle) && isPublic(content.seoTitle) ? display(content.seoTitle) : productName,
    60,
  );
  const metaDescription = truncate(
    isPublic(content.metaDescription) && display(content.metaDescription)
      ? display(content.metaDescription)
      : heroSubheadline || l.defaultMicro,
    155,
  );

  const navItems = [
    benefits.length > 0 ? `<a href="#benefits">${escapeHtml(l.navBenefits)}</a>` : '',
    steps.length > 0 ? `<a href="#how">${escapeHtml(l.navHow)}</a>` : '',
    faq.length > 0 ? `<a href="#faq">${escapeHtml(l.navFaq)}</a>` : '',
  ]
    .filter(Boolean)
    .join('');

  const problemHtml =
    content.problem.length > 0
      ? `<article class="panel">
          <span class="kicker">01</span>
          <h2>${escapeHtml(l.problem)}</h2>
          ${paragraphHtml(content.problem)}
        </article>`
      : '';
  const solutionHtml =
    content.solution.length > 0
      ? `<article class="panel">
          <span class="kicker">02</span>
          <h2>${escapeHtml(l.solution)}</h2>
          ${paragraphHtml(content.solution)}
        </article>`
      : '';
  const problemSolutionHtml =
    problemHtml || solutionHtml
      ? `<section class="section reveal">
          <div class="container two-col">${problemHtml}${solutionHtml}</div>
        </section>`
      : '';

  const benefitsHtml =
    benefits.length > 0
      ? `<section class="section reveal" id="benefits">
          <div class="container">
            <h2>${escapeHtml(l.benefits)}</h2>
            <div class="benefit-grid">
              ${benefits
                .map((benefit, index) => {
                  const parts = splitBenefit(benefit);
                  return `<article class="benefit">
                    <span class="benefit-num">${String(index + 1).padStart(2, '0')}</span>
                    <h3>${escapeHtml(parts.title)}</h3>
                    ${parts.body ? `<p>${escapeHtml(parts.body)}</p>` : ''}
                  </article>`;
                })
                .join('')}
            </div>
          </div>
        </section>`
      : '';

  const audienceHtml =
    audience.length > 0
      ? `<section class="section" style="padding-top:0">
          <div class="container">
            <h2>${escapeHtml(l.audience)}</h2>
            <div class="chips">${audience.map((item) => `<span class="chip">${escapeHtml(item)}</span>`).join('')}</div>
          </div>
        </section>`
      : '';

  const includedHtml =
    included.length > 0
      ? `<div>
          <h2>${escapeHtml(l.included)}</h2>
          ${listHtml(included, 'checklist')}
        </div>`
      : '';
  const stepsHtml =
    steps.length > 0
      ? `<div id="how">
          <h2>${escapeHtml(l.how)}</h2>
          <ol class="steps">
            ${steps
              .map(
                (step, index) =>
                  `<li><span>${index + 1}</span><p>${escapeHtml(step)}</p></li>`,
              )
              .join('')}
          </ol>
        </div>`
      : '';
  const includedStepsHtml =
    includedHtml || stepsHtml
      ? `<section class="section reveal" style="padding-top:0">
          <div class="container split">${includedHtml}${stepsHtml}</div>
        </section>`
      : '';

  const offerHtml = `<section class="section offer-section reveal" id="offer">
    <div class="container offer-card">
      <div>
        <span class="eyebrow">${escapeHtml(l.offer)}</span>
        <h2>${escapeHtml(heroHeadline)}</h2>
        ${offerLines.length > 0 ? listHtml(offerLines, 'checklist') : ''}
      </div>
      <div class="offer-box">
        ${price ? `<span class="offer-label">${escapeHtml(l.price)}</span><strong class="offer-price" dir="auto">${escapeHtml(price)}</strong>` : ''}
        <a class="btn btn-lg" href="${action.href}"${linkAttributes(action.external)}>${escapeHtml(ctaLabel)}</a>
        ${heroTrust ? `<small>${escapeHtml(heroTrust)}</small>` : ''}
      </div>
    </div>
  </section>`;

  const guaranteeHtml =
    guarantee.length > 0
      ? `<section class="section reveal" style="padding-top:0">
          <div class="container guarantee-card">
            <span class="guarantee-icon" aria-hidden="true">✓</span>
            <div>
              <h2>${escapeHtml(l.guarantee)}</h2>
              ${paragraphHtml(guarantee)}
            </div>
          </div>
        </section>`
      : '';

  const socialHtml =
    social.length > 0
      ? `<section class="section reveal" style="padding-top:0">
          <div class="container">
            <h2>${escapeHtml(l.social)}</h2>
            <div class="quote-grid">
              ${social.map((quote) => `<blockquote class="quote">${escapeHtml(quote)}</blockquote>`).join('')}
            </div>
          </div>
        </section>`
      : '';

  const faqHtml =
    faq.length > 0
      ? `<section class="section reveal" id="faq">
          <div class="container narrow">
            <h2>${escapeHtml(l.faq)}</h2>
            <div class="faq-list">
              ${faq
                .map(
                  (item) =>
                    `<details><summary>${escapeHtml(item.question)}<span aria-hidden="true">+</span></summary><p>${escapeHtml(item.answer)}</p></details>`,
                )
                .join('')}
            </div>
          </div>
        </section>`
      : '';

  const finalHeadline = isPublic(content.finalCta.headline)
    ? display(content.finalCta.headline)
    : heroHeadline;
  const finalLine = isPublic(content.finalCta.line)
    ? display(content.finalCta.line)
    : heroSubheadline;
  const finalButton = isPublic(content.finalCta.button)
    ? display(content.finalCta.button)
    : ctaLabel;
  const micro = microcopy.length > 0 ? microcopy : [l.defaultMicro];

  const trustStripHtml =
    microcopy.length > 0
      ? `<section class="trust-strip" aria-label="${escapeHtml(productName)}">
          <div class="container trust-strip-inner">
            ${microcopy.map((item) => `<span>${escapeHtml(item)}</span>`).join('')}
          </div>
        </section>`
      : '';

  const finalHtml = `<section class="final-cta reveal">
    <div class="container">
      <h2>${escapeHtml(finalHeadline)}</h2>
      ${finalLine ? `<p>${escapeHtml(finalLine)}</p>` : ''}
      <a class="btn btn-lg btn-light" href="${action.href}"${linkAttributes(action.external)}>${escapeHtml(finalButton)}</a>
      <p class="micro">${micro.map(escapeHtml).join(' • ')}</p>
    </div>
  </section>`;

  const rawHtml = content.rawText
    ? `<section class="section">
        <div class="container narrow">
          <h2>${escapeHtml(l.details)}</h2>
          <div class="raw-text">${escapeHtml(content.rawText)}</div>
        </div>
      </section>`
    : '';

  const year = new Date().getFullYear();
  const sceneScript = buildLandingSceneScript(theme, image, productName, language);

  return `<!DOCTYPE html>
<html lang="${language}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(seoTitle)}</title>
<meta name="description" content="${escapeHtml(metaDescription)}">
<meta name="theme-color" content="${LANDING_THEME_COLOR[theme]}">
<meta property="og:type" content="product">
<meta property="og:title" content="${escapeHtml(seoTitle)}">
<meta property="og:description" content="${escapeHtml(metaDescription)}">
<meta property="og:locale" content="${locale}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Inter:wght@400;600;700;800&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
<style>${BASE_CSS}\n${LANDING_THEME_CSS}</style>
</head>
<body data-theme="${theme}" data-template="${theme}">
<header class="site-header">
  <div class="container header-inner">
    <a class="brand" href="#top" aria-label="${escapeHtml(productName)}">
      <span class="brand-mark" aria-hidden="true">${escapeHtml(initials)}</span>
      <span class="brand-name">${escapeHtml(productName)}</span>
    </a>
    ${navItems ? `<nav class="nav" aria-label="${escapeHtml(l.navLabel)}">${navItems}</nav>` : ''}
    <a class="btn btn-small" href="${action.href}"${linkAttributes(action.external)}>${escapeHtml(ctaLabel)}</a>
  </div>
</header>
<main id="top">
  <section class="hero">
    <div class="scene" id="aos-scene" aria-hidden="true"><div class="scene-canvas" id="aos-canvas"></div></div>
    <div class="container hero-grid">
      <div>
        <span class="eyebrow">${escapeHtml(productName)}</span>
        <h1 dir="auto">${escapeHtml(heroHeadline)}</h1>
        ${heroSubheadline ? `<p class="lead" dir="auto">${escapeHtml(heroSubheadline)}</p>` : ''}
        <div class="hero-actions">
          <a class="btn btn-lg" href="${action.href}"${linkAttributes(action.external)}>${escapeHtml(ctaLabel)}</a>
          <a class="btn btn-lg btn-ghost" href="#offer">${escapeHtml(l.seeOffer)}</a>
        </div>
        ${heroTrust ? `<p class="trust">${escapeHtml(heroTrust)}</p>` : ''}
      </div>
      <div class="hero-media">
        <div class="media-frame">
          ${
            image
              ? `<img src="${image}" alt="${escapeHtml(productName)}" loading="eager">`
              : `<div class="media-placeholder" aria-hidden="true"><span>${escapeHtml(initials)}</span></div>`
          }
          ${
            price
              ? `<div class="price-chip" dir="auto"><span>${escapeHtml(l.price)}</span><strong>${escapeHtml(price)}</strong></div>`
              : ''
          }
        </div>
      </div>
    </div>
  </section>
  ${trustStripHtml}
  ${problemSolutionHtml}
  ${benefitsHtml}
  ${audienceHtml}
  ${includedStepsHtml}
  ${offerHtml}
  ${guaranteeHtml}
  ${socialHtml}
  ${faqHtml}
  ${rawHtml}
  ${finalHtml}
</main>
<footer class="site-footer">
  <div class="container footer-inner">
    <p>© ${year} ${escapeHtml(productName)}</p>
    <p>${escapeHtml(l.footerNote)}</p>
  </div>
</footer>
<script src="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js"><\/script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"><\/script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"><\/script>
${sceneScript}
</body>
</html>`;
}

/** Fallback when the provider ignored the section headings: still a full page. */
export function buildFallbackLandingHtml(
  rawText: string,
  options: LandingPageOptions,
): string {
  const productName = display(options.productName || '');
  const content: LandingPageContent = {
    seoTitle: productName,
    metaDescription: '',
    hero: {
      headline: productName || LABELS[options.language].productFallback,
      subheadline: '',
      cta: '',
      trust: '',
    },
    problem: [],
    solution: [],
    benefits: [],
    audience: [],
    included: [],
    steps: [],
    offer: { price: display(options.price || ''), lines: [] },
    guarantee: [],
    socialProof: [],
    faq: [],
    finalCta: { headline: '', line: '', button: '' },
    microcopy: [],
    rawText,
  };
  return buildLandingPageHtml(content, options);
}
