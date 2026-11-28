/**
 * Generate real WebP thumbnails for the site-factory template gallery.
 *
 *   node scripts/generate-thumbs.mjs            # skip files that already exist
 *   node scripts/generate-thumbs.mjs --force    # regenerate everything
 *   node scripts/generate-thumbs.mjs --slug store
 *
 * Serves the built static previews from dist/, opens every /templates/<slug>/
 * at 1280x800 with Playwright, waits for fonts/images, hides preview chrome,
 * then writes public/thumbs/<slug>.webp at 800px wide / quality 80.
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const DIST = join(ROOT, 'dist');
const PREVIEWS = join(DIST, 'templates');
const OUT = join(ROOT, 'public', 'thumbs');

const args = process.argv.slice(2);
const force = args.includes('--force');
const argValue = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
};
const onlySlug = argValue('--slug');
const limit = Number(argValue('--limit') || 0);

if (!existsSync(PREVIEWS)) {
  console.error('No dist/templates found. Run `npm run build` first.');
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.woff2': 'font/woff2',
};

const server = createServer((req, res) => {
  const url = new URL(req.url || '/', 'http://localhost');
  const requested = decodeURIComponent(url.pathname);
  let file = resolve(join(DIST, requested === '/' ? 'index.html' : requested));
  if (file !== DIST && !file.startsWith(DIST + sep)) {
    res.writeHead(403).end();
    return;
  }
  try {
    if (statSync(file).isDirectory()) file = join(file, 'index.html');
  } catch {
    res.writeHead(404).end();
    return;
  }
  if (!existsSync(file)) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, {
    'Content-Type': MIME[extname(file).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  createReadStream(file).pipe(res);
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const base = `http://127.0.0.1:${server.address().port}`;

const slugs = readdirSync(PREVIEWS, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(join(PREVIEWS, entry.name, 'index.html')))
  .map((entry) => entry.name)
  .filter((slug) => !onlySlug || slug === onlySlug)
  .slice(0, limit || undefined);

const HIDE_CHROME = `
  .preview-banner, .preview-watermark, .toast, .lightbox, .modal,
  .cookie-banner, [data-popup], .wa-float { display: none !important; }
  body.has-preview { padding-top: 0 !important; }
  body.has-preview .site-header { top: 0 !important; }
  html { scroll-behavior: auto !important; }
  *, *::before, *::after { animation: none !important; transition: none !important; }
`;

let browser;
const ok = [];
const skipped = [];
const failed = [];

try {
  browser = await chromium.launch({ channel: 'chrome' });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();

  for (const slug of slugs) {
    const target = join(OUT, `${slug}.webp`);
    if (!force && existsSync(target)) {
      skipped.push(slug);
      continue;
    }
    try {
      await page.goto(`${base}/templates/${slug}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.addStyleTag({ content: HIDE_CHROME });
      await Promise.race([
        page.evaluate(() => document.fonts.ready).catch(() => null),
        new Promise((done) => setTimeout(done, 4000)),
      ]);
      await Promise.race([
        page.evaluate(() =>
          Promise.all(
            Array.from(document.images)
              .filter((img) => !img.complete)
              .map((img) => new Promise((done) => {
                img.addEventListener('load', done, { once: true });
                img.addEventListener('error', done, { once: true });
              })),
          ),
        ).catch(() => null),
        new Promise((done) => setTimeout(done, 5000)),
      ]);
      await page.waitForTimeout(200);
      const png = await page.screenshot({ type: 'png' });
      const dataUrl = `data:image/png;base64,${png.toString('base64')}`;
      const webpBase64 = await page.evaluate(async (source) => {
        const image = new Image();
        image.src = source;
        await image.decode();
        const width = 800;
        const height = Math.round((image.naturalHeight / image.naturalWidth) * width);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(image, 0, 0, width, height);
        return canvas.toDataURL('image/webp', 0.8).split(',')[1];
      }, dataUrl);
      writeFileSync(target, Buffer.from(webpBase64, 'base64'));
      ok.push(slug);
      process.stdout.write(`✔ ${slug}\n`);
    } catch (error) {
      failed.push({ slug, message: String(error?.message || error).split('\n')[0] });
      process.stdout.write(`✖ ${slug}: ${failed[failed.length - 1].message}\n`);
    }
  }
  await context.close();
} catch (error) {
  console.error('Playwright could not start:', String(error?.message || error));
  console.error('If Chrome is unavailable, run `npx playwright install chromium` and retry.');
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  server.close();
}

console.log(`\nThumbnails: ${ok.length} generated, ${skipped.length} skipped, ${failed.length} failed.`);
if (failed.length) {
  console.log('Failed templates:');
  for (const item of failed) console.log(`  - ${item.slug}: ${item.message}`);
  process.exitCode = 1;
}
