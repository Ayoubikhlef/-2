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

## Current Session
Continued from previous work session (b1a3ad39). Main task: Complete project documentation by inspecting remaining files and updating memory system.

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
Session b1a3ad39 - Initial project inspection and core file mapping.

## Next Step
Document completed API route inspections in PROJECT_MEMORY.md, read remaining security files (SECURITY_AUDIT_REPORT.md if exists), review render.yaml/vercel.json deployment configs, then update TASKS.md to mark inspection complete.
