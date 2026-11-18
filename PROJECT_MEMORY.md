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

## Current Session
Session on 2026-11-17/18: AI provider activation (Gemini + OpenRouter) and shipping the Premium Services page through the Vite app.

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

## Next Step
1. Confirm the Vercel production deploy (commit `3b4b588`) is Ready and `https://aos-tech.store/premium-services` returns 200 with the new bundle.
2. Confirm OpenRouter usage increases on a production generation (script `verify-openrouter-prod.mjs`). If it does not, the Render env var or deploy is stale.
3. Invalidate the temporary Render API key `aos-openrouter-setup` and delete `C:\Users\PC\AppData\Local\Temp\opencode\render-api-key.txt`.
4. Production QA of `/premium-services` (console errors, mobile width, ar/fr/en) and fix anything found.
