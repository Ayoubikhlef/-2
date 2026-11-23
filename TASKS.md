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
