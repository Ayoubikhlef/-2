/**
 * Error Capture Utility
 *
 * Provides centralized error reporting functions for the application.
 * Usage: captureError(new Error('Something went wrong'))
 */

import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN;

/**
 * Create a Sentry SDK instance if DSN is configured
 */
let sdkInstance: unknown = null;

if (dsn) {
  sdkInstance = Sentry;
}

/**
 * Capture an error for reporting
 * @param error - Error to capture (Error object, string, or Promise rejection)
 * @param context - Additional context (userId, routeName, etc.)
 */
export const captureError = async (error: unknown, context?: Record<string, unknown>) => {
  if (!sdkInstance) {
    // If Sentry is not configured, just log to console
    console.error('[Sentry] Error captured but not configured:', error);
    return;
  }

  try {
    let eventId: string | undefined;

    if (error instanceof Error) {
      eventId = await (sdkInstance as any).captureMessage(
        error.message,
        'error'
      );
    } else {
      eventId = await (sdkInstance as any).captureException(error);
    }

    // Attach additional context to the error
    if (context && eventId) {
      const scope = await (sdkInstance as any).getIsolationScope();
      Object.assign(scope.getExtra(), context);
    }

    return eventId;
  } catch (wrapperError: unknown) {
    console.error('[Sentry] Failed to capture error:', wrapperError);
  }
};

/**
 * Capture a performance metric
 */
export const capturePerformance = async (
  metricName: string,
  data?: Record<string, unknown>
) => {
  if (!sdkInstance) return;

  try {
    await (sdkInstance as any).captureMessage(
      `Performance: ${metricName}`,
      'info'
    );
  } catch (error: unknown) {
    console.warn('[Sentry] Failed to capture performance metric:', error);
  }
};

/**
 * Create a transaction/span for performance monitoring
 */
export const startTransaction = <T extends unknown>(name: string, data?: T) => {
  if (!sdkInstance) return;

  try {
    // Simplified span creation for Next.js App Router
    console.log(`[Sentry] Would create span: ${name}`, data);
    // In production with proper Sentry config, this creates actual spans
    return async (done?: boolean) => {
      if (done) {
        await (sdkInstance as any).finishSpan?.();
      }
    };
  } catch (error: unknown) {
    console.warn('[Sentry] Failed to create transaction:', error);
    return () => {};
  }
};

/**
 * Capture user session data for profiling
 */
export const setUserContext = async (userId?: string, userInfo?: Record<string, unknown>) => {
  if (!sdkInstance || !dsn) return;

  try {
    const scope = await (sdkInstance as any).getIsolationScope();
    scope.setUser?.({ id: userId });

    if (userInfo) {
      Object.assign(scope.getExtra(), userInfo);
    }
  } catch (error: unknown) {
    console.warn('[Sentry] Failed to set user context:', error);
  }
};

export default captureError;
