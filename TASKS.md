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

## Session 2026-11-18 - profit calculators (`/ai-tools/calculator`)
- ? `/ai-tools/calculator` added as a Vite route (rewrites for the CamelCase path and `/calculators`, `no-store`, sitemap, footer link, banner on `/ai-tools`) - `3f28f85`
- ? Five client-side calculators: product profit, pricing, order cost, ad ceiling, monthly goal. Reference inputs return 2,303 DZD net per delivered order, 47 % margin, 659 DZD ad per delivered order
- ? Save results requires sign-in (`aos_calc_saved_v1_<userId>`, max 20, restore + delete); signed-out visitors get "sign up free / I have an account" which opens `LoginPage`
- ? Verified locally: typecheck + build pass, five tabs compute, live update on edit, login overlay opens, FR/EN no overflow, `/ai-tools` keeps its 12 cards
- ?? Saved results are per-browser only until the account area gets a server API

## Session 2026-11-18 - AI subscriptions and paywall
- ✅ Prisma models `Subscription`, `SubscriptionPayment`, `AiUsage`, `SavedCalculation` (+ `User` relations); Render `prisma db push` handles them at boot
- ✅ `services/subscription.ts`: plans 1 900 / 4 900 / 17 900 DZD, activation + extension, guest 1/tool/IP/30 days, account 1 preview total, Chargily v2 checkout, HMAC-SHA256 webhook, manual CCP/BaridiMob instructions
- ✅ `routes/subscription.ts` + `routes/calculator.ts` + `optionalAuth` + `rawBody`; `aiLimiter` 30 / 10 min, `checkoutLimiter` 20 / 15 min
- ✅ `/subscription` page (plans, Chargily / CCP / BaridiMob, receipt upload, account + history, retry state), Vercel rewrites + no-store, sitemap, footer link
- ✅ `/ai-tools` paywall: guest -> `LoginPage`, account -> `/subscription`, last-preview CTA, `/subscription/me` entitlement badge
- ✅ Calculator results moved to the server (max 20) with one-time localStorage migration and offline fallback
- ✅ Admin "AI Subscriptions" tab: pending/paid payments, receipts, activate/reject, grant by email, cancel
- ✅ `CHARGILY_SECRET_KEY`, `CHARGILY_MODE`, `CHARGILY_WEBHOOK_SECRET`, `AI_IP_SALT` documented in `server/.env.example`
- ✅ Verified locally: frontend + server typecheck, `npm run build`, plans/checkout/guest paywall screenshots via mock API; production registration is enabled (400 on empty body, not 503)
- ✅ Deployed (`5305de3`) and verified on production: `/subscription` 200 (3 plans, RTL, no console errors), `/api/subscription/plans` 200 (`chargily:false`), `/api/subscription/me` 401 for guests, `/api/calculator/results` 401, unsigned Chargily webhook 401, sitemap has `/subscription`; checkout opens with CCP/BaridiMob and sends guests to login
- ✅ Receipt `proof` is limited to `data:image/(jpeg|jpg|png|webp);base64` so the admin receipts table cannot open a `data:text/html` page

## Session 2026-11-18 - subscription gate proven end-to-end (production)
- ? Temporary verified customer + disposable inbox used to walk the whole gate: guest 200 -> 403, signed-in preview 200 -> 402, manual CCP request + receipt, activation, unlimited 200 with `subscribed:true`
- ? Receipt validation confirmed on production: image data URL accepted, `data:text/html` rejected 400
- ? Bug fixed: guest trials were keyed by the rotating Cloudflare/Vercel edge IP. Now an httpOnly `aos_guest` cookie, real client IP headers as fallback, and the first cookie-less answer seeds the IP bucket - `b3f5d10`, `9434706`
- ? Tools page shows "مشترك" and an active-subscription banner/manage link instead of the trial/upgrade copy - `3494213`
- ? Customer token gets 401 on admin payments; Chargily returns `chargily_not_configured` without keys; calculator save/list/delete verified
- ? All 40 QA accounts/payments deleted (cleanup returned 40 then 0); temporary endpoints removed
- ? Admin panel verified in the browser with a temporary 2FA admin: "AI Subscriptions" tab, Activate (payment paid, quarterly subscription active until 2027-02-18, customer unlimited), Grant by email, Reject, Paid filter
- ? Bug fixed: receipt link opened an empty tab because Chrome blocks top-level data: URLs; it now opens an image dialog (close by button, backdrop or Escape) - `d023ed1`

## Session 2026-11-18 - defensive review of a recon attempt
- ? Only Vercel edge exposed; `.env`, `.git/config`, `vercel.json` all 404; no secrets in the JS bundle; strict CORS allowlist on the Render API; `boot-guard.js` is only an asset-reload helper
- ? Google Forms formResponse is a secondary order sheet; real orders still go through the rate-limited server API
- ? Dead Railway API (`Application not found`) removed from both CSPs and the admin live-feed fallback; live feed now uses the verified Render Socket.IO endpoint - `aeee887`

## Session 2026-11-19 - edge block + IP attribution fix
- ? curl/PowerShell recon triggered the Vercel Security Checkpoint (403 HTML challenge on every `/api/*`, including `/api/health`); browser fetches returned the real 200/401/403 responses
- ? Public API 200, protected API 401 (missing and garbage token), unknown routes 404, `OPTIONS` 200 `Allow: GET,HEAD`, `PUT`/`DELETE` 404
- ? No secrets in `aos_site_settings`/`aos_site_content` or the 663 KB JS bundle; source maps 403; helmet headers present on API responses
- ? Fixed auto-block attribution: `clientIp()` now uses `resolveClientIp`, and `sensitive_path` probes no longer auto-block, so a scanner cannot block a shared Cloudflare edge - `2179f82`
- ? Temporary IP probe verified the fix, then was removed - `0d4eddb` (now 404)

## Session 2026-11-19 - visitor counter
- ? `SiteVisit` model + `/api/visits/track` and `/stats`; one row per browser/day, salted cookie hash, no raw IP - `0d399e3`
- ? Footer badge (total + today, AR/FR/EN, DNT-aware) and admin overview rows
- ? Verified live: first visit `{visitors:1,today:1}`, repeat with/without cookie stayed 1, footer rendered "1 زائر · اليوم 1"
- ? Older limiters now use `resolveClientIp` too, so one visitor cannot exhaust a limit for the whole shared edge (register was 5/hour per edge) - `2136f04`
- ? `BACKUP_ENCRYPTION_KEY` (64 hex), `AI_IP_SALT` (64 hex) and `BACKUP_AUTO=true` set on Render; deploy `8f27d23`
- ? Boot logs: `[Backup] Next automatic backup at 2026-11-20T03:00:00.000Z` and a 40,538-byte catch-up backup written under `/opt/render/project/src/server/backups/`
- ? nmap shows only 80/443 on the Vercel edge, valid Let's Encrypt TLS, HTTPS redirect, 403 Security Checkpoint for non-browser clients; nothing to fix
- ?? Download the first backup and keep it off-server; Render's free disk is ephemeral
- ?? Optional: set `VISIT_BASE_COUNT` on Render for a historical starting total
- ?? Optional: `BACKUP_GITHUB_REPO` + `BACKUP_GITHUB_TOKEN` for off-server daily backups

## Session 2026-11-19 — 13th AI tool: complete landing-page generator
- ✅ Requirement delivered: the seller uploads a product photo and gets a **complete landing page** (live preview + ready `.html`), not just copy — `4c2a70b`.
- ✅ `landing-page` added to the server tool registry/fields/validation with a 15-section prompt; prompt tightened for short formal Arabic, no invented facts, no repeated words/doubled labels, no photo description — `c6e9fa9`, `6239c97`, `d531ed9`.
- ✅ Product photo stays in the browser (never sent to the AI provider) and is embedded in the exported HTML; no client-side API key, no raw provider errors.
- ✅ `src/app/utils/landingPage.ts`: tolerant parser for AR/FR/EN headings + escaped, responsive RTL/LTR page builder with SEO meta, hero, offer, FAQ, CTA, trust strip and raw-text fallback.
- ✅ Sandboxed `srcdoc` preview (no CSP change), `data:`-URL `.html` download, text tab/download, image-lost warning after reload.
- ✅ All "12 tools" copy updated to 13 (App, AI banner, footer, calculator, subscription, server plan, title).
- ✅ Frontend + server typecheck and build pass; backend accepts `landing-page` (`ai_missing_fields` confirms) and production generation returned 200 in 11.6 s.
- ✅ Production verification: 13 cards, upload + fields, full 10-section preview with embedded photo, 6 FAQs, WhatsApp links, exact price, no scripts/placeholders, downloaded HTML 184,510 chars, trial persisted after reload, no new console/CSP errors.
- ⚠️ The free landing-page trial was consumed in the test browser (use a different profile or sign in for the extra preview to re-test).

Next session should focus on:
- If you want to try the landing-page tool again, use a fresh guest profile or sign in (the test browser already used its free trial)
- Download the first encrypted backup from the admin panel and store it outside Render with the key
- Do future recon on staging or allowlist the scan IP in Vercel Project -> Firewall; never loop `curl` against production
- Set Chargily keys on Render (optional) and register `https://aos-tech.store/api/subscription/chargily/webhook`, or keep manual activation
- Fill the CCP/BaridiMob account fields in the site settings (the panel currently falls back to WhatsApp)
- Add the subscription/renewal card to the account area
- A prerender step so `/ai-tools`, `/ai-tools/calculator`, `/premium-services` and `/subscription` expose per-page titles/meta to crawlers
- Watch OpenRouter usage against the $5 lifetime limit and Render logs for 429s
- Optional: configure the GitHub backup destination so daily files leave the ephemeral disk

