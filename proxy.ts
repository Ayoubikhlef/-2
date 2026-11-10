import { next } from '@vercel/functions';

/**
 * Only the canonical domain may serve this project.
 *
 * Every `*.vercel.app` alias (including `aostech.vercel.app`) answers with a
 * real 404 + noindex instead of redirecting, so search engines drop the
 * duplicate host and visitors cannot reach the site through it.
 */
const notFoundPage = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <title>404 — الصفحة غير موجودة</title>
    <style>
      *{box-sizing:border-box}
      body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at 50% 30%,#1e3a8a 0%,#0f172a 60%,#020617 100%);color:#e2e8f0;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;text-align:center}
      main{max-width:460px}
      .code{font-size:clamp(4.5rem,18vw,7rem);font-weight:900;line-height:1;letter-spacing:-.04em;background:linear-gradient(135deg,#60a5fa,#2563eb);-webkit-background-clip:text;background-clip:text;color:transparent}
      h1{margin:18px 0 8px;font-size:1.3rem}
      p{margin:0;color:#94a3b8;line-height:1.8;font-size:.95rem}
      a{display:inline-block;margin-top:22px;padding:11px 26px;border-radius:999px;background:#2563eb;color:#fff;font-weight:800;font-size:.9rem;text-decoration:none}
      a:hover{background:#1d4ed8}
    </style>
  </head>
  <body>
    <main>
      <div class="code">404</div>
      <h1>الصفحة غير موجودة</h1>
      <p>هذا العنوان غير متاح. الموقع الرسمي الوحيد هو<br /><strong>aos-tech.store</strong></p>
      <a href="https://aos-tech.store/">زيارة الموقع الرسمي</a>
    </main>
  </body>
</html>`;

export default function proxy(request: Request) {
  const url = new URL(request.url);
  const host = (request.headers.get('host') || url.hostname)
    .toLowerCase()
    .split(':')[0];

  if (host === 'aostech.vercel.app' || host.endsWith('.vercel.app')) {
    return new Response(notFoundPage, {
      status: 404,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  }

  return next();
}
