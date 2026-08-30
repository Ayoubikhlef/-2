// Create admin account via API
const API_URL = 'https://iueefgma6y.onrender.com/api';
const ADMIN_GATE_CODE = process.env.ADMIN_GATE_CODE || '752918';

async function createAdminAccount() {
  try {
    console.log('🔄 Creating admin account on Render...');
    console.log('📍 Using code:', ADMIN_GATE_CODE);
    
    const response = await fetch(`${API_URL}/auth/create-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: ADMIN_GATE_CODE,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.log('❌ Error:', data.error || 'Unknown error');
      console.log('📝 Full response:', data);
      return;
    }

    console.log('✅ Admin account created successfully!');
    console.log('📧 Email:', data.email);
    console.log('🔐 Password:', data.password);
    console.log('💾 Message:', data.message);
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

createAdminAccount();

