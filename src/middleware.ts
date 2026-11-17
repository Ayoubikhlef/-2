import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';

// Middleware for Sentry integration
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip API routes and static assets
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/')
  ) {
    return null;
  }

  // Add Sentry tracking headers for client-side reporting
  const response = NextResponse.next();

  // Set header for error reporting
  response.headers.set(
    'X-Sentry-Enabled',
    process.env.SENTRY_DSN ? 'true' : 'false'
  );

  return response;
}

// Apply middleware to all routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
