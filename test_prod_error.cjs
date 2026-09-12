const fetch = require('node-fetch');

async function testLogin() {
  const url = 'https://aos-api-production.up.railway.app/api/auth/login';
  const body = { email: 'hydra', password: 'hydra' };

  console.log(`Testing PRODUCTION login with detailed logs...`);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    console.log('HTTP Status:', res.status);
    const text = await res.text();
    console.log('Response Body:', text);
  } catch (e) {
    console.error('Fetch Error:', e);
  }
}

testLogin();
