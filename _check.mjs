import puppeteer from 'puppeteer-core';

(async () => {
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
    if (r.url().includes('unsplash')) errors.push('IMGFAIL: ' + r.url().slice(0, 120) + ' :: ' + (r.failure()?.errorText || ''));
  });
  page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text().slice(0, 200)); });

  await page.goto('https://aostech.vercel.app', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await await new Promise(r => setTimeout(r, 12000));

  const imgs = await page.evaluate(() => {
    const list = [...document.querySelectorAll('img')];
    return list.slice(0, 12).map((i) => ({
      src: (i.currentSrc || i.src || '').slice(0, 90),
      w: i.naturalWidth,
      h: i.naturalHeight,
    }));
  });
  console.log('IMAGES:');
  imgs.forEach((x) => console.log(`  ${x.w}x${x.h}  ${x.src}`));

  const sections = await page.evaluate(() => {
    const visible = document.querySelectorAll('#products article, #products div[class*="group"]').length;
    return { productCards: visible, title: document.title };
  });
  console.log('PAGE:', JSON.stringify(sections));
  console.log('ERRORS:', errors.length);
  errors.slice(0, 12).forEach((e) => console.log('  ' + e));

  await browser.close();
})();