const fetch = require('node-fetch');

async function testCORS() {
  const url = 'https://aos-api-production.up.railway.app/api/auth/login';
  console.log(`Testing OPTIONS request to ${url}...`);
  try {
    const res = await fetch(url, {
      method: 'OPTIONS',
      headers: {
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
        'Origin': 'https://aostech.vercel.app'
      }
    });
    console.log('Status:', res.status);
    console.log('Access-Control-Allow-Origin:', res.headers.get('access-control-allow-origin'));
    console.log('Access-Control-Allow-Methods:', res.headers.get('access-control-allow-methods'));
    console.log('Access-Control-Allow-Headers:', res.headers.get('access-control-allow-headers'));
    console.log('Access-Control-Allow-Credentials:', res.headers.get('access-control-allow-credentials'));
  } catch (e) {
    console.error('Error:', e);
  }
}

testCORS();
