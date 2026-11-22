# AOS Tech Store — Security Notes

Short, verified summary of the protections that are actually implemented in this
repository. Checked against `server/src/index.ts`, `server/src/utils/jwt.ts`,
`server/src/middleware/auth.ts`, `server/src/utils/trustProxy.ts` and the route
guards. The two older reports (`SECURITY_AUDIT_REPORT.md`, `SECURITY-REPORT.md`)
keep the full history of earlier reviews.

## Implemented protections

- **Helmet + CSP** (`server/src/index.ts`): `default-src 'self'`; scripts from self
  and `va.vercel-scripts.com`; styles self, inline and Google Fonts; images self,
  `data:` and HTTPS; fonts self/`data:`/Google Fonts; connections limited to the
  app origin, the Render API and Google Docs; workers self + `blob:`; frames only
  Google map domains; `frame-ancestors 'none'`; HSTS 1 year with `includeSubDomains`
  and `preload`.
- **Proxy-aware client IP**: `app.set('trust proxy', isTrustedProxy)` and every
  limiter uses `resolveClientIp()`, so attacker-controlled public values in
  `X-Forwarded-For` are not trusted.
- **Rate limits** (per resolved client IP): auth 100/15 min, admin gate 20/15 min,
  password reset 10/15 min, registration 5/hour, orders and general API 600/min,
  contact 12/10 min, AI generation 30/10 min, checkout 20/15 min, snapshots 6/hour,
  visit tracking 30/min.
- **CORS**: allowlisted origins for `/api/*` (`isOriginAllowed`); wildcard CORS with
  no credentials only for the intentionally public site-factory preview endpoints.
- **HTTP Parameter Pollution** protection (`hpp()`) on the API.
- **Authentication**: JWT access and refresh tokens with separate expirations
  (`server/src/utils/jwt.ts`), a short-lived 2FA challenge token, bcrypt password
  hashing (cost 12, one registration path uses 13), and `requireAuth` /
  `requireRole('SUPER_ADMIN','ADMIN')` guards on administrative routes.
- **Data access**: Prisma queries (parameterized) instead of concatenated SQL;
  secrets live in Render/Vercel environment variables, not in the client bundle.

## Known, deliberate limitations

- Vercel's Security Checkpoint challenges non-browser clients (curl, scanners);
  this is expected edge behaviour, not an application vulnerability.
- Render's free tier can sleep; keep-alive/wake-up logic exists for business hours.
- The secondary Google Forms order notification cannot itself be rate-limited; it
  does not create server-side orders.

## Generated-site owner dashboards

- Each generated site can be given a **single-use sign-in link** to a dashboard
  hosted on `aos-tech.store` at `/site-admin` (the generated `pages.dev` bundle
  itself stays static and unauthenticated). Only a SHA-256 hash of the secret is
  stored on `Site.adminTokenHash`.
- Claiming the link rotates the token and bumps `Site.adminSessionVersion`, so
  the URL cannot be reused and every older dashboard session is revoked. The
  redirected URL no longer contains the secret.
- The session is a 12-hour JWT with the dedicated `aos-site-admin` audience,
  carried in an HttpOnly/Secure/SameSite=Lax cookie scoped to `/api/site-admin`.
  A normal user access token cannot be used for a site dashboard and vice versa.
- Every data query in `routes/siteAdmin.ts` filters by the `siteId` from that
  session; no route accepts a site id from the client. Content edits are
  whitelisted and only affect the owning site's `SiteRequest` / `SiteProduct` /
  `SiteOrder` / `SiteLead` rows. Sign-in, writes and publishing are rate-limited.
- The owner link is generated (or renewed) only from the AOS operator console;
  it should be sent to the client once, over a private channel.

## Scope note

This file documents the current code. It is not a pentest report and makes no
claim of zero vulnerabilities. Do not run aggressive scans against production;
use a staging copy or allowlist the scanner IP in Vercel first.

_Last verified: 2026-11-21_
