const fetch = require('node-fetch');

async function testProxy() {
  const url = 'https://aostech.vercel.app/api/auth/login';
  console.log(`Testing Vercel Proxy: ${url}...`);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'hydra', password: 'hydra' })
    });
    console.log('HTTP Status:', res.status);
    const text = await res.text();
    console.log('Response Body:', text);
  } catch (e) {
    console.error('Fetch Error:', e);
  }
}

testProxy();
