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

## Session 2026-11-19 — multiple 3D art directions for landing pages
- ✅ Added 5 distinct art directions + `auto`: `aos` (store identity), `noir` (black/gold), `aurora` (vivid), `editorial` (magazine), `neon` (futuristic) in `src/app/utils/landingThemes.ts` — `456798c`.
- ✅ Real Three.js hero scene (distorted glowing sphere, wireframe, rings, particles, product photo as a 3D card), pointer parallax, GSAP ScrollTrigger scroll animation, CSS 3D tilt/glass, reveal-on-scroll, reduced-motion/no-WebGL static fallback, DPR cap and pause when hidden — `456798c`.
- ✅ Exported HTML is self-contained except pinned jsDelivr scripts (three@0.160.0, gsap@3.12.5) and Google Fonts; no client-side API key and no provider errors.
- ✅ Dedicated sandboxed preview route `/landing-preview.html` with its own permissive CSP so 3D scripts run in preview without weakening the storefront CSP — `456798c`, `e460be8`.
- ✅ Style switcher in both the form and the result header; choice persists in the saved trial and download — `e460be8`.
- ✅ Local QA: five themes render differently, WebGL canvas confirmed, reduced-motion fallback confirmed. Production QA: CSP headers correct, THREE/GSAP load in preview, theme switch updates + persists, HTML download correct, no console errors.
- ⚠️ The owner's browser free trial is consumed; use a different profile or sign in for the extra preview to generate again.

## Session 2026-11-19 — mobile image upload fix
- ✅ Persistent inline `role="alert"` error under the upload box (replaces the transient toast as the only signal) and auto-scrolls into view on mobile — `0631e4f`, `4256726`.
- ✅ HEIC/HEIF from iPhones is decoded when the browser supports it; otherwise a clear message asks to save as JPG. Distinct messages for wrong type, empty file, >15 MB and over-large compressed output — `0631e4f`.
- ✅ Production mobile QA (390×844): invalid HEIC message stayed visible and centred in the viewport, valid JPG upload succeeded and cleared the error, no horizontal overflow.
- ✅ Second iOS fix: `compressImage` prefers `createImageBitmap(file)` over a multi-megabyte data URL, so large iPhone PNG screenshots no longer fail with "تعذر قراءة الصورة" — `e7dfa54`. Verified on production with a 1.4 MB PNG (compressed to ~350 k chars).

## Session 2026-11-19 — cinematic motion for site templates
- ✅ Removed the global "No motion" CSS override and card hover-kill rules in `server/src/site-factory/render/styles.ts`, re-enabling the existing kenburns/float/shine/gradient/reveal layer across all ~91 templates — `2537d67`.
- ✅ Added shared 3D hero layer (perspective, tilted hero card, translateZ image + trust card, rotating orbit ring, CSS-only floating orbs) and rAF pointer parallax in `server/src/site-factory/render/client.ts`; cards get subtle hover tilt — `2537d67`.
- ✅ Reduced-motion and mobile fallbacks kept; no new CDN dependency in generated sites.
- ✅ Verified locally (visual QA on `/templates/store/`) and in production: Vercel static preview CSS/JS contain the motion layer, Render auto-deploy of `2537d67` finished.
- ✅ Owner asked to remove motion from products: product/commerce cards are static again (no hover tilt/zoom, no reveal) while the hero 3D motion stays — `b9c8569`, deployed to both Vercel and Render.

Next session should focus on:
- If you want to try the landing-page tool again, use a fresh guest profile or sign in (the test browser already used its free trial)
- ✅ Backup key saved outside Render: `C:\Users\PC\AppData\Local\AOS-Secrets\BACKUP_ENCRYPTION_KEY.enc` (DPAPI, verified 64 hex chars, owner-only ACL), with `Get-AosBackupKey.ps1` + `README.md`; the plain Render `.env` export was deleted from Downloads
- Still download the encrypted backup file itself from the admin panel (or Render Shell) and keep it next to the key before the next Render redeploy
- Do future recon on staging or allowlist the scan IP in Vercel Project -> Firewall; never loop `curl` against production
- Set Chargily keys on Render (optional) and register `https://aos-tech.store/api/subscription/chargily/webhook`, or keep manual activation
- Fill the CCP/BaridiMob account fields in the site settings (the panel currently falls back to WhatsApp)
- Add the subscription/renewal card to the account area
- A prerender step so `/ai-tools`, `/ai-tools/calculator`, `/premium-services` and `/subscription` expose per-page titles/meta to crawlers
- Watch OpenRouter usage against the $5 lifetime limit and Render logs for 429s
- Optional: configure the GitHub backup destination so daily files leave the ephemeral disk



## Session 2026-11-21 — typography refresh + AI-tell cleanup
- Installed the requested skill repositories (supabase/agent-skills, vercel-labs/agent-skills, anthropics/skills, heydamir/unslop); the unslop main SKILL.md was restored into the global skill folder.
- Self-hosted IBM Plex Sans Arabic (400/500/600, AR + Latin subsets) and Bricolage Grotesque (variable Latin + Latin-ext) in public/fonts, with src/styles/fonts.css rewritten. theme.css now uses them for body and headings; existing layout, palette and motion are unchanged at the owner's request.
- Removed the visible "AI tells" without restructuring pages: gradient text, violet/fuchsia promo icon, multicolour CTA buttons, "New" badge, coloured glows/blobs, per-link rainbow nav, oversized tracking on labels, and gradient buttons. Hero, sections, cards, marquee and template motion stay as they were.
- Generated templates use the same two families via Google Fonts; shared template CSS keeps its existing palette and layout. Removed the inline onclick handlers from shell.ts (to-top) and offline.html (retry) so the strict CSP no longer reports inline-handler violations; client.ts binds the to-top button instead.
- Added CamelCase route aliases /Subscribe, /Abonnement and /Calculators to vercel.json.
- Added the subscription/renewal card to the account dashboard and per-route SEO HTML generation in vite.config.ts (4 pages).
- Verified: npm run typecheck and npm run build pass (92 templates, 1104 files). Local preview renders correctly in AR/FR and light/dark; the extra demo products seen in local QA come from the offline default catalog because the local API proxy cannot reach Render — production /api/products returns the real product list and was verified directly.

- Template product imagery made static at the owner's request: hero product shot, its floating badge and every catalogue/commerce card now have animation/transform/transition disabled; ambient hero motion (orbit, orbs, shine) is unchanged.


## Security documentation cleanup (2026-11-21)
- Removed the generated SECURITY_HARDENING.md and security-test.js: they contained inaccurate claims and a test script with broken result logic. Also removed start-dev.bat (called a dev:https script that no longer exists) and reverted unrequested dev/color edits from package.json and theme.css.
- Added SECURITY_NOTES.md with only protections verified in server/src/index.ts (Helmet CSP, proxy-aware IP resolution, per-endpoint rate limits, CORS allowlist, HPP), JWT/bcrypt/role guards, and the deliberate limitations. It does not claim a clean pentest.


## Session 2026-11-22 - hero heading + header login control
- Hero: widened the text column, made the headline fluid `clamp(3.5rem, 10vw, 7rem)` so it tracks the viewport, and removed the centering cap so the text aligns to the right edge. Layout, palette and motion are otherwise unchanged (commits f006b98, 3fd7cc9, d71118d, f30b78f).
- Header: added a "تسجيل الدخول" (LogIn icon + label) link directly beside "إنشاء المواقع" from 2xl up; below 2xl the existing icon slot opens the same #account login. From 2xl the nav labels are 16px (were 14px) with 8px side padding and no inter-link gap; the secondary "الخدمات الرقمية" link appears from 1600px and the phone-number label from 1700px, so every nav label stays on one line at 1562px (owner's window); the phone icon still calls.
- Services: all six card photos (office services + the three digitization cards) now share the same hover zoom; the three lower cards previously had static images.
- Welcome email: added `server/src/services/welcomeEmail.ts`, a branded RTL email sent when an account is created. Password sign-up receives one strong welcome + email-confirmation mail (subject "أهلاً {الاسم} — أكّد بريدك...") with the confirm button, account benefits, and live contact details; Google/GitHub sign-up receives the "حسابك جاهز" variant, sent without delaying the redirect. Contacts are read from `site_factory_settings` with AOS defaults. Previewed desktop/mobile; server tsc, root typecheck and build pass. Could not send a local test because `RESEND_API_KEY` is empty in server/.env — production uses the already-configured transactional channel.
- Next: after Render finishes deploying commit 7d72abf, open a real account on aos-tech.store with a reachable inbox and confirm the welcome mail lands in the inbox (not spam), the confirm button activates the account, and the OAuth sign-up variant arrives once.

## Session 2026-11-22 - VIBE CODING security checklist page
- Added a public page at `/security-checklist` in AR/FR/EN (RTL/LTR) with 20 original protection cards: sign-in + 2FA, API keys, database, HTTPS, password hashing, server-side validation, XSS/SQLi/CSRF, login limits, CORS/headers, cookies, reset links, uploads, server-side pricing/payments, debug mode, dependencies, exposed files, Git secrets, backups/WAF, alerts, and a staging pentest. Wording and prompts are original to AOS; no external checklist text or prompts were copied.
- Progress is stored in `localStorage` (`aos_security_checklist_v1`) with a progress bar, per-card "done" toggle, reset, copy-prompt buttons and a Markdown download (`aos-security-checklist-<lang>.md`). No backend or database change.
- Wired into `src/app/App.tsx` (route reader, lazy page, per-language `document.title`, 404 exclusion, header/announcement/footer rules), footer link, `vercel.json` rewrite + no-store header, `public/sitemap.xml` through `scripts/generate-sitemap.mjs`, and a fifth route-SEO shell in `vite.config.ts`.
- QA: typecheck and build pass; local preview verified toggle persistence, copy toast, reset, AR/FR/EN and no horizontal overflow; production returns 200 with the correct title/canonical, 20 cards and no console errors.
- Commits `6d21cac` + `afd1de2` (localized the download status markers); both pushed and deployed to Vercel, live URL returns 200. This page is educational only; the real audit gaps and the pending pentest are tracked in SECURITY_NOTES.md and the follow-ups below, not on the public page.

## Session 2026-11-22 - checklist shortcut in the create-website wizard
- Added a compact ShieldCheck shortcut directly above the template grid in step 1 of the create-website wizard (`src/app/components/site-factory/FactoryWizard.tsx`). Label: "VIBE CODING — الحماية" / "sécurité" / "security", with a one-line description and an RTL-aware arrow. It opens `/security-checklist` in a new tab so the in-progress order draft is preserved.
- Verified locally and in production: the shortcut sits above the 91 template cards, opens the checklist (20 cards), and causes no horizontal overflow or failed resources. `npm run typecheck` and `npm run build` pass.
- Commit `0199650`, pushed and deployed to Vercel.

## Session 2026-11-22 - copy all prompts
- Added a "نسخ الكل" / "Tout copier" / "Copy all" button beside the download button in the checklist hero (`SecurityChecklistPage.tsx`). It copies every one of the 20 prompts with its number and title, plus the final report prompt, in the current language; shows a dedicated success toast and a temporary "copied" state.
- Verified by pasting the clipboard into a page textarea: 4,981 characters, exactly 20 numbered prompts and the final report prompt. Live page shows the button and fires the toast. `npm run typecheck` and `npm run build` pass.
- Commit `a3e6e8e`, pushed and deployed to Vercel.

## Session 2026-11-22 - light-mode readability
- Owner reported faint writing in light mode. Root cause: light `--muted-foreground` was #64748b (faint at 12-14 px Arabic) and the checklist prompts used `text-foreground/80` at 12 px.
- Fix: light `--muted-foreground` darkened to #475569 in `src/styles/theme.css` (dark theme unchanged, all pages benefit); checklist prompts and the final-report block now use full `text-foreground` at 13 px, and the small badges/labels moved from 10 px to 11 px.
- Verified in production light mode: computed muted text #475569, prompt text #1e293b / 13 px, 20 cards, no opacity or filter issues. `npm run typecheck` and `npm run build` pass.
- Commit `efb7d18`, pushed and deployed to Vercel.

## Session 2026-11-22 - site-wide light-mode contrast
- Owner clarified the faint text was across the whole site. Audit found low-alpha utilities (`text-foreground/60|70|80`, `text-muted-foreground/50|60|80`) rendering as pale grey on white, mainly in the header nav, footer, account and cart.
- Added light-mode-only rules in `src/styles/theme.css` under `html:not(.dark)` so those utilities use the solid tokens (#1e293b / #475569). Dark mode and white-on-dark sections are untouched; one admin order-id span moved to `text-slate-500` so its dark panel keeps the original look.
- Verified in light mode on /, /premium-services, /ai-tools, /subscription, /create-website and /security-checklist: nav and footer links #1e293b, muted copy #475569. Dark mode toggle still works. typecheck/build pass.
- Commit `4f37b0f`, pushed and deployed to Vercel.

## Session 2026-11-22 - per-site owner dashboard
- Owner asked that a generated site come with its own working admin dashboard "like mine". Confirmed choices: dashboard hosted on aos-tech.store (not inside the static pages.dev build), managing orders/messages, products/prices and content/colours, accessed with a private link.
- Added `Site.adminTokenHash`, `adminLinkAt`, `adminSessionVersion` to the Prisma schema. Links are random 32-byte tokens, stored only as SHA-256 hashes; `rotateSiteAdminLink()` issues one and `consumeSiteAdminToken()` exchanges it once and rotates it, so the URL cannot be reused.
- New `server/src/routes/siteAdmin.ts` (mounted at `/api/site-admin`) + `middleware/siteAdmin.ts`: claim endpoint sets an HttpOnly/Secure/SameSite cookie with a 12-hour JWT using the dedicated `aos-site-admin` audience, scoped to that siteId. Every query filters by the session siteId. Endpoints: me/logout, orders list + status update, leads list, product CRUD, content/colour whitelist update with preview refresh, publish.
- Frontend `/site-admin` page (`SiteAdminPage.tsx`) with four tabs and a dedicated API client that never triggers the store's token refresh; AOS factory console got a "رابط اللوحة" button that issues/copies the link. Added Vercel rewrite/no-store header and robots.txt disallow. SECURITY_NOTES.md documents the model.
- Server `tsc`, root `typecheck` and `build` pass. Local DB env is empty, so the happy path could not be exercised locally; production smoke test pending after deploy/Render db push.
- Vercel free deployment storage hit 100% (10 GB). Removed two old unaliased production deployments; the active aliased deployment was left untouched.

## Session 2026-11-23 - QA pass on the owner dashboard
- Found and fixed a real flaw in the one-use sign-in link: the GET claim endpoint exchanged the token immediately, so WhatsApp/Telegram/email link previews (which fetch every URL) could burn the link before the owner clicked it. `GET /api/site-admin/claim/:token` now returns a small AR/FR/EN confirmation page (no token consumed, impact-only CSP, `no-referrer`, `noindex`), and the token is exchanged on the form's POST with a 303 redirect.
- `/site-admin` no longer renders the WhatsApp bubble and AI assistant, which used to float over the dashboard.
- The dashboard now calls `/me` first and only then fetches orders/leads/products/content, so an invalid or expired link produces one 401 instead of five.
- "Publish changes" is disabled until the request is `confirmed`/`published` (matching the server rule), with a localized explanation.
- Issuing a new dashboard link now asks for confirmation when a previous link exists, because rotation revokes it immediately.
- Verified live: no console errors on home/create-website/checklist; preview URLs now answer 301 → 404 instead of looping; API health 200. Server tsc, root typecheck and build pass.
- Still untested end-to-end: the success path of the claim link, because the local DB URL is empty and no production admin session is available.

## Session 2026-11-22 - package price bidi + preview redirect loop
- Owner reported package prices rendered reversed in the create-website wizard ("45 000" showed as "000 45") and the preview link failing with ERR_TOO_MANY_REDIRECTS.
- Root cause 1: space-grouped amounts in an RTL paragraph get visually reordered. `money()` in `factoryUtils.ts` now wraps the number in Unicode LRI/PDI isolates (`\u2066 ... \u2069`), keeping "45 000 د.ج" in reading order. Verified in a browser RTL snapshot: before/after strings compared.
- Root cause 2: Express (strict routing off) matched `/preview/:id/` with the `/preview/:id` redirect route, which redirected to the same URL forever. The route now detects a trailing slash and serves `index.html` directly; only the slash-less URL redirects once.
- Server `tsc`, root `typecheck` and `build` pass.

## Session 2026-11-23 - site-factory logo upload on phones (HEIC)
- Reproduced on a 390x844 mobile emulation of `/create-website`: chose the store template, opened step 2 and uploaded a real iPhone HEIC file to "شعار النشاط". The logo field showed the generic "تعذر تجهيز الصورة. جرّب صورة أخرى." while the decoder failed silently; JPEG upload worked.
- Root cause: the shared `compressImage()` read every File as a multi-megabyte `data:` URL and decoded it in an `<img>`; iOS/mobile browsers can fail that decode silently, and HEIC has no browser decoder outside Safari 17.
- Fix in `src/app/components/site-factory/factoryUtils.ts`: decode with `createImageBitmap(File)` first, keep the `<img src="data:">` fallback, and lazily load `heic-to/csp` (wasm2js, no CSP eval needed) to convert HEIC/HEIF to JPEG when native decoding fails. Compression no longer re-reads the original file and falls back from transparent WebP to PNG and then white JPEG instead of shrinking a logo to 90 px.
- `FactoryShared.tsx` now shows distinct localized errors (empty file, HEIC guidance to save as JPG / enable "Most Compatible", compression failure) and a "جارٍ تجهيز الصورة…" progress line. Logo/cover hints mention HEIC support.
- Local QA (390x844 emulated mobile): 640x480 HEIC -> WebP logo 3.2 KB + JPEG cover 14.7 KB; 1596x1064 HEIC -> 41 KB logo + 271 KB cover; 4000x3000 JPEG and transparent PNG also compress successfully; all outputs stay under logo/cover byte caps.
- Production QA (390x844 emulated iPhone, 2026-11-23): HEIC logo uploaded successfully in the live wizard via the lazy `heic-to` chunk (WebP data URL 54,747 chars, ~41 KB), no console errors and 0 failed network requests. A real order was submitted end to end: `WEB-20261123-7B16`, site id `cmwt6ypeq00389q5eqp6d3xj4`, preview `https://aos-tech.store/api/site-factory/preview/cmwt6ypeq00389q5eqp6d3xj4/` returned 200 with `assets/logo.webp` (41 KB, 512x341) and `assets/cover.jpg` (23 KB, 1600x1200) rendering correctly and the watermark present.
- Additional production QA: broken `.heic` shows the new localized guidance in EN ("Could not read this iPhone HEIC photo..."), then a valid PNG clears the error and shows the preview; no horizontal overflow at 390 px. Root `npm run build` passes; `npm run typecheck` still reports the pre-existing `@sentry/nextjs` / `process` errors in `src/lib/capture-error.ts` (unused file).
- Committed `d72099c` and deployed to Vercel production (`dpl_DLitCGsuq1kQs5eY9ZTjTeVLz9GP`, aliased to `https://aos-tech.store`). Two older unaliased production deployments removed to free Vercel storage.
- ⚠️ The QA order above is real data in the production DB (name "متجر اختبار الجودة", subdomain `qa-heic-20261123`). Remove/ignore it; no payment receipt was sent.

## Session 2026-11-24 - customer password reset showed "invalid link" after submitting
- Owner reported the customer reset flow ending on the API's "رابط إعادة التعيين غير صالح" page. Reproduced on production with a real disposable inbox and a 390x844 mobile emulation: the emailed link itself was correct (64-hex token) and opened the reset form, but clicking "حفظ كلمة المرور" turned the URL into `?password=...&confirmPassword=...` and landed on the invalid-link page.
- Root cause: Vercel's global `/api/*` CSP overrides the page's nonce-based CSP (`script-src 'self' <hashes>` with no nonce). The inline submit handler never ran, so the browser did a native GET submit, dropped the token and leaked the new password into the address bar.
- Fix (server only, no Vercel deploy): the reset page now uses a plain `POST` form with a hidden token input; no inline JS. `/api/auth/reset-password` accepts `application/x-www-form-urlencoded` and renders Arabic HTML success/error pages. JSON clients keep the same contract and English error strings. Also stopped the 10/15min password-reset limiter from counting page GETs (mail scanners/refresh used to lock customers out).
- Verified on production after Render auto-deploy: fresh emailed link -> form -> native POST -> "تم تغيير كلمة المرور" success page, clean URL, no password in the address bar; JSON POST with a bad token still returns 400 `Reset link is invalid or expired`. `npm run build` in `server/` passes.
- Commits `5c83fb5`, `794e825`, `4185d07`, pushed to `origin/main`.
- Test account `aosqa1124092527@euploading.com` was created and verified on production for this QA; its password was changed during the test. Delete it if a clean DB is wanted.
- Minor known issue: `public/sw.js:55` tries `cache.put()` on the form's POST navigation and logs a harmless service-worker TypeError; the reset still completes. Fixing it would need a Vercel deploy, so it was deferred.

## Session 2026-11-24 - AOS door loader at storefront entry
- Added the owner's door-opening loader to the storefront entry: brand-blue double doors, owner portrait, orbit dots, AOS name and progress bar. It replaces the old plain boot spinner but keeps the `boot-guard.js` recovery path (retry button + hint) intact.
- The loader lives outside `#root` so React cannot cut the animation short; `public/aos-loader.js` is external so the Vercel CSP's hashed inline-script policy is untouched. It waits for both `window.load` and `__AOS_MOUNTED__` before completing, localizes the tagline/hint for ar/fr/en (RTL/LTR), and skips animation for `prefers-reduced-motion`.
- Portrait moved from a 45 KB inline data URL to `/aos-loader-avatar.jpg` (34 KB, cacheable). `public/sw.js` precaches the two new assets (cache v14) and no longer calls `cache.put()` on POST navigations, which removed the console TypeError from the password-reset flow.
- SEO route generation (`vite.config.ts`) and product fallback (`api/product-page.ts`) now target `<div id="aos-loader"` instead of the removed `#boot-screen`; verified `/premium-services/` fallback still swaps.
- Local QA (390x844 + 1280x800, reduced motion off): loader visible, 20% -> 100%, doors open, element removed, no overflow, EN shows LTR + English tagline, AR shows RTL. Reduced motion removes it immediately. Production QA after deploy: same, zero console errors; `/aos-loader.js` and avatar both 200.
- Commit `6bb29f8`; Vercel production deploy `aos-tech-store-8q50x1fb5-...` aliased to `aos-tech.store`. Removed six old unaliased production deployments, leaving only the two aliased ones.

## Session 2026-11-24 - loader handover on desktop
- Owner reported the loader looked stuck on desktop: after the counter reached 100% the site still did not appear. The old sequence waited 220 ms + 620 ms before opening, then kept the node for 1900 ms while a 1.3 s door swing and a 1 s background fade ran.
- Fix: `minMs` 1800 -> 1200; at 100% the loader gets `fade open` after 40 ms and the node is removed at 340 ms. Door/background/content transitions shortened to 260 ms (180 ms content). React is already mounted underneath, so the full site is visible ~0.35 s after 100%.
- Verified locally and in production (1440x900 desktop, reduced motion off): 100% -> node removed in 312-356 ms, site fully rendered, no overflow. Production served JS confirms `minMs = 1200` and 340 ms removal.
- Commit `babed00`; Vercel production deploy `aos-tech-store-bjzjb1o09-...` now holds all aliases. Old unaliased deployments removed; two remain.

## Session 2026-11-24 - loader on phones only
- Owner asked to remove the entrance loader on desktop entirely and keep it only on phones. `public/aos-loader.js` now detects touch/mobile (`pointer: coarse` or mobile UA) and, when the device has a fine pointer, removes the loader synchronously while the document parses. An inline-CSS media query `@media (hover:hover) and (pointer:fine) { #aos-loader{display:none!important} }` prevents even a flash before the script runs.
- `boot-guard.js` creates its own minimal retry overlay when the loader is absent (desktop), so the 12 s no-mount recovery still works.
- Verified: 1440x900 desktop shows no loader and the full storefront immediately; 390x844 touch emulation shows the loader, 100% -> removed in ~0.35 s. Production verified after deploy: desktop no loader, phone loader present and removed, zero console errors on a fresh tab.
- **Deployment incident:** while pruning old Vercel deployments the alias-matching check used full URLs against bare hostnames from `vercel alias ls`, so it removed every deployment including the aliased one (site briefly 404). Immediately redeployed `aos-tech-store-9ujhsa1kf-...` with `vercel --prod --yes`, aliases restored and HOME/loader URLs back to 200. Only one production deployment remains; do not prune again unless the alias source is matched by hostname without the scheme.

## Session 2026-11-24 - SEO fallback flash on refresh
- Owner reported a sudden flash of the raw Arabic SEO text when refreshing/entering the store, then it disappeared. Cause: the `#seo-fallback` markup inside `#root` was visible until React replaced it; the old boot screen used to cover it, but the desktop loader is now hidden/removed.
- Fix in `index.html`: `#seo-fallback { display: none; }` in the head stylesheet (so it never paints) plus `<noscript>` style restoring `display:block!important`, keeping the no-JS fallback available for crawlers/visitors without scripts. Source text remains in the HTML.
- Verified with `waitUntil: 'commit'` on production: fallback computed `display:none` before React mounts on both desktop and phone; after mount the node is gone, the storefront h1 is present, no console errors, no overflow. Build-time SEO route pages carry the same rule.
- Commit `4e6eecd`, Vercel production deploy `aos-tech-store-ddo0yf8bh-...` (aliases restored automatically). No deployment pruning performed this time.

## Session 2026-11-24 - sponsor ad set for orders
- Owner asked for a strong, attractive sponsor ad that brings orders. Gathered requirements: Facebook/Instagram 1080x1080, owner portrait + bold type, five variations. Offer combines free delivery over 8,000 DZD with cash on delivery in all 69 wilayas, the website factory, and AI services (logo/content/CV/chatbot).
- Built `assets/banners/aos-sponsor/preview.template.html` with five 1080x1080 CSS banners using Tajawal, verified brand blue, owner portrait (`public/aos-loader-avatar.jpg`) and `icon-512.png`. `preview.html` embeds both images as data URLs for offline preview.
- Exported `01-free-delivery`, `02-website-factory`, `03-ai-services`, `04-all-services`, `05-order-now` (all 1080x1080 PNG) and `README.md` with per-banner angle, Arabic post captions, and the note that paid Meta tends to favour the lower-text variants 1 and 5.
- QA: captured at exactly 1080x1080; fixed an invisible white logo on the light website variant and an overlapping headline on the AI variant, then re-exported. All five checked visually; safe zones and single CTA respected.
- No app source changed; these are static marketing assets only. Source screenshots were captured via a temporary local static server on port 8899, now stopped.

## Session 2026-11-24 - edge protection on aos-tech.store
- Owner asked to "put" anti-attack protection on the store. Added `aos-tech.store` to their Cloudflare account (Free plan), quick-scan imported all 11 existing DNS records (root A 216.198.79.1 proxied, www CNAME proxied, MX/TXT untouched), and SSL/TLS encryption mode set to **Full (strict)**.
- At Namecheap (logged-in Brave tab) replaced nameservers `dns1/dns2.registrar-servers.com` with `daisy.ns.cloudflare.com` and `kipp.ns.cloudflare.com`; propagation still pending (Cloudflare shows "Waiting for your registrar"), so the site is still served by Vercel directly for now.
- Cloudflare WAF custom rules could not be deployed from the dashboard: the login lacks `Zone > Zone WAF` permission (dashboard offered an API-call fallback with a token we do not have). Instead used the authenticated Vercel CLI: staged and published firewall rule `Block scanner paths` (deny `/wp-*`, `/xmlrpc.php`, `/phpmyadmin`, `/.env`, `/.git`). `vercel firewall status` shows Firewall Enabled, 1 active rule. Verified live: `/wp-login.php`, `/.env`, `/xmlrpc.php` all 403, `/` still 200.
- Left Attack Mode, bot protection and OWASP off to avoid blocking customers; server-side auth/AI/order rate limits remain the main behavioural protection.
- **Remaining:** wait for Cloudflare nameserver propagation (minutes to 24h), then re-check zone status in Cloudflare DNS overview; grant the user's Cloudflare login `Zone WAF` permission if dashboard-side WAF rules are wanted. `aos-store.dz` is a separate domain in the account with invalid nameservers and was not touched.

## Session 2026-11-24 - Cloudflare WAF rule completed (follow-up)
- The earlier WAF failure was a tooling mistake, not a missing permission: the logged-in Cloudflare user is Super Admin. Our first `button:has-text("Deploy") >> nth=0` clicked the "Deploy with API call" button, which opened the API-token fallback. Using `nth=1` plus the dialog's Deploy button deployed the rule through the UI.
- Cloudflare custom rule `Block scanner paths` is now **Active (1/5)**: blocks `/wp-login.php`, `/xmlrpc.php`, `/wp-admin`, `/phpmyadmin`, `/.env`, `/.git`.
- Nameservers propagated: Cloudflare Domains list shows `aos-tech.store — Active`. `curl -I` returns `Server: cloudflare` and HSTS; scanner paths return 403 through Cloudflare, home 200.
- Both layers are now live: Cloudflare WAF at the edge + Vercel firewall rule (same paths) as backup.

## Session 2026-11-24 - site unreachable scare + Cloudflare login rate limit
- After switching Namecheap nameservers, the site briefly returned `ERR_CONNECTION_FAILED`/`curl 000`. Root cause was **stale DNS cache**, not a Cloudflare or Vercel failure: registry RDAP showed the correct Cloudflare nameservers (`daisy`/`kipp`) and `cloudflare-dns.com` resolved the correct A records, while the local resolver and Google DNS still held the old Namecheap verification nameservers with TTL 300. `ipconfig /flushdns` restored HTTPS 200 immediately. On phones, toggling mobile data / waiting for the 300s TTL clears it.
- Namecheap WHOIS contact verification had completed: domain list shows `aos-tech.store ACTIVE` and the Custom DNS nameservers persisted. No further registrar change was needed.
- Added and deployed Cloudflare **rate limiting rule** `Limit login page`: `URI Path equals /login`, 100 requests / 10 seconds per IP, action Block for 10 seconds, Active (1/1 rule; free plan). Free plan offered only 10-second periods/durations.
- Verified after deploy: `/` 200, `/login` 200, `/wp-login.php` 403, `/.env` 403, all `Server: cloudflare`.
- Earlier dashboard WAF deployment was valid; the failure was clicking "Deploy with API call" instead of the real Deploy button.

## Session 2026-11-25 - AI site-copy auto-fill + Cloudflare Turnstile customer login
- Owner asked for AI copy inside every site-factory template: once the template, site name and activity are known, generate the tagline, short description, services and products straight into step-2 fields; the owner still completes package/domain/payment manually. Also wanted the OGAds-style Cloudflare "Verifying..." widget above the customer Log In button.
- Server: added `site-copy` to `AI_TOOLS`, fields/labels/required fields and a strict-JSON system prompt in `aiProvider.ts`; `parseSiteCopy()` extracts and sanitises the first JSON object (tolerates fences and trailing commas) and a bad answer retries the next provider. Localized mock added. `needs` is derived per template (services, products, both or copy-only), so all 92 templates receive relevant copy. Prices, phone numbers and images are never invented.
- `subscription.ts`: `resolveSiteCopyAccess()` gives a separate 5/day allowance per signed-in user or guest cookie/IP, so website customers do not spend their single AI Studio preview. `routes/ai.ts` returns `data` alongside `text` for `site-copy` and maps the daily limit to a friendly error.
- Frontend: step 2 now has a smart-fill panel (one-line activity brief + generate button) with ar/fr/en loading, success and error messages; results are mapped into tagline/description/services/products while existing prices and photos are preserved by product name. `api.ai.siteCopy()` added.
- Turnstile: widget `AOS Tech Store - Customer login` created in the Cloudflare dashboard, non-interactive mode, hostname `aos-tech.store`. Public site key `0x4AAAAAAGSI3NzjK3NMVybI` is a Vercel Config env var (`VITE_TURNSTILE_SITE_KEY` for production/preview/development); the secret is a Render env var (`TURNSTILE_SECRET_KEY`). `TurnstileWidget.tsx` renders explicitly with dark theme, ar/fr/en language and resets after every attempt; it is shown above the submit button in both the password and 2FA steps of `LoginPage.tsx`. Admin login is deliberately exempt: it enforces TOTP and must stay reachable during a captcha outage. Server verification lives at the start of the credential-valid part of `/api/auth/login` (after the password check, so it cannot be used as an account oracle) with `CAPTCHA_FAILED` / `CAPTCHA_UNAVAILABLE` codes. Verification is skipped when no secret is configured. `vercel.json` CSP now allows challenges.cloudflare.com in script-src/frame-src/connect-src; `.env.example`, `server/.env.example` and `render.yaml` document both keys.
- QA: server `tsc --noEmit` passes; root `npm run build` passes (root typecheck still has the pre-existing unused `capture-error.ts` errors). Local widget test with Cloudflare's test site key produced a token and the frontend passed the guard; live siteverify checks passed with both Cloudflare test secrets; the production widget produced a 752-char token that our real secret verified successfully; production API returned valid Arabic site-copy (5 services, 8 products, no prices); production login E2E with a test account returned 400 `CAPTCHA_FAILED` without a token and 403 `EMAIL_NOT_VERIFIED` with a valid widget token.
- Commit `4d312e1` pushed. Vercel production deployment `aos-tech-store-d8t932idk-ayoubikhlefs-projects.vercel.app` holds all aliases. Render deploy `dep-dc3aofgu01pc73e3sl5g` (environment update) succeeded.
- Rollout rule: deploy the frontend with the site key first, then set the Render secret. Reversing the order locks customers out because the old build has no widget to produce a token.
- Test account created for the captcha E2E: `aosqa1125turnstile@euploading.com` (unverified, no orders). Treat as junk data.
