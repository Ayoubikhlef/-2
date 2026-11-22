# PROJECT MEMORY

## Project
AyoubWorkTechStore (AOS) - Algérie Office Services Tech Store

## Description
Online IT and computer equipment store for Algeria, also selling office services. Fully-featured e-commerce platform with website factory builder capability to generate custom developer portfolios and business sites.

## Technology Stack

### Frontend
- **Framework**: React 18.3 with Vite 6 build system
- **Styling**: Tailwind CSS 4.1, shadcn/ui components, Radix UI primitives
- **Animations**: GSAP, Motion, Three.js, next-themes
- **State**: React hooks, date-fns for date handling
- **Icons**: lucide-react
- **Routing**: react-router

### Backend (API)
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL via Prisma ORM
- **Security**: Helmet, CORS, rate limiting, HPP, cookie-parser
- **Compression**: compression middleware
- **Async**: express-async-errors

### AI Features
- **RAG Pipeline**: Transformers.js for semantic search with image search capability
- **Chat**: Real-time Socket.io connections for live chat interface
- **Generation**: AI-powered content generation (website factory builder)

### Infrastructure
- **Deployment**: Render, Vercel
- **Timezone**: Africa/Algiers (UTC+1)
- **Keep-alive**: Automated health ping every 10 min during business hours

## Architecture

### Hybrid Platform
The app combines a traditional e-commerce storefront with a website factory builder - allowing customers to either:
1. Browse and purchase IT equipment from the catalog
2. Use AI tools to generate custom website templates for developers/businesses

### API Structure (`server/src/routes/`)
| Route | Purpose | Rate Limit | Security Notes |
|-------|---------|------------|----------------|
| `/auth` | Authentication (login/register/forgot-password) | 100/15min, 5/register/hour | Strict limits on account creation |
| `/chat` | Live chat messages | General | Socket.io streaming |
| `/ai/generate` | AI content generation | 12/10min | Provider quota cost |
| `/products` | Product CRUD with catalog management | General | E-commerce core |
| `/orders` | Order processing, payment, status tracking | 600/1min | Stale order cleanup |
| `/customers` | Customer account management | General | - |
| `/reviews` | Product reviews/ratings | General | - |
| `/newsletter` | Email subscription | General | Spam protection |
| `/contact` | Contact form submissions | 12/10min | Anti-abuse |
| `/loyalty` | Loyalty points/rewards | Order limit | Customer retention |
| `/data` | Data export/import utilities | General | Privacy features |
| `/maintenance` | System maintenance endpoints | General | Admin only |
| `/email` | Email queue management | General | Delivery tracking |
| `/payment` | Payment processing | Order limit | Financial security |
| `/security` | Security audit logs, audit trails | General | Compliance |
| `/snapshots` | Database backup/restore | 6/1hr | Owner-triggered only |
| `/site-factory` | Website generator API | AI limiter | Public CORS for previews |
| `/health` | Health check endpoint | - | Public liveness probe |
| `/backup` | Legacy backup route (deliberately limited) | General | Obsolete endpoint |

### Security Features
- **Helmet**: Strict CSP, HSTS with 1-year maxAge, includeSubDomains
- **Rate Limiting**: Granular per-endpoint limits with IP-based tracking
- **CORS**: Differential policy - strict for API, wildcard only for site-factory previews
- **HPP**: HTML parameter pollution protection
- **Security Monitor**: Tracks suspicious patterns, logs to AuditLog table
- **Order Hardening**: Status event history, stock restoration tracking
- **Mojibake Fixer**: Automatic encoding corruption repair on boot

### Database Schema (Prisma)
Core models: User, Product, Category, Order, OrderItem, OrderStatusEvent, Review, Coupon, Setting, NewsletterSubscriber, ContactMessage, SiteTemplate, SitePackage

Additional tables (runtime-created): AuditLog, paymentIntent-related columns, delivery fields

## Environment Variables
Frontend: `VITE_API_URL` points to backend API
Backend: Standard Node/Express vars plus Sentry DSN, Render URL, Keep-alive settings

## Known Issues & Workarounds

### Render Free Tier Limitations
- **Sleep Mode**: Server sleeps after 15min inactivity; first visitor waits ~1min
- **Keep-alive Solution**: Automated health ping every 10 min during active hours (configurable via KEEP_ALIVE_START_HOUR/END_HOUR)
- **750 Hour/Month Cap**: Keep-alive runs only during business hours to stay within quota

### Database Backwards Compatibility
Runtime schema migrations ensure older databases work even without `prisma db push`:
- Order delivery columns added idempotently
- AuditLog table created if missing
- OrderStatusEvent history table with foreign key constraints

### Encoding Issues
`fixMojibakeSettings()` runs on boot to repair JSON stored with wrong character encoding

## API Routes Summary
The backend provides:
- Full authentication flow (register/login/password-reset/email-verification)
- E-commerce operations (product catalog, cart/order flow, payment processing)
- Customer management and loyalty program tracking
- Review/rating system for products
- Newsletter subscription with double-opt-in
- Contact form with abuse protection
- AI-powered website generator for developer portfolios
- Real-time chat interface
- Email queue management
- Database backup/restore automation
- Security audit logging and monitoring

## AI Provider Chain (`server/src/services/aiProvider.ts`)

The AI Studio (`/api/ai/generate`) never depends on a single provider. Order:

1. **OpenRouter** (`OPENROUTER_API_KEY`) — default model `anthropic/claude-haiku-5.5`, reasoning disabled (`reasoning: { effort: 'none' }`) for speed/cost. Upgrade with `AI_MODEL=anthropic/claude-sonnet-5.5`.
2. **Gemini** (`GEMINI_API_KEY` / `AI_API_KEY`) — used first instead when `AI_PROVIDER` is explicitly set to `gemini`.
3. **Groq / OpenAI** (`GROQ_API_KEY`, `OPENAI_API_KEY`).
4. **Keyless free provider** (`kilo-auto/free`) via `keylessConfig()` — keeps AI Studio usable with zero keys.

Timeouts: `AI_TIMEOUT_MS` (default 20 s) per keyed provider, 25 s for the free provider, 55 s total deadline (browser aborts at 60 s). A failed/slow provider is skipped silently, so a visitor never sees a provider timeout error; the UI only shows a "still working" hint after 8 s.

Provider order is deliberate: the paid/limited OpenRouter key is tried first while the free keyless provider acts as the safety net, so extra cost only happens when Claude is actually reachable.

## Premium Services Page (`/premium-services`)

- Served by the Vite SPA (`src/app/components/PremiumServicesPage.tsx`), not Next.js. Vercel rewrites `/premium-services` and `/Premium-services` to `/index.html` with `no-store` headers; the route is detected in `App.tsx` via `readPremiumRoute()` and rendered lazily with Header + Footer.
- Data comes from `src/app/data/highValueServices.ts` (15 services, 4 categories). Customer-facing UI shows tier prices only — the internal `margin` field is never rendered.
- Each card expands to basic/standard/premium pricing and a `/#booking` CTA; page is in the sitemap (`scripts/generate-sitemap.mjs`) and has per-language titles.
- The old `src/app/premium-services/page.tsx` (Next.js, framer-motion, leaked margins, broken links) was deleted — do not recreate it.

## AI Tools Page (`/ai-tools`)

- Real Vite route: Vercel rewrites `/ai-tools` and `/AI-tools` to `/index.html` with `no-store`; `App.tsx` detects it through `readAiToolsRoute()` and lazy-loads `src/app/components/AiToolsPage.tsx` with Header + Footer.
- 13 seller tools in 3 stages (before selling / what you write / what you analyse), defined in `src/app/data/aiTools.ts` (bilingual copy + form fields): `product-check`, `offer-maker`, `competitor`, `plan`, `ad-copy`, `product-page`, `landing-page`, `video-script`, `customer-reply`, `order-confirmation`, `ad-image-review`, `page-review`, `campaign-doctor`.
- Server registry is `AI_TOOLS` (16 = the 3 old AI Studio tools + these 13) in `server/src/services/aiProvider.ts`, with `TOOL_FIELDS`, `REQUIRED_FIELDS`, `FIELD_LABELS`, `buildGrowthPrompt()` and a mock response per tool for `AI_MOCK`.
- One free trial per tool is stored in `localStorage` under `aos_ai_tools_trials_v1` (result + language + timestamp, capped at 12 000 chars) so a visitor can reopen the saved result. Mock answers never consume the trial. Real cost protection is server-side: `AI_DAILY_LIMIT=200` plus `aiLimiter` (30 requests / 10 min / resolved visitor).
- `ad-image-review` sends one picture. The browser compresses it to ≤850 000 chars with a `FileReader` (**not** `URL.createObjectURL`, the CSP blocks `blob:` images) and downscales to 1280 px / JPEG. The route accepts ≤1 000 000 chars, the service caps at 950 000, and only vision providers (`VISION_PROVIDERS`) are tried.
- `express.json({ limit: '1mb' })` is enough for the compressed image; do not raise it just for this tool.
- Results are copyable and downloadable (download uses a `data:` URL, not a blob, for CSP safety).
- Entry points: desktop header (from `xl`), mobile menu, footer and the AI services banner on the home page. `/ai-tools` is in `scripts/generate-sitemap.mjs` (14 URLs total in the generated sitemap).
- Header breakpoints matter: the desktop nav/actions start at `xl`, the violet "digital services" link and the phone number text start at `2xl`. Before that, FR/EN labels made the header overflow horizontally at 1024–1440 px.

## Landing-page generator (13th seller tool, 2026-11-19)

- New card `landing-page` in `src/app/data/aiTools.ts` (Rocket icon, `create` stage, `needsImage: true`); `contact` is required so the generated CTA can link to `wa.me` or `mailto` (phone numbers are normalised to international format).
- The seller uploads a product photo (PNG/JPG/WebP, compressed client-side to ≤850 000 chars / 1280 px JPEG). **The photo is never sent to the AI provider** for this tool — it stays in the browser and is embedded directly into the exported HTML. Other image tools still send their image.
- Server: `landing-page` was added to `AI_TOOLS`, `TOOL_FIELDS` and `REQUIRED_FIELDS`; `buildGrowthPrompt()` asks for 15 fixed sections and the global prompt now enforces proofreading, short formal Arabic (max 18 words/sentence), no invented facts/placeholders, no repeated words or doubled labels, and no description of the photo. Output cap raised 8000 → 12000 chars.
- Browser: `src/app/utils/landingPage.ts` parses the English/Arabic/French headings, then `buildLandingPageHtml()` composes a self-contained responsive RTL/LTR page (SEO/meta, hero with the uploaded photo, price chip, problem/solution, benefits, audience, included, steps, offer, guarantee, social proof, FAQ, final CTA, trust strip, microcopy, footer). All values are HTML-escaped; a raw-text fallback page is used if the answer cannot be parsed.
- Preview is a sandboxed iframe using `srcDoc` (`sandbox="allow-popups allow-popups-to-escape-sandbox"`), so the strict site CSP needs no `frame-src` change. Download uses a `data:text/html` URL with the product name as filename (no `blob:`, which the CSP blocks). The result tab shows the raw AI text and a text download.
- The trial is saved without the image; after a reload the preview and download still work, but an explicit warning asks the seller to re-upload the photo. The gate is unchanged: guest 1/tool, signed-in 1 extra preview, subscriber unlimited within `aiLimiter`.
- Deployed: backend prompt `c6e9fa9` → `6239c97` → `d531ed9`; frontend `4c2a70b`. Vercel bundle `index-Cl2tlTky.js` live, `/ai-tools` title "13 أداة ذكاء اصطناعي".
- Production verification (2026-11-19): upload + 8 fields + generate returned 200 in **11.6 s**; preview contained 10 sections, 6 FAQs, the embedded JPEG (165 KB data URL), 4 WhatsApp links, the exact price, no scripts and no placeholders; downloaded `.html` was 184,510 chars and rendered the same page; trial survived reload; no new console/CSP errors (only the known Vercel toolbar script CSP notice and the expected 401 from `/api/subscription/me` for guests). QA consumed the landing-page free trial in the owner's test browser.

### Visual system and real 3D (2026-11-19 follow-up)
- Five complete art directions live in `src/app/utils/landingThemes.ts`: `aos` (store identity, emerald/gold), `noir` (black/gold luxury), `aurora` (vivid gradient), `editorial` (clean magazine), `neon` (futuristic grid/glass), plus `auto` (deterministic pick from product name + details). A style picker appears both in the form and above the saved result, so a style can be changed without regenerating; the choice is persisted in `LandingMeta.theme` and the trial record.
- The exported page now contains pinned CDN scripts: `three@0.160.0`, `gsap@3.12.5` + ScrollTrigger (jsDelivr) and Google Fonts (Cairo / Inter / Playfair). The inline scene builds a distorted glowing sphere, wireframe shell, two orbiting rings, a particle field and the seller's photo as a floating 3D card; pointer parallax + GSAP scroll-scrub animate it, rendering pauses when the tab is hidden, DPR is capped at 2, and `prefers-reduced-motion` / missing WebGL / blocked CDN fall back to the CSS-only composition. CSS 3D tilt, glass panels, reveal-on-scroll and a single `<h1>` are shared by all themes.
- In-app preview changed from `srcdoc` to a dedicated same-origin route `/landing-preview.html`: `public/landing-preview.html` receives the generated HTML via `postMessage` (target `*`, because the sandbox gives the frame an opaque origin) and writes it into its own document. The iframe uses `sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"`; a `key` derived from the HTML hash remounts it when the style or result changes.
- `vercel.json` gives that one route its own CSP (`script-src 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com`, Google Fonts, `frame-ancestors 'self'`, no `X-Frame-Options`) and excludes it from the global header via `/:path((?!landing-preview).*)`; the global CSP gained `frame-src 'self'`. Verified in production: `/ai-tools` gets exactly one strict CSP with `frame-src 'self'`, `/landing-preview.html` gets exactly one permissive CSP, and inside the preview frame `typeof THREE === "object"` and `typeof gsap === "object"`.
- Production verification of this update: 6 style chips, switching to `neon` updated the iframe to `data-theme="neon"` and persisted `meta.theme`, downloaded file was 39,285 bytes with 4 scripts / 10 sections / WhatsApp CTA, no console errors. Local QA rendered all five themes with the same copy and confirmed visibly different art directions and a working WebGL canvas under `prefers-reduced-motion: no-preference`.

### Mobile image upload fix (2026-11-19)
- Upload errors are no longer only a disappearing toast: `imageError` state renders a persistent `role="alert"` block directly under the upload box and scrolls it into view after a 300 ms delay (later than the tool-focus scroll), so the message is readable on a phone.
- `compressImage` now recognises HEIC/HEIF by MIME type or extension, **tries to decode it first** (Safari can), and only then shows a specific Arabic/FR/EN message telling the seller to save the photo as JPG. Other errors now have distinct messages for unsupported type, empty file, >15 MB, and a photo that cannot be compressed enough.
- A second iOS fix (`e7dfa54`): the decoder now prefers **`createImageBitmap(file)`** and only falls back to `FileReader` data URLs when it is unavailable. A large PNG (e.g. an iPhone screenshot, 666×635 / 2.2 MB) could fail silently as an `<img src="data:...">` on iOS because of the data-URL length limit; decoding the `File` directly avoids that. The final compressed JPEG data URL is ~350 k chars. Verified on production mobile with a 1.4 MB PNG.

## Site-factory template motion (2026-11-19)
- All ~91 site templates were effectively static: `server/src/site-factory/render/styles.ts` ended with a global "No motion - all templates" block that forced `animation:none!important`, killed image/card transforms and pinned `[data-reveal]` visible. That block plus the card hover-kill rules were **removed** (`2537d67`), so the existing motion layer (kenburns, float, shine, gradient, pulse and reveal-on-scroll) now runs.
- Added a cinematic 3D layer shared by every template: `.hero` defines `--hx/--hy/--depth` defaults; `.hero-grid` has perspective; `.hero-media` is a `preserve-3d` tilted card with float + shine and a clipped rounded frame; the floating trust card and hero image get `translateZ`; the backdrop has a rotating gradient ring; and `client.ts` injects three CSS-only floating 3D orbs (`.hero-stage` / `.hero-orb3d`) and applies pointer parallax to the CSS variables with rAF easing. Cards now lift/tilt gently on hover.
- Performance/accessibility: no CDN or external script added to generated sites (they must work offline), parallax only runs on non-touch desktop widths >720 with no `prefers-reduced-motion`, and the reduced-motion media query keeps the page static. Mobile keeps the orbs but drops the tilt.
- **Product cards stay still (`b9c8569`)**: at the owner's request the hover tilt and reveal motion were removed again from `.product-card`, `.fleet-card`, `.car-card`, `.property-card`, `.room-card`, `.course-card`, `.bistro-dish`, `.boutique-card` and `.digital-card` (including their thumbnail zoom and add-button). Only `.work-card` keeps the subtle hover tilt; the hero/3D motion is unchanged.
- Template previews are static files generated at build time by `vite.config.ts` → `renderTemplateDemo()`, so deploying the frontend updates `/templates/<slug>/` on Vercel; the same renderer on Render serves customers' published sites. Verified production CSS/JS contain the motion layer, and the Render auto-deploy of `2537d67` completed.

## Profit Calculators (`/ai-tools/calculator`)

- Vercel rewrites `/ai-tools/calculator`, `/AI-tools/Calculator` and `/calculators` to `/index.html` with `no-store`; `App.tsx` detects them through `readCalculatorRoute()` and lazy-loads `src/app/components/ProfitCalculator.tsx`.
- Five client-side calculators, all in `CALCULATORS` inside that file: full product profit (`full`), product pricing (`pricing`), order cost (`orderCost`), ad ceiling (`adCeiling`) and monthly goal (`monthlyGoal`). No API call and no AI cost — the math runs in the browser.
- The full calculator reproduces the reference numbers: with 1600 / 4900 / 30 000 / 100 orders / 70 % / 65 % / 150 / 80 / 200 it shows **2,303 DZD net per delivered order**, 47 % margin and 659 DZD ad per delivered order. Formula: `confirmed = orders × confirm`, `delivered = confirmed × delivery`, `returns = confirmed − delivered`; costs use `delivered` for product/confirmation/packaging and `returns × returnCost` for returns.
- Saving requires a signed-in customer: the results are stored per user in `localStorage` under `aos_calc_saved_v1_<userId>` (max 20), with restore/delete and a "sign up free / I have an account" prompt that opens the existing `LoginPage` overlay. It is per-browser only — move it to the server when the account area gets its own API.
- Entry points: green banner at the top of `/ai-tools`, footer quick links, and the sitemap. The page is RTL/LTR aware (ar/fr/en) and has no horizontal overflow at 1295 px.

## Current Session
Session on 2026-11-18: the AI subscription gate was proven end-to-end on production with a temporary customer account, the guest-trial counter bug was fixed, and the tools page now shows the active subscription instead of the upgrade banner. The test account and its paid receipt row were deleted afterwards.

## Technical Decisions Recorded
1. **Hybrid Platform**: Combine e-commerce with website factory - different teams use the same API but separate endpoints for isolation
2. **Security First**: Multiple rate limiters per endpoint, security monitor on every request, strict CSP
3. **Render Optimized**: Keep-alive during business hours only to respect free tier limits
4. **Order Hardening**: Status events + stock restoration tracking to prevent inventory bugs
5. **Differential CORS**: Wildcard for site-factory previews (unauthenticated), strict for authenticated API

## Known Problems
1. **Render sleep mode**: Mitigated by keep-alive pings during business hours only
2. **Legacy database compatibility**: Fixed via runtime SQL migrations at boot
3. **Mojibake in settings**: Auto-repaired on startup, logged for tracking

## Last Working Session
2026-11-18 — AI providers + Premium Services.
- Added OpenRouter provider with fallback chain, `OPENROUTER_API_KEY` in Render env, `AI_TIMEOUT_MS`.
- Rebuilt `/premium-services` as a Vite route (`3b4b588`), removed the dead Next.js page (`48035e1`), added Vercel rewrites + sitemap entry.
- Verified locally: typecheck + build pass; QA on `localhost:5173/premium-services` shows h1, 15 cards, 4 category sections, RTL, prices, expandable tiers, no margin leak.
- Production deploy confirmed: `https://aos-tech.store/premium-services` → 200, 15 cards, 4 sections, RTL, no console errors, no horizontal overflow at 390 px, ar/fr/en all render (`ac643c9`, `6e5df6d`, `bcee2f5`).
- Discoverability fixed: footer quick link + link in the AI services banner (`ac643c9`); sitemap.xml has 11 URLs and robots.txt references it.
- Language switch now refreshes `document.title` immediately (`6e5df6d`), and `#premium-list` is a known anchor so the "browse services" CTA scrolls instead of being treated as a 404 (`bcee2f5`).
- OpenRouter proven in production: a real `/api/ai/generate` call took 3.6 s and OpenRouter usage rose from `0.0001843` to `0.0004173` USD — the Render server is using `anthropic/claude-haiku-5.5`.
- Temporary Render API key `aos-openrouter-setup` was revoked (API returned 401 afterwards) and its local copy deleted.
- Phone numbers are wrapped with `dir="ltr"` in the header, footer, contact, FAQ, about and announcement bar so Arabic RTL no longer reverses the groups (`0bd08f1`).
- Premium Services is now a gold link in the desktop header (right after Contact/order tracking) and in the mobile menu, plus the footer and AI banner. The header container widens at `2xl` so the longer menu stays on one line.
- The header phone chip is a `tel:` link, and the number text is hidden below `xl` to keep the menu from overflowing (icon stays).
- Removed the hero badge "خدمات مكتبية وإعلام آلي" at the user's request (`3ad3520`). The hero now starts with "مرحباً بكم في / AOS Tech Store"; verified on production with no console errors.
- Announcement bar now says free delivery over **8000 DZD** and cash on delivery in **69 wilayas** (was 5000/58). The same numbers were aligned in the product trust badges, product page (FR), testimonials, product SEO text, the Vercel `api/product-page` description, and the server/client delivery defaults (`af655b9`). The live `aos_site_settings` already had `freeThreshold: 8000`; verified on production.

## Last Working Session
2026-11-18 - 12 seller AI tools.
- `/ai-tools` added as a real Vite route with 12 tools in 3 stages, one free trial per tool, copy/download of results and ad-image analysis (`d6e44f2`).
- Server: `AI_TOOLS` grew from 3 to 15, per-tool field whitelists and required lists, new growth prompts, `image` input with `image_url` support in `callProvider`, prompt cap raised to 5000 chars.
- Production API verified on Render after its auto-deploy: `product-check`, `plan`, `campaign-doctor` and `ad-image-review` all returned real Claude answers; `ai_missing_fields` / `ai_image_required` / unknown-tool 400s behave.
- **Bug 1 (production):** the site CSP (`img-src 'self' data: https:`) blocked `blob:` URLs, so the ad-image upload silently failed. `compressImage` now reads the file with `FileReader` and the download link uses a `data:` URL (`68362be`).
- **Bug 2 (production):** with FR/EN labels the header overflowed horizontally at 1024–1440 px (nav 851 + actions 524 + logo 48 > 1232). The desktop nav/actions now start at `xl`, the mobile menu/actions hide below `xl`, the violet digital link and the phone number text start at `2xl`, and the actions gap shrank at `xl` (`c09dbb0`).
- Contrast: small `text-primary` labels on dark cards were 2.5:1, now `text-sky-700 dark:text-sky-300` (`f8abdc0`); Lighthouse on `/ai-tools` scores accessibility 0.96, best-practices 1.0, SEO 1.0, and the main content has no remaining low-contrast text.
- Verified on production: `/ai-tools` 200, 12 cards, 3 sections, RTL, ar/fr/en, no console errors, no horizontal overflow at 1295 px (AR/FR/EN), header + footer + AI banner links visible, free trial survives a reload, sitemap includes `/ai-tools`.

## Last Working Session
2026-11-18 — profit calculators (`3f28f85`).
- Added `/ai-tools/calculator` with five calculators matching the reference screenshot: product profit, pricing, order cost, ad ceiling, monthly goal. The full calculator returns 2,303 DZD net / 47 % margin / 659 DZD ad per delivered order for the reference inputs.
- Results can be saved to the signed-in customer's local space (`aos_calc_saved_v1_<userId>`, max 20) with restore/delete; signed-out visitors get the "sign up free / I have an account" prompt that opens `LoginPage`.
- Wiring: new lazy route + `readCalculatorRoute()` in `App.tsx` (title, 404, announcement bar, footer), rewrites and `no-store` headers in `vercel.json`, sitemap entry, footer link and a green banner on `/ai-tools`. The 12 AI tool cards and their trials are unchanged.
- Verified locally: typecheck + build pass; the five tabs compute, editing an input updates the result live, the login overlay opens from the save card, and FR/EN render with no horizontal overflow; `/ai-tools` still shows 12 cards plus the calculator banner.

## Last Working Session
2026-11-18 - AI subscriptions and paywall (deployed; live gate test pending).
- Server data: `Subscription`, `SubscriptionPayment`, `AiUsage` and `SavedCalculation` models in `server/prisma/schema.prisma`; Render applies them with `prisma db push` at boot.
- Server logic: `server/src/services/subscription.ts` has the three plans (1 900 / 4 900 / 17 900 DZD), activate/extend, `resolveAiAccess`, `recordAiUsage`, Chargily Pay v2 checkout, HMAC-SHA256 webhook verification and manual CCP/BaridiMob details from the site-factory settings.
- Server routes: `routes/subscription.ts` (plans, me, checkout, receipt proof, Chargily webhook, admin payments/confirm/reject/grant/cancel) and `routes/calculator.ts` (server-saved results, max 20 per account). `optionalAuth` was added; the webhook gets `rawBody` from the JSON verifier; `aiLimiter` is 30 / 10 min / IP and `checkoutLimiter` 20 / 15 min.
- Receipt uploads are validated server-side as `data:image/(jpeg|jpg|png|webp);base64` only, so an admin cannot be sent to a `data:text/html` page from the payments table.
- Gate: guest = 1 free answer per tool per IP / 30 days; signed-in = 1 extra preview in total (`403 ai_login_required` / `402 subscription_required`); active subscription = unlimited within `aiLimiter`. Mock answers do not consume usage. `app.set('trust proxy', isTrustedProxy)` resolves the real client IP behind Render/Vercel.
- Storefront: `/subscription` (Vite route + rewrites/no-store, sitemap, footer link) shows the three plans, Chargily / CCP / BaridiMob, receipt upload (canvas-compressed data URL), account status and payment history. It has a retry state if the plans API is unreachable.
- `/ai-tools` now uses `useAuth` + `/subscription/me`: the guest paywall opens `LoginPage`, the account paywall links to `/subscription`, and the last-preview result shows the subscribe CTA. `/ai-tools/calculator` saves results to the server and migrates the old localStorage rows once per account.
- Admin: new "AI Subscriptions" tab (`SubscriptionAdmin.tsx`) lists pending/paid payments, opens receipts, activates/rejects them, grants a plan by email and cancels an active subscription.
- Env: `CHARGILY_SECRET_KEY`, `CHARGILY_MODE`, `CHARGILY_WEBHOOK_SECRET` and `AI_IP_SALT` documented in `server/.env.example`. Register `https://aos-tech.store/api/subscription/chargily/webhook` in Chargily after the keys are set.
- Deployed as `5305de3`. Production verified: `/subscription` 200 with RTL hero and the three prices (1,900 / 4,900 / 17,900), `/api/subscription/plans` 200 with `chargily:false`, `/api/subscription/me` 401 for guests, `/api/calculator/results` 401, unsigned Chargily webhook 401 ("Invalid signature"), sitemap contains `/subscription`, no console errors. The checkout panel opens on a plan click, offers CCP/BaridiMob, and its "sign in to continue" button opens the login overlay. `/ai-tools` shows the post-trial gate card with the login and plans buttons.
- Local checks: `npm run typecheck`, `npx tsc --noEmit` in `server`, `npm run build`, visual QA with a mock plans API.

## Last Working Session
2026-11-18 - subscription gate proven end-to-end (production).
- Created a temporary verified customer with a disposable inbox, then walked the real gate: guest first answer 200, guest second answer 403 `ai_login_required`; signed-in preview 200 (`previewRemaining: 1`), next answer 402 `subscription_required`; manual CCP checkout created a `pending` payment with reference `AOS-SUB-...`, a valid image receipt was accepted and a `data:text/html` receipt was rejected 400; activation produced `active` monthly until 2026-12-18, payment became `paid`, and two further AI calls returned 200 with `subscribed:true`.
- **Bug fixed:** the guest counter never blocked because `req.ip` resolved to a rotating Cloudflare/Vercel edge address, so every guest row was stored under a new hash. Guests are now keyed by an `httpOnly` `aos_guest` cookie, falling back to the real client address from `x-vercel-forwarded-for` / `cf-connecting-ip`; the first cookie-less answer also seeds the IP bucket, so dropping cookies does not mint trials (`b3f5d10`, `9434706`).
- The tools page now renders a "مشترك" badge and an active-subscription banner ("اشتراكك نشط — كل الأدوات مفتوحة" / manage subscription) for subscribed customers instead of "تمّت التجربة" and the upgrade banner (`3494213`).
- Also verified: a customer token gets 401 on the admin payments endpoint, Chargily checkout returns `chargily_not_configured` while keys are absent, and `/api/calculator/results` save/list/delete round-trips for a signed-in account.
- Admin UI verified in the browser with a temporary `ADMIN` account (mandatory 2FA, password + TOTP): the "AI Subscriptions" tab lists pending payments; **Activate** changed the payment to `paid`, added a `quarterly` subscription until 2027-02-18 and showed the activation toast; the customer then saw `active` on `/subscription/me` and unlimited AI (200 `subscribed:true`). **Grant manually** by email and **Reject** also worked, and the Paid filter showed the receipt.
- **Bug fixed:** the receipt "View receipt" link used a `data:image/...` `href`, which Chrome blocks as a top-level navigation and opened an empty tab. It now opens a proper dialog with the image inside; close works by button, backdrop or Escape (`d023ed1`).
- All temporary QA accounts (40 users created during the provisioning loop), payments, subscriptions and temporary endpoints were deleted; the cleanup call returned `deleted:40`, then `deleted:0`.

## Security review (recon attempt against the live site)
- A third-party recon transcript was reviewed defensively. Findings: only Vercel edge ports 80/443, no exposed `.env`/`.git`/`vercel.json`, strong CSP on the storefront, strict origin allowlist with credentials on the Render API, and no secrets in the JS bundle.
- The `boot-guard.js` script is only a post-deploy asset-reload helper, not a bot challenge.
- Google Forms `formResponse` is a secondary order-notification sheet; spam there does not create server orders (real orders go through the rate-limited `/api/orders` proxy). It is inherent to Google Forms and cannot be server-rate-limited from our side.
- The `aos-api-production.up.railway.app` origin was dead (`Application not found`) but still listed in both CSPs and used as the admin live-feed fallback (`aeee887`). Removed from CSP and switched the live feed to the live Render Socket.IO endpoint, which was verified responding.
- The `access-control-allow-origin: *` seen on the static Vercel response applies to public assets, not authenticated API routes; the API only reflects allowlisted origins (or none for disallowed ones).

## Security session 2026-11-19 - edge block, IP attribution and API verification
- A Kali/curl recon pass tripped the Vercel Security Checkpoint (`X-Vercel-Mitigated: challenge`, `Retry-After: 30`): every `/api/*` call from curl/PowerShell returned 403 with an HTML challenge body, including `/api/health`. Browser fetches from the real site returned the expected results, so those 403s were not authorization failures.
- API status verified from the browser: `/api/health`, `/api/products`, `/api/products/status`, `/api/maintenance`, `/api/ai/status`, `/api/email/config-status`, `/api/site-factory/public/config`, `/api/data/aos_site_settings`, `/api/data/aos_site_content`, `/api/subscription/plans` -> 200; `/api/customers`, `/api/orders`, `/api/auth/me`, `/api/security/events`, `/api/subscription/admin/payments` -> 401; `/api/snapshots/run` -> 403; unknown routes -> 404; `OPTIONS /api/products` -> 200 with `Allow: GET,HEAD`; `PUT`/`DELETE /api/health` -> 404.
- A garbage bearer token returns `401 {"error":"Invalid or expired token"}` on every protected route, so signature verification is active.
- Helmet headers on API responses: HSTS `max-age=63072000; includeSubDomains; preload`, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, CSP and `Cross-Origin-Resource-Policy: same-origin`. No `Access-Control-Allow-Origin` on same-origin calls.
- Site settings scan: 231 + 154 scalar values in `aos_site_settings` / `aos_site_content`, none matching secret/token/password/chargily/smtp/api-key/private/webhook.
- JS bundle (`assets/index-BssOksFS.js`, 663 KB): no API keys, private keys or service-role strings; only `/api/contact` appears as a literal path because the API base is configurable. Source maps are 403.
- **Bug fixed:** `clientIp()` used `req.ip`, which stops at the first public hop (the Cloudflare edge, e.g. 104.22.160.12). A `sensitive_path` alert from our own probe therefore auto-blocked a shared edge address instead of the visitor. `clientIp()` now uses `resolveClientIp` (`x-vercel-forwarded-for` -> `cf-connecting-ip` -> right-most public XFF, only when the socket is a private proxy hop), and `sensitive_path` probes alert without auto-blocking (`2179f82`).
- Verified live with a temporary probe: `req.ip` was `104.22.160.48` while `resolveClientIp` returned the visitor's `x-vercel-forwarded-for` address. The probe was removed in `0d4eddb`; it now returns 404 and `/api/health` is 200 on the new deploy.
- Admin guard review: `requireRole('SUPER_ADMIN','ADMIN')` on contact/customers/reviews/orders admin routes; `requireAuth + requireRole` on the whole security and snapshot routers; `site-factory/admin` guarded; every subscription admin route guarded. `requireAuth` re-reads role, `isActive` and `tokenVersion` from the database on each request.
- Deliberately not tested on production: CORS preflight from a foreign origin (browsers cannot set `Origin`; the earlier curl evidence and the allowlist code cover it), rate-limit thresholds (tripping them would 429/block the owner's own IP), and a full customer-vs-admin token matrix (no customer account exists after the QA cleanup).

## Visitor counter (2026-11-19)
- New `SiteVisit` model (`day` + `visitorHash`, unique per day) in `server/prisma/schema.prisma`; the raw IP is never stored.
- `server/src/routes/visits.ts`: `POST /api/visits/track` records one visit per browser per day (httpOnly `aos_vid` cookie, salted hash using `AI_IP_SALT`) and returns `{ visitors, today }`; `GET /api/visits/stats` returns the same totals. Obvious bots are filtered, a cookie-less guard allows one visit per IP/day, and a 30/min per-visitor limiter stops script inflation.
- `src/app/components/VisitorCounter.tsx` shows the total and today's count in the footer bottom bar (AR/FR/EN). It respects Do Not Track by reading `/stats` without recording. The admin overview's Customers card shows today's and total visitors via `api.visits.stats()`.
- `VISIT_BASE_COUNT` (optional, default 0) adds a historical offset to the public total; documented in `server/.env.example`.
- Deployed as `0d399e3`; production verified: the first `POST /api/visits/track` returned `{ visitors: 1, today: 1 }`, a second call with and without the cookie stayed at 1, `/api/visits/stats` returned 200, and the footer rendered "1 زائر · اليوم 1" after the Vercel bundle `index-DYJb4bYS.js` went live.
- Follow-up: the older rate limiters still use the default `req.ip` key, which is the shared Cloudflare edge behind Vercel; only `visitLimiter` uses `resolveClientIp`. Consider switching the AI/checkout limiters too if traffic grows.

## Backup encryption + Render environment (2026-11-19)
- Set on Render (aos-api) through the dashboard: `BACKUP_ENCRYPTION_KEY` (64 hex chars), `AI_IP_SALT` (64 hex chars, so visitor/guest hashes no longer fall back to `JWT_SECRET`) and `BACKUP_AUTO=true`; saved with "Save, rebuild, and deploy".
- Boot logs confirmed the scheduler: `[Backup] Next automatic backup at 2026-11-20T03:00:00.000Z` and the stale-state catch-up `[Backup] Post-boot catch-up: stored aos-backup-2026-11-19T09-10-16-711Z.json.gz.enc (40538 bytes)` under `/opt/render/project/src/server/backups/`. The admin panel can now show encryption on and download a fresh encrypted copy.
- Render Free has an ephemeral disk: the daily file disappears on redeploy/restart. Download it from the admin panel, or set `BACKUP_GITHUB_REPO` + `BACKUP_GITHUB_TOKEN` (fine-grained, Contents: Read and write) for the off-server GitHub destination. The backup is AES-256-GCM (scrypt) encrypted before it leaves the process; keep `BACKUP_ENCRYPTION_KEY` outside the server (password manager) or the file cannot be restored.
- **Key is now saved outside Render (2026-11-19):** read from the Render dashboard *Export → Download .env*, extracted, validated as 64 hex chars and stored DPAPI-encrypted at `C:\Users\PC\AppData\Local\AOS-Secrets\BACKUP_ENCRYPTION_KEY.enc` (ACL limited to `DESKTOP-ALF6BCL\PC`). `Get-AosBackupKey.ps1` in the same folder copies it to the clipboard; `README.md` has the manual decrypt command. The plain `.env` export was deleted from Downloads immediately after extraction. The value itself is intentionally **not** recorded in the repo or chat.
- `.env.example` now documents `BACKUP_ENCRYPTION_KEY`, `BACKUP_AUTO`, `BACKUP_HOUR_UTC`, `BACKUP_DIR`, `BACKUP_KEEP` and the GitHub destination.
- All API rate limiters now key on `resolveClientIp` instead of `req.ip` (`2136f04`). `req.ip` is the shared Cloudflare/Vercel edge, so the old keys let one visitor exhaust a limit for every visitor on that edge — registration was only 5/hour for the whole edge. Verified after deploy: `/api/health` 200, `/api/visits/stats` 200, two `POST /api/visits/track` calls from the same page both returned the same totals (dedupe intact), and the footer rendered the count.

## nmap assessment (2026-11-19)
- `nmap -A aos-tech.store` from the owner's Kali box resolved the Vercel edge (216.198.79.1): only 80/tcp and 443/tcp open, 998 filtered. Port 80 answers 308 to HTTPS; 443 serves a Let's Encrypt certificate for `aos-tech.store` (RSA 2048, valid 2026-11-09 -> 2027-02-07) and the Vercel Security Checkpoint (403, `X-Vercel-Mitigated: challenge`) for non-browser clients.
- The OS guesses (VirtualBox/Slirp/QEMU) are meaningless for an anycast edge; nothing on the origin is exposed. `www.aos-tech.store` has its own valid certificate and 308-redirects to the apex.
- No action needed. Aggressive scans against production only extend the challenge; use a staging copy for deeper recon.

## Last Working Session
2026-11-19 — 13th AI tool: complete landing-page generator.
- Built the image→full-page flow: photo stays in the browser, AI writes structured copy, `src/app/utils/landingPage.ts` assembles a self-contained HTML page, sandboxed live preview + `.html` download.
- Server prompt commits `c6e9fa9`, `6239c97`, `d531ed9`; frontend commit `4c2a70b`. Both auto-deployed (Render + Vercel `index-Cl2tlTky.js`).
- Real production generation with a car-vacuum photo: 200 in 11.6 s, 10-section preview, 6 FAQs, embedded photo, working WhatsApp CTA, no scripts/placeholders; downloaded HTML verified; reload restored the saved result and showed the expected "re-upload photo" warning.
- Local checks: frontend and server `npx tsc --noEmit`, `npm run build`; real API responses checked for duplicate words and label repetition before the final prompt tweak.
- Remaining owner actions are unchanged (backup key, Chargily keys, CCP/BaridiMob details); the landing-page free trial was consumed in the test browser, so use another browser/profile or sign in for the extra preview if you want to try generation again.

## Next Step
1. The key is saved outside Render (`C:\Users\PC\AppData\Local\AOS-Secrets\BACKUP_ENCRYPTION_KEY.enc`). Still download the encrypted backup file itself from the admin panel (or Render Shell) before the next deploy/restart and keep both together; Render's free disk is wiped on redeploy.
2. If Chargily keys are available, set `CHARGILY_SECRET_KEY`, `CHARGILY_MODE` and `CHARGILY_WEBHOOK_SECRET` on Render and register `https://aos-tech.store/api/subscription/chargily/webhook`; otherwise keep CCP/BaridiMob + manual activation.
3. Fill the CCP/BaridiMob account fields in the site settings so the payment panel shows real details instead of only WhatsApp.
4. Add subscription status to the account area (optional) so customers see the renewal date without opening `/subscription`.
5. Run further recon on a staging copy, or temporarily allowlist the scan IP in Vercel Project -> Firewall. Looping `curl` against production only extends the Security Checkpoint.
6. Set `VISIT_BASE_COUNT` on Render if the public visitor counter should start from a historical total (default 0).
7. Optional: configure `BACKUP_GITHUB_REPO` / `BACKUP_GITHUB_TOKEN` so the daily backup leaves Render instead of landing on the ephemeral disk.

Optional follow-ups:
1. If Claude Sonnet is preferred, set `AI_MODEL=anthropic/claude-sonnet-5.5` on Render and redeploy.
2. `/ai-tools`, `/ai-tools/calculator`, `/premium-services` and `/subscription` still get their titles/meta from client-side JS only; a prerender step would give crawlers the exact per-page title.
3. `aiLimiter` is now 30 requests / 10 min / IP; watch Render logs for 429s.
4. Keep an eye on the OpenRouter `limit` ($5 lifetime) via `GET https://openrouter.ai/api/v1/key`.


## Last Working Session (2026-11-21)
Typography-only refresh, per the owner's explicit direction: keep the existing layout, colours and motion; change the writing face and remove small tells of machine-generated UI.
- Fonts: self-hosted IBM Plex Sans Arabic (UI, AR/FR/EN) + Bricolage Grotesque (Latin display). Templates load the same families from Google Fonts; per-template palettes and the hero motion layer were deliberately left intact.
- AI-tell cleanup: no gradient text, violet/fuchsia blocks, multicoloured buttons, "New" badges, coloured blur blobs or tracked uppercase labels on the public pages; one blue accent remains. The hero particle backdrop, marquee and template hero animation are unchanged.
- Fix: template previews no longer use inline onclick attributes (CSP); the to-top handler lives in assets/site.js, and the offline page's retry is a plain link.
- Routes: /Subscribe, /Abonnement, /Calculators rewrites added alongside the lowercase versions. Account dashboard shows subscription status; per-route SEO shells are generated at build time.
- QA: typecheck + build pass; 92 templates / 1104 preview files. Local preview shows fallback demo products only because the dev proxy has no backend; production API data was checked and is unchanged.
- Note: an earlier broad styling sweep was reverted in full — do not reapply whitespace-collapsing passes across src/app/components.

- Template product imagery made static at the owner's request: hero product shot, its floating badge and every catalogue/commerce card now have animation/transform/transition disabled; ambient hero motion (orbit, orbs, shine) is unchanged.


## Security documentation cleanup (2026-11-21)
- Removed the generated SECURITY_HARDENING.md and security-test.js: they contained inaccurate claims and a test script with broken result logic. Also removed start-dev.bat (called a dev:https script that no longer exists) and reverted unrequested dev/color edits from package.json and theme.css.
- Added SECURITY_NOTES.md with only protections verified in server/src/index.ts (Helmet CSP, proxy-aware IP resolution, per-endpoint rate limits, CORS allowlist, HPP), JWT/bcrypt/role guards, and the deliberate limitations. It does not claim a clean pentest.


## Session 2026-11-22 - hero heading + header login control
- Hero: widened the text column, made the headline fluid `clamp(3.5rem, 10vw, 7rem)` so it tracks the viewport, and removed the centering cap so the text aligns to the right edge. Layout, palette and motion are otherwise unchanged (commits f006b98, 3fd7cc9, d71118d, f30b78f).
- Header: added a "تسجيل الدخول" (LogIn icon + label) link directly beside "إنشاء المواقع" from 2xl up; below 2xl the existing icon slot opens the same #account login. From 2xl the nav labels are 16px (were 14px) with 8px side padding and no inter-link gap; the secondary "الخدمات الرقمية" link appears from 1600px and the phone-number label from 1700px, so every nav label stays on one line at 1562px (owner's window); the phone icon still calls.
- Services: all six card photos (office services + the three digitization cards) now share the same hover zoom; the three lower cards previously had static images.
