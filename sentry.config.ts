import { defineConfig } from '@sentry/nextjs';

/**
 * Sentry Configuration for AOS Tech Store
 *
 * Setup instructions:
 * 1. Get DSN from https://sentry.io/dashboard/
 * 2. Add SENTRY_DSN to server/.env.sentry-local
 * 3. Get auth token from https://sentry.io/account/auth-tokens/
 * 4. Add SENTRY_AUTH_TOKEN to server/.env.sentry-local
 * 5. Build the project: npm run build
 * 6. Upload source maps: npx @sentry/wizard@latest -i nextjs
 */

export default defineConfig({
  org: process.env.SENTRY_ORG || 'aostech-store', // Update with your Sentry organization
  project: process.env.SENTRY_PROJECT || 'nextjs-app', // Update with your Sentry project name

  // Sentry DSN for capturing events
  dsn: process.env.SENTRY_DSN,

  // Auth token for uploading source maps
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Only send errors to Sentry in production
  hideSourceMaps: !!process.env.NODE_ENV !== 'production',
  tunnelRoute: '/api/errors', // Proxy errors through your API

  // Next.js-specific configuration
  widenClientFileUpload: true,
  droppableSources: ['webpack-only-bundlers'],
  extendClientWithEnvStrings: true,

  debug: process.env.NODE_ENV === 'development',

  // Scope configuration
  release: {
    env: process.env.NODE_ENV,
  },

  // Tracing configuration
  tracesSampleRate: 0.2, // Sample 20% of transactions in production

  // Replay for capturing user interactions (optional)
  integrations: [
    new Sentry.Integrations.BrowserTracing(),
    // Replay for session replay (set to true when enabled)
    // new Sentry.Integrations.Replay({
    //   maskAllInputs: true,
    //   maskTexts: true,
    //   maskAllOptions: true,
    // }),
  ],

  // Performance monitoring
  tracing: {
    shouldCreateSpanForFunction: [
      (span) => span.description && span.description.includes('fetch'),
      // Add custom function spans here
    ],
  },

  // Debug capture event console logging
  sendClientReports: true,

  // Server-side setup
  serverApiVersion: '2017-04-18',

  // Framework configuration
  framework: 'nextjs',

  // Module imports to ignore
  moduleTrace: true,

  // Error filtering
  filters: [
    'node_modules/.pnpm/*',
    'node_modules/.cache/*',
    'dist/*',
    '.next/*',
    '.output/*',
  ],

  // Next.js App Router specific setup
  nextjs: {
    // Build paths for source maps
    buildOutput: 'standalone', // or 'server-only'

    // Route analysis (for detecting potential issues)
    routeAnalysis: {
      enabled: true,
      ignoreRoutes: [
        '/api/*',
        '/_next/*',
        '/login',
        '/register',
        '/auth/*',
      ],
    },

    // Disable auto-instrumentation in development for better performance
    automaticVercelBuild: process.env.NODE_ENV === 'production',

    // Server code upload
    serverFunctions: {
      runtime: 'edge', // or 'node'
    },
  },

  // Transport options for error reporting
  transportOptions: {
    flush: 1000,
    breadcrumbBufferTime: 60 * 1000,
  },
});
