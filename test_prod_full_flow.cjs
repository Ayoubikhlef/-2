const fetch = require('node-fetch');

async function testFlow() {
  const baseUrl = 'https://aos-api-production.up.railway.app';
  
  console.log('1. Testing Login...');
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'hydra', password: 'hydra' })
  });
  const loginData = await loginRes.json();
  const accessToken = loginData.accessToken;
  const cookie = loginRes.headers.get('set-cookie');
  console.log('Login Status:', loginRes.status);
  
  if (loginRes.status !== 200) {
    console.error('Login failed:', loginData);
    return;
  }

  console.log('2. Testing /me...');
  const meRes = await fetch(`${baseUrl}/api/auth/me`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });
  console.log('/me Status:', meRes.status);
  
  if (meRes.status !== 200) {
    console.error('/me failed');
    return;
  }

  console.log('3. Testing Logout...');
  const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Cookie': cookie || ''
    },
  });
  console.log('Logout Status:', logoutRes.status);
  
  if (logoutRes.status !== 200) {
    console.error('Logout failed');
    return;
  }

  console.log('4. Verifying /me after logout...');
  const meAfterRes = await fetch(`${baseUrl}/api/auth/me`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });
  // Note: The accessToken might still be valid if it hasn't expired, 
  // but the refreshToken should be gone from the DB.
  // The auth middleware checks if the user is authenticated via the token.
  // /logout clears the refreshToken in DB, but the accessToken is stateless.
  // To truly test logout, we should check if a refresh attempt fails.
  console.log('/me after logout status (expected 200 if token still valid):', meAfterRes.status);

  console.log('5. Testing Refresh Token (should fail after logout)...');
  const refreshRes = await fetch(`${baseUrl}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Cookie': cookie || '' },
  });
  console.log('Refresh Status (expected 401):', refreshRes.status);
  
  if (refreshRes.status === 401) {
    console.log('Success: Refresh token was invalidated.');
  } else {
    console.log('Failure: Refresh token still valid after logout.');
  }
}

testFlow().catch(console.error);
