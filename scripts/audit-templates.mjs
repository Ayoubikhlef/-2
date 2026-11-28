/**
 * Automated UI/UX audit of every built template preview at 360x780.
 * Writes a JSON report; see audit.md for the human-readable findings.
 *
 *   node scripts/audit-templates.mjs [output.json]
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const DIST = join(ROOT, 'dist');
const PREVIEWS = join(DIST, 'templates');
const output = resolve(process.argv[2] || join(ROOT, 'audit-results.json'));

if (!existsSync(PREVIEWS)) {
  console.error('Run `npm run build` first.');
  process.exit(1);
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8', '.woff2': 'font/woff2',
};
const server = createServer((req, res) => {
  let file = resolve(join(DIST, decodeURIComponent(new URL(req.url || '/', 'http://x').pathname)));
  if (file !== DIST && !file.startsWith(DIST + sep)) return res.writeHead(403).end();
  try { if (statSync(file).isDirectory()) file = join(file, 'index.html'); }
  catch { return res.writeHead(404).end(); }
  if (!existsSync(file)) return res.writeHead(404).end();
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
  createReadStream(file).pipe(res);
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const base = `http://127.0.0.1:${server.address().port}`;

const slugs = readdirSync(PREVIEWS, { withFileTypes: true })
  .filter((e) => e.isDirectory() && existsSync(join(PREVIEWS, e.name, 'index.html')))
  .map((e) => e.name);

const browser = await chromium.launch({ channel: 'chrome' });
const context = await browser.newContext({
  viewport: { width: 360, height: 780 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
});
await context.addInitScript(() => {
  window.__cls = 0;
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__cls += entry.value;
  }).observe({ type: 'layout-shift', buffered: true });
});
const page = await context.newPage();
const results = [];

for (const slug of slugs) {
  try {
    await page.goto(`${base}/templates/${slug}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await Promise.race([
      page.evaluate(() => document.fonts.ready).catch(() => null),
      new Promise((done) => setTimeout(done, 4000)),
    ]);
    await page.waitForTimeout(300);
    const data = await page.evaluate(() => {
      const visible = (el) => {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0;
      };
      const luminance = (color) => {
        const m = color.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
        if (!m) return null;
        const ch = [m[1], m[2], m[3]].map(Number).map((v) => {
          const s = v / 255;
          return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        });
        return ch[0] * 0.2126 + ch[1] * 0.7152 + ch[2] * 0.0722;
      };
      const bgOf = (el) => {
        let node = el;
        while (node) {
          const c = getComputedStyle(node).backgroundColor;
          if (c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') return c;
          node = node.parentElement;
        }
        return 'rgb(255,255,255)';
      };
      const ratio = (a, b) => {
        const la = luminance(a), lb = luminance(b);
        if (la === null || lb === null) return null;
        return Math.round(((Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)) * 100) / 100;
      };
      const small = [];
      for (const el of document.querySelectorAll('p, li, .lead, .feature p, .service-card p, .step p')) {
        if (!visible(el)) continue;
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs < 16 && el.textContent.trim()) small.push(`${el.tagName.toLowerCase()}.${el.className}=${fs}`);
      }
      const contrast = [];
      for (const el of document.querySelectorAll('p, li, a, .btn, .eyebrow, .brand small')) {
        if (!visible(el) || !el.textContent.trim()) continue;
        const cs = getComputedStyle(el);
        const fs = parseFloat(cs.fontSize);
        const r = ratio(cs.color, bgOf(el));
        if (r !== null && r < (fs >= 24 || (fs >= 18.66 && parseInt(cs.fontWeight, 10) >= 700) ? 3 : 4.5)) {
          contrast.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 30)}=${r}`);
        }
      }
      const targets = [];
      for (const el of document.querySelectorAll('a, button, input, select')) {
        if (!visible(el)) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 44 || r.height < 44) {
          targets.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 24)}:${Math.round(r.width)}x${Math.round(r.height)}`);
        }
      }
      const unlabeled = [];
      for (const input of document.querySelectorAll('input:not([type=hidden]):not([type=range]), select, textarea')) {
        const labels = input.id ? document.querySelectorAll(`label[for="${input.id}"]`).length : 0;
        if (!labels && !input.getAttribute('aria-label') && !input.closest('label') && input.tabIndex >= 0) {
          unlabeled.push(`${input.tagName.toLowerCase()}#${input.id || '?'}`);
        }
      }
      const wa = document.querySelector('.wa-float');
      const waRect = wa ? wa.getBoundingClientRect() : null;
      const firstScreenBtns = Array.from(document.querySelectorAll('.btn, button'))
        .filter(visible)
        .filter((el) => el.getBoundingClientRect().top < innerHeight)
        .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 24)}`);
      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        bodyFont: parseFloat(getComputedStyle(document.body).fontSize),
        smallText: small.slice(0, 8),
        smallCount: small.length,
        contrast: contrast.slice(0, 8),
        contrastCount: contrast.length,
        targets: targets.slice(0, 12),
        targetCount: targets.length,
        images: document.images.length,
        imagesNoLazy: Array.from(document.images).filter((i) => i.loading !== 'lazy').length,
        inputs: document.querySelectorAll('input, select, textarea').length,
        unlabeled,
        inputTypes: Array.from(document.querySelectorAll('input')).map((i) => i.type).filter((v, idx, arr) => arr.indexOf(v) === idx),
        waSize: waRect ? `${Math.round(waRect.width)}x${Math.round(waRect.height)}` : null,
        firstScreenBtns: firstScreenBtns.slice(0, 10),
        cls: Math.round((window.__cls || 0) * 1000) / 1000,
        focusRule: Array.from(document.styleSheets).some((sheet) => {
          try { return Array.from(sheet.cssRules).some((r) => r.cssText.includes(':focus-visible')); }
          catch { return false; }
        }),
      };
    });
    results.push({ slug, ...data });
    process.stdout.write(`${slug}: overflow=${data.overflow} small=${data.smallCount} contrast=${data.contrastCount} targets=${data.targetCount} cls=${data.cls}\n`);
  } catch (error) {
    results.push({ slug, error: String(error?.message || error).split('\n')[0] });
  }
}

await browser.close();
server.close();
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify(results, null, 2));
console.log(`\nWrote ${results.length} results to ${output}`);
