const fetch = require('node-fetch');

async function testLogin() {
  const url = 'https://aos-api-production.up.railway.app/api/auth/login';
  const body = { email: 'hydra', password: 'hydra' };

  console.log(`Testing PRODUCTION login at ${url}...`);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error:', e);
  }
}

testLogin();
