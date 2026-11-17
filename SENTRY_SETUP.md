# Sentry Integration Setup Guide

## Quick Start

```bash
# 1. Create accounts and get DSN (if not already done)
# Visit: https://sentry.io/dashboard/
# Click "New project" to create a Next.js project
# Copy the DSN from Project Settings > Client SDK Configuration

# 2. Add your credentials
echo 'SENTRY_DSN="your-sentry-dsn-here"' >> server/.env.sentry-local
echo 'SENTRY_AUTH_TOKEN="your-auth-token-here"' >> server/.env.sentry-local

# 3. Build and upload source maps
npm run build
npx @sentry/wizard@latest -i nextjs

# 4. Verify integration
npm run dev # Check console logs for Sentry initialization
```

## Configuration Files Created

- `server/.env.sentry-local` - Local environment variables (never commit with real values)
- `sentry.config.ts` - Sentry SDK configuration
- `src/lib/sentry.ts` - Client-side initialization
- `src/lib/sentry.server.ts` - Server-side initialization
- `src/app/api/errors/route.ts` - Error proxy route for tunnel mode
- `src/middleware.ts` - Middleware with error reporting headers
- `src/lib/capture-error.ts` - Utility functions for error capture

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SENTRY_DSN` | Sentry project DSN | `https://xxx@sentry.io/000000` |
| `SENTRY_AUTH_TOKEN` | Auth token for source map upload | (from auth tokens page) |
| `SENTRY_ORG` | Organization name | `aostech-store` |
| `SENTRY_PROJECT` | Project name | `nextjs-app` |
| `SENTRY_TRACES_SAMPLE_RATE` | Transaction sampling rate (0-1) | `0.2` |
| `SENTRY_MASK_ALL_INPUTS` | Whether to mask all inputs in replays | `true`/`false` |

## Usage Examples

### Manual Error Capture

```typescript
// anywhere in your code
import { captureError } from '@/lib/capture-error';

try {
  // Some operation that might fail
} catch (error) {
  await captureError(error, {
    userId: 'user-123',
    routeName: '/login',
    userEmail: user?.email
  });
}
```

### Wrap Async Functions

```typescript
import { captureError } from '@/lib/capture-error';

export const fetchUser = async (id: string) => {
  try {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  } catch (error) {
    await captureError(error, { routeName: '/user/[id]' });
    throw error; // Re-throw for UI handling
  }
};
```

### Page-Level Error Tracking

```typescript
// src/app/dashboard/page.tsx
export default function DashboardPage() {
  useEffect(() => {
    // Automatically track this page's errors
    Sentry.configureScope((scope) => {
      scope.setTag('page', '/dashboard');
    });
    
    return () => {
      // Cleanup when unmounting
      Sentry.removeBreadcrumb();
    };
  }, []);

  return <div>Dashboard...</div>;
}
```

## Building for Production

Create a build script that uploads source maps:

```json
// package.json
{
  "scripts": {
    "build": "next build",
    "postbuild": "npx @sentry/wizard@latest -i nextjs",
    "dev": "next dev"
  }
}
```

Or use the Sentry CLI directly:

```bash
# Upload source maps manually
npx @sentry/wrangler upload-source-maps

# For Vercel deployments, set up Sentry in Vercel dashboard
# It will automatically build and deploy to Sentry
```

## Testing Sentry

1. **Generate a test error:**

```javascript
// In browser console (development) or create an error endpoint
throw new Error('Test error from AOS Tech Store');
```

2. **Check if errors appear in Sentry Dashboard:**
   - Visit your Sentry project URL
   - Look for the captured error
   - Verify source maps are uploaded correctly

3. **Verify tunnel mode (production):**
   ```bash
   curl -X POST http://localhost:3001/api/errors \
     -H "Content-Type: application/json" \
     -d '{"message":"Test from API","level":"error"}'
   ```

## Security Notes

⚠️ **Important:**
- Never commit `.env.sentry-local` with real values to Git
- The tunnel route (`/api/errors`) is only for development
- In production, use Sentry's recommended deployment setup
- Mask sensitive data in error reports (passwords, tokens, etc.)

## Troubleshooting

### Errors not showing in Sentry

1. Check `SENTRY_DSN` is set correctly
2. Verify `sentry.config.ts` has correct org/project names
3. Build the project and re-deploy
4. Clear Next.js cache: `rm -rf .next/`

### Source maps not uploading

1. Get an auth token from https://sentry.io/account/auth-tokens/
2. Add it to `SENTRY_AUTH_TOKEN` in `.env.sentry-local`
3. Re-run `npm run build` and check Sentry for the upload status

## Next Steps

- [ ] Set up DSN in Sentry Dashboard
- [ ] Build the project with source maps enabled
- [ ] Deploy to production (Vercel, Netlify, etc.)
- [ ] Configure alerting rules
- [ ] Set up teams and permissions
- [ ] Enable session replay (optional)
- [ ] Integrate with existing monitoring tools

## Resources

- Sentry Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- Next.js Sentry Guide: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- Getting Started: https://sentry.io/product/sentry-io/
- Support: https://community.sentry.io/
