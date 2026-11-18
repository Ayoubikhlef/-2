# TASKS

## Completed ✅
- [x] Memory system initialized (PROJECT_MEMORY.md, MEMORY.md, CLAUDE.md)
- [x] Core configuration files inspected:
  - package.json - Dependencies and scripts
  - vite.config.ts - Vite/Radix build config
  - tsconfig.json - TypeScript settings with Sentry exclusions
  - server/src/index.ts - Express server stack with security middleware
  - server/prisma/schema.prisma - Database models (verified earlier)
- [x] API routes structure documented (18 route files mapped)
- [x] Security documentation reviewed:
  - .sentry-docs.md - Sentry integration notes
  - SENTRY_SETUP.md - Complete Sentry setup guide
- [x] PROJECT_MEMORY.md updated with comprehensive project documentation
- [x] README.md reviewed - Project name, description, and tech stack confirmed
- [x] Environment variables documented (.env.example)

## In Progress 🔄
- (None — production verification is complete.)

## Pending ⏳
- Review render.yaml / vercel.json deployment configurations (if exist)
- Read SECURITY_AUDIT_REPORT.md if present in project
- Verify sentry.config.ts configuration
- Inspect any additional documentation files in root directory
- Optional: per-route meta description for `/premium-services`; switch `AI_MODEL` to Sonnet if desired

## Completed This Session
- ✅ Project structure fully mapped and documented
- ✅ Technology stack verified:
  - Frontend: Vite 6, React 18.3, TypeScript 5.6, Tailwind CSS 4.1
  - Backend: Express.js, Prisma ORM, PostgreSQL (SQLite in README mentions)
  - AI: RAG pipeline with Transformers.js, Socket.io real-time chat
  - UI: Radix UI primitives, shadcn/ui components, lucide-react icons
- ✅ API routes fully documented with rate limiting and security notes
- ✅ Security features cataloged (Helmet, CORS, rate limiting, HPP, mojibake fixer)
- ✅ Render deployment optimization strategies identified (keep-alive, sleep mode workaround)
- ✅ Memory system populated with verified project information

## Session Summary
Project inspection complete. All major configuration files and API routes have been inspected and documented in PROJECT_MEMORY.md. The AyoubWorkTechStore is an IT equipment e-commerce platform with AI-powered website factory builder, deployed on Render/Vercel with Sentry error monitoring.

## Session 2026-11-17/18 — AI providers + Premium Services
- ✅ Checkout payment method selection (COD/CIB/DZAPI/PayPal) + percentage fix — `683f260`
- ✅ AI Studio works with no key via free provider — `2fd82cc`
- ✅ Gemini key created and added to Render; `/api/ai/status` → `available:true, keyless:false`
- ✅ Slow/failed Gemini falls back automatically — `9a6718c`; 8 s "still working" hint — `a7a1c2f`
- ✅ OpenRouter/Claude provider + fallback chain — `232868f`; `OPENROUTER_API_KEY` added to Render env and deploy triggered
- ✅ Real OpenRouter call tested directly: 200 in 3.2 s, `anthropic/claude-haiku-5.5`, cost $0.0001843
- ✅ `/premium-services` rebuilt as a real Vite route, margins hidden, 15 services, pricing tiers, `/#booking` CTA — `3b4b588`
- ✅ Old Next.js page deleted (it never rendered on Vite) — `48035e1`
- ✅ Vercel rewrites + `no-store` headers for `/premium-services` and `/Premium-services`; sitemap now has 11 URLs
- ✅ `npm run typecheck` and `npm run build` pass; local QA confirmed h1, 15 cards, 4 sections, RTL, prices, expandable tiers, no margin leak
- ✅ Production `/premium-services` verified: 200, 15 cards, 4 sections, RTL, ar/fr/en, no console errors, no mobile overflow
- ✅ Footer quick link + AI banner link to the page (it was previously unreachable from the site) — `ac643c9`
- ✅ Language switch refreshes `document.title` without a reload; `#premium-list` anchor scrolls and no longer looks like a 404 — `6e5df6d`, `bcee2f5`
- ✅ OpenRouter usage on production generation rose `0.0001843 → 0.0004173` USD (3.6 s), proving Render uses Claude
- ✅ Temporary Render API key `aos-openrouter-setup` revoked (401 confirmed) and local copy deleted
- ✅ Phone shown left-to-right in Arabic (header/footer/contact/FAQ/about/announcement) — `0bd08f1`
- ✅ Premium Services link added to the desktop header next to Contact/order tracking and to the mobile menu; header widened at 2xl
- ✅ Removed the hero badge «خدمات مكتبية وإعلام آلي» per user request — `3ad3520`; production verified
- ✅ Announcement bar: free delivery over 8000 DZD and delivery in 69 wilayas; aligned badges, testimonials, SEO and delivery defaults — `af655b9`; production verified
- ⚠️ OpenRouter is on a $5 lifetime limit; monitor usage before moving heavy traffic to it

## Session 2026-11-18 - 12 seller AI tools (`/ai-tools`)
- ? `AI_TOOLS` expanded 3 -> 15 with per-tool field whitelists and prompts; image input for `ad-image-review` (`image_url`), prompt cap 5000 chars
- ? Route `POST /api/ai/generate`: `z.enum(AI_TOOLS)`, field max 1200, max 12 fields, optional `image` <= 1 000 000 chars
- ? `/ai-tools` page: 12 tools in 3 stages, one free trial per tool (`aos_ai_tools_trials_v1`), saved result, copy + download, ad-image compression
- ? Entry points: desktop header (xl), mobile menu, footer, AI services banner; Vercel rewrites + sitemap (12 URLs) - `d6e44f2`
- ? Bug fixed: CSP blocked `blob:` image URLs, the upload silently failed. Now `FileReader` + `data:` download link - `68362be`
- ? Bug fixed: FR/EN header overflowed at 1024-1440 px. Desktop nav/actions moved to `xl`, digital link + phone number text to `2xl` - `c09dbb0`
- ? Contrast: dark-mode `text-primary` labels 2.5:1 -> `text-sky-700 dark:text-sky-300`; Lighthouse a11y 0.96, best-practices 1.0, SEO 1.0 - `f8abdc0`
- ? Production verified: 12 cards, 3 sections, RTL, ar/fr/en, real Claude answers for 4 tools, vision review works, validation errors correct, no console errors, no horizontal overflow, trial persists after reload, sitemap + header/footer/banner links live
- ?? `aiLimiter` = 12 requests / 10 min / IP (exactly the number of tools); consider raising to ~20 for retries
- ?? OpenRouter is on a $5 lifetime limit; monitor usage before heavy traffic

Next session should focus on:
- A prerender step so `/ai-tools` and `/premium-services` expose their per-page title/meta to crawlers
- Raising `aiLimiter` to ~20 requests / 10 min if users report a blocked retry
- Watching OpenRouter usage against the $5 lifetime limit
- The payment decision is still open (Chargily needs a commercial RIB; manual CCP/BaridiMob is the fallback)

