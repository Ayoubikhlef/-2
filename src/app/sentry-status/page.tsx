import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default async function SentryStatusPage() {
  // Fetch health check status
  const healthData = await fetch('/api/sentry-health', { cache: 'no-store' })
    .then((res) => res.json())
    .catch(() => ({ sentry: null }));

  const isSentryEnabled = healthData.sentry?.enabled ?? false;
  const isConfigured = healthData.sentry?.configured ?? false;
  const statusColor = isConfigured ? 'text-green-500' : 'text-yellow-500';
  const statusIcon = isConfigured ? (
    <CheckCircle2 className="h-16 w-16 text-green-500" />
  ) : (
    <XCircle className="h-16 w-16 text-yellow-500" />
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full rounded-xl border border-white/10 bg-black/20 backdrop-blur-xl p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white">Sentry Integration Status</h1>
          <p className="text-gray-400">AOS Tech Store Error Monitoring</p>
        </div>

        {/* Status Card */}
        <div
          className={`flex items-center gap-4 p-6 rounded-xl border ${
            isConfigured ? 'bg-green-500/10 border-green-500/20' : 'bg-yellow-500/10 border-yellow-500/20'
          }`}
        >
          {statusIcon}
          <div className="flex-1">
            <h2 className={`text-xl font-semibold ${statusColor}`}>
              {isConfigured ? 'Sentry is Configured' : 'Sentry not configured'}
            </h2>
            <p className="text-gray-400 mt-1">{healthData.sentry?.message}</p>
          </div>
        </div>

        {/* Configuration Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Environment</h3>
            <p className="text-white">{healthData.environment || 'development'}</p>
          </div>

          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Node.js Version</h3>
            <p className="text-white">{healthData.build?.nodeVersion || 'unknown'}</p>
          </div>

          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Sentry DSN</h3>
            <p className={`${isConfigured ? 'text-green-400' : 'text-red-400'} truncate`}>
              {healthData.sentry?.dsn}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <h3 className="text-sm font-medium text-gray-300 mb-2">API Status</h3>
            <p className="flex items-center gap-2 text-white">
              {isConfigured ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  API Connected
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-500" />
                  Not Configured
                </>
              )}
            </p>
          </div>
        </div>

        {/* Setup Instructions (if not configured) */}
        {!isConfigured && (
          <div className="p-6 rounded-xl border border-blue-500/20 bg-blue-500/10">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
              Setup Instructions
            </h3>
            <ol className="space-y-2 text-gray-300 text-sm">
              <li>
                Visit{' '}
                <a
                  href="https://sentry.io/dashboard/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  https://sentry.io/dashboard/
                </a>{' '}
                to create an account
              </li>
              <li>
                Create a new project for Next.js application
              </li>
              <li>Copy the DSN from Project Settings &gt; Client SDK Configuration</li>
              <li>
                Add to{' '}
                <code className="bg-black/30 px-2 py-1 rounded text-white">
                  server/.env.sentry-local
                </code>{' '}
                as:
              </li>
            </ol>
            <pre className="bg-black/30 p-3 rounded-lg text-xs overflow-x-auto my-4">
  SENTRY_DSN="https://your-dsn@sentry.io/0"
SENTRY_ORG="aostech-store"
SENTRY_PROJECT="nextjs-app"
</pre>
            <p className="text-gray-400 text-sm">
              Then restart your development server and visit this page again.
            </p>
          </div>
        )}

        {/* Documentation Link */}
        <div className="flex justify-center">
          <a
            href="https://github.com/AyoubWorkTechStore/SENTRY_SETUP.md"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white text-sm"
          >
            <span>View Full Documentation</span>
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          Last checked: {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
}
