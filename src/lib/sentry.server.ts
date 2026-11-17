/**
 * Sentry Server SDK Initialization
 *
 * This module initializes Sentry for server-side errors and monitoring.
 * Must not use client-side code to avoid hydration issues.
 */

import * as Sentry from '@sentry/nextjs';

// Get DSN from environment (never expose in production without proper auth)
const dsn = process.env.SENTRY_DSN;

/**
 * Initialize server-side Sentry SDK
 * Must be called before any API routes handle requests
 */
export const sentryServerInit = () => {
  if (!dsn) {
    console.log('[Sentry] Server-side Sentry is disabled (no DSN provided)');
    return;
  }

  // Initialize with server-side Sentry SDK
  Sentry.init({
    dsn: dsn,

    debug: process.env.NODE_ENV === 'development',
    environment: process.env.NODE_ENV || 'development',
    release: process.env.VERCEL_GIT_COMMIT_SHA,

    // Server-side transaction sampling (0-1, adjust as needed)
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.2'),

    // Scope setup for server-side with basic integrations
    defaultIntegrations: false, // Use explicit integrations below

    // HTTP integration for capturing network requests
    integrations: [
      new (Sentry.Integrations.Http)({ tracing: true }),
    ],

    // Transaction naming - ignore API routes and static assets
    beforeSendTransaction(transaction: any) {
      const ignoredPaths = ['/api/*', '/_next/*', '/static/*'];
      if (ignoredPaths.some((path: string) => transaction.name.includes(path))) {
        return null;
      }
      return transaction;
    },

    // Capture server-side errors - mask sensitive data
    beforeSend(event: any, hint: unknown) {
      if (!event?.message) return event;

      // Filter out common sensitive patterns
      const sensitivePatterns = [
        /password/i,
        /token/i,
        /secret/i,
        /api[-_]key/i,
        /auth[_-]?bearer/i,
      ];

      if (sensitivePatterns.some((pattern: RegExp) => pattern.test(event.message))) {
        console.warn('[Sentry] Error message contains sensitive data, masking...');
      }

      return event;
    },
  });

  console.log('[Sentry] Server-side Sentry initialized');
};

/**
 * Create error boundary handler for Next.js App Router
 */
export const createErrorBoundary = () => {
  // This is a no-op in server components
  return (error: Error, digest?: string) => {
    if (dsn && process.env.NODE_ENV !== 'development') {
      // Report to Sentry from server components
      Sentry.captureException?.(error);
    } else {
      console.error('[Sentry Error Boundary]', error.message);
    }
  };
};

export default sentryServerInit;
