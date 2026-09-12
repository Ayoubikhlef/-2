const fetch = require('node-fetch');

async function testMe() {
  const url = 'https://aos-api-production.up.railway.app/api/auth/me';
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbXRzeTdiMm8wMDAwbWcyZjQzbnlzYmMxIiwicm9sZSI6IlNVUEVSX0FETUlOIiwiaWF0IjoxNzg5MjE5Mzk2LCJleHAiOjE3ODkyMjAyOTZ9.95QiaGGzTMgCgexMickGpNF0tvo72lxHMY-va-sa3xs';

  console.log(`Testing PRODUCTION /me at ${url}...`);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error:', e);
  }
}

testMe();
