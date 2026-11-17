# Sentry Usage Guide - AOS Tech Store Developer Documentation

## Quick Start for Developers

### Step 1: Initialize Sentry in Client Components

Import the Sentry initialization function:

```typescript
import { sentryInit } from '@/lib/sentry';

export default function MyApp() {
  useEffect(() => {
    sentryInit(true); // Initialize client-side Sentry
  }, []);

  return <YourAppContent />;
}
```

### Step 2: Use Error Capture Utilities

**Capture Errors:**

```typescript
import { captureError } from '@/lib/capture-error';

try {
  await someAsyncOperation();
} catch (error) {
  await captureError(error, {
    userId: user?.id,
    route: pathname,
    userEmail: user?.email, // Sensitive data - use with caution
  });
}
```

**Performance Metrics:**

```typescript
import { capturePerformance } from '@/lib/capture-error';

await capturePerformance('pageLoad', {
  duration: performance.now(),
  url: window.location.href,
});
```

### Step 3: Server-Side Error Handling

For server components and API routes:

```typescript
// API Route Example
export async function POST(request: Request) {
  try {
    // Your business logic
  } catch (error) {
    console.error('[Server Error]', error);
    // Sentry will automatically capture this in production
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Common Patterns

### Wrapping Async Operations

Create utility functions for common async operations:

```typescript
// src/lib/wrapped-requests.ts
import { captureError } from '@/lib/capture-error';

export async function fetchWithSentry<T>(url: string, options?: RequestInit) {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Capture the HTTP error but don't crash
      await captureError(
        new Error(`HTTP ${response.status}: ${response.statusText}`),
        { url, method: options?.method }
      );
      
      throw new Error(response.statusText);
    }
    
    return await response.json();
  } catch (error) {
    await captureError(error, { url });
    throw error;
  }
}
```

### Session Tracking

Track user sessions for better context:

```typescript
import { setUserContext } from '@/lib/capture-error';

export default function UserPage({ userId, userName }: { userId: string; userName?: string }) {
  useEffect(() => {
    setUserContext(userId, {
      name: userName,
      lastActive: new Date().toISOString(),
    });
  }, [userId, userName]);
  
  return <UserContent />;
}
```

### Error Boundary Component

Create a reusable error boundary:

```typescript
// src/components/ErrorBoundary.tsx
'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export function ErrorBoundary() {
  const [error, setError] = useState<{ error: Error; componentStack?: string } | null>(null);

  useEffect(() => {
    const reportError = (errorObj: unknown) => {
      if (!error) {
        Sentry.captureException(errorObj);
      }
    };

    window.addEventListener('error', reportError);
    window.addEventListener('unhandledrejection', (event) => {
      event.preventDefault();
      reportError(event.reason);
    });

    return () => {
      window.removeEventListener('error', reportError);
    };
  }, [error]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded">
        <h2>Something went wrong</h2>
        <details className="mt-2 text-sm">
          <summary>Error details</summary>
          <pre>{String(error.error)}</pre>
        </details>
      </div>
    );
  }

  return null;
}
```

## Best Practices

### ✅ DO:

1. **Use `captureError` utility** for consistent error reporting with context
2. **Add relevant metadata** (userId, route, timestamp) to errors
3. **Avoid capturing sensitive data** in error messages (passwords, tokens, SSN)
4. **Wrap async operations** that might fail with try/catch + captureError
5. **Use Sentry's automatic tracking** for browser console errors and JS exceptions

### ❌ DON'T:

1. **Don't log credentials** to console or error messages
2. **Don't disable Sentry** in production builds
3. **Don't manually configure Sentry multiple times** (use the initialized SDK)
4. **Don't ignore error reports** - review them regularly in Sentry dashboard

## Environment-Specific Configuration

### Development

In development, Sentry runs with debug mode enabled:

```typescript
// Automatic when NODE_ENV === 'development'
debug: true; // Logs setup and configuration
sendClientReports: true; // Sends anonymized stats
```

### Production

Production automatically disables debugging and samples traces:

```typescript
tracesSampleRate: 0.2; // Only sample 20% of transactions
debug: false; // No debug logs
```

## Testing Sentry

To test error reporting:

1. **Create a test error in browser console:**
   ```javascript
   window.dispatchEvent(new Event('error'));
   // Or visit your app and intentionally break something
   ```

2. **Check Sentry Dashboard:**
   - Go to https://sentry.io/dashboard/
   - Navigate to your project
   - View the "Issues" tab for captured errors

3. **Verify source maps work:**
   ```bash
   npm run build
   # Source maps automatically uploaded via postbuild script
   ```

## Metrics and Monitoring

### Performance Monitoring

Sentry automatically tracks:

- API request durations
- Resource load times (first paint, time to interactive)
- Custom spans created via `startSpan()`

### User Feedback

Users can submit feedback reports directly in your app. Add a floating button or link that opens a modal for users to report bugs with screenshots.

## Updating Sentry Configuration

If you need to change Sentry settings:

1. Edit `sentry.config.ts` for SDK options
2. Update environment variables in `server/.env.sentry-local`
3. Rebuild: `npm run build`
4. Redeploy

---

**Remember:** Sentry is automatically capturing errors across your entire application. Focus on reviewing and fixing the reported issues in your Sentry dashboard rather than manual error handling in every component.
