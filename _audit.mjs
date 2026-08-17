import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 900 });
const events = [];
page.on('console', (m) => events.push({ type: m.type(), text: m.text().slice(0, 220) }));
page.on('pageerror', (e) => events.push({ type: 'pageerror', text: e.message.slice(0, 220) }));
page.on('requestfailed', (r) => events.push({ type: 'reqfail', text: `${r.url().slice(0, 120)} :: ${r.failure()?.errorText}` }));
page.on('response', (r) => {
  if (r.status() >= 400) events.push({ type: `HTTP${r.status()}`, text: r.url().slice(0, 140) });
});
await page.goto('https://aostech.vercel.app', { waitUntil: 'domcontentloaded', timeout: 60000 });
await new Promise((r) => setTimeout(r, 15000));
const broken = await page.evaluate(() =>
  [...document.querySelectorAll('img')].filter((i) => i.complete && i.naturalWidth === 0).map((i) => (i.src || '').slice(0, 90))
);
console.log('BROKEN IMGS:', broken.length, JSON.stringify(broken));
console.log('EVENTS:');
for (const e of events) console.log(`  [${e.type}] ${e.text}`);
await browser.close();