import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 900 });
const errors = [];
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
page.on('requestfailed', (r) => {
  if (/(unsplash|wikimedia)/.test(r.url())) errors.push('IMGFAIL: ' + r.url().slice(0, 100));
});
page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('CONSOLE: ' + m.text().slice(0, 150)); });

await page.goto('https://aostech.vercel.app', { waitUntil: 'domcontentloaded', timeout: 60000 });
await new Promise((r) => setTimeout(r, 14000));

const report = await page.evaluate(() => {
  const broken = [...document.querySelectorAll('img')].filter((i) => i.complete && i.naturalWidth === 0);
  const ok = [...document.querySelectorAll('img')].filter((i) => i.complete && i.naturalWidth > 0);
  const flagsSvg = document.querySelectorAll('header svg[viewBox="0 0 640 480"]').length;
  return {
    imgs: document.querySelectorAll('img').length,
    ok, broken: broken.map((i) => (i.src || '').slice(0, 80)),
    flagSvgCount: flagsSvg,
    hasSwitcher: !!document.querySelector('header button'),
    htmlLang: document.documentElement.lang,
    dir: document.documentElement.dir,
  };
});
console.log('LOAD1:', JSON.stringify(report));

const switched = await page.evaluate(() => {
  const btn = [...document.querySelectorAll('header button')].find((b) => b.textContent.includes('EN'));
  if (!btn) return 'no-btn';
  btn.click();
  return 'clicked';
});
await new Promise((r) => setTimeout(r, 600));
const langAfter = await page.evaluate(() => {
  const item = [...document.querySelectorAll('[role="menuitem"]')].find((i) => i.textContent.includes('Français'));
  if (!item) return 'no-fr-item';
  item.click();
  return 'clicked-fr';
});
await new Promise((r) => setTimeout(r, 800));
const afterSwitch = await page.evaluate(() => ({ lang: document.documentElement.lang, dir: document.documentElement.dir, title: document.title, hasFr: document.body.textContent.includes('Français') }));
console.log('SWITCH:', switched, langAfter, JSON.stringify(afterSwitch));

await new Promise((r) => setTimeout(r, 3000));
await page.reload({ waitUntil: 'domcontentloaded' });
await new Promise((r) => setTimeout(r, 10000));
const report2 = await page.evaluate(() => {
  const broken = [...document.querySelectorAll('img')].filter((i) => i.complete && i.naturalWidth === 0);
  return {
    brokenCount: broken.length,
    broken: broken.slice(0, 4).map((i) => (i.src || '').slice(0, 80)),
    flagSvgCount: document.querySelectorAll('header svg[viewBox="0 0 640 480"]').length,
    swControlled: !!navigator.serviceWorker.controller,
  };
});
console.log('LOAD2 (SW active):', JSON.stringify(report2));
console.log('ERRORS:', errors.length);
errors.slice(0, 8).forEach((e) => console.log('  ' + e));
await browser.close();