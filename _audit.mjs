import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 900 });
await page.goto('https://aostech.vercel.app', { waitUntil: 'domcontentloaded', timeout: 60000 });
await new Promise((r) => setTimeout(r, 12000));
const before = await page.evaluate(() => ({ hash: location.hash, hero: !!document.querySelector('h1') || document.body.innerText.includes('WELCOME'), head: document.body.innerText.slice(0, 120) }));
console.log('BEFORE:', JSON.stringify(before).slice(0, 250));
const after = await page.evaluate(() => {
  const a = [...document.querySelectorAll('a')].find((x) => (x.textContent || '').includes('منتجات'));
  if (a) { a.click(); return 'clicked ' + a.getAttribute('href'); }
  return 'not found';
});
await new Promise((r) => setTimeout(r, 4000));
const afterState = await page.evaluate(() => ({ hash: location.hash, head: document.body.innerText.slice(0, 150) }));
console.log('AFTER CLICK:', JSON.stringify(after), '->', JSON.stringify(afterState).slice(0, 300));
await browser.close();