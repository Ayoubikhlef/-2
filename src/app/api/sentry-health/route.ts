import { NextResponse } from 'next/server';

/**
 * Sentry Health Check Endpoint
 * Verifies Sentry integration is properly configured
 */

export async function GET() {
  const dsn = process.env.SENTRY_DSN;
  const sentryInitialized = !!dsn && typeof globalThis.__sentry_init !== 'undefined';

  return NextResponse.json({
    sentry: {
      enabled: sentryInitialized,
      configured: !!dsn,
      dsn: dsn ? '[SET]' : 'not configured',
      message: sentryInitialized
        ? 'Sentry is properly initialized'
        : 'Sentry DSN not configured yet',
    },
    environment: process.env.NODE_ENV || 'development',
    build: {
      nodeVersion: process.version,
      nextjs: true,
    },
  });
}
