// Create admin account on Render via registration
const createAdmin = async () => {
  const API_URL = 'https://iueefgma6y.onrender.com/api';
  
  try {
    console.log('🔄 Creating admin account on Render...\n');
    
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@aos.dz',
        password: 'Admin@AOS2025!',
        name: 'Admin AOS',
        phone: '+213600000000',
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ SUCCESS! Account created on Render!\n');
      console.log('User Role:', data.user?.role || 'UNKNOWN');
      console.log('Access Token:', data.accessToken ? 'Generated' : 'None');
      console.log('\nLogin Credentials:');
      console.log('📧 Email: admin@aos.dz');
      console.log('🔐 Password: Admin@AOS2025!');
      console.log('🔐 Gate Code: 752918');
    } else if (response.status === 400 && data.error?.includes('already registered')) {
      console.log('✅ Account already exists on Render!');
      console.log('Login with:');
      console.log('📧 Email: admin@aos.dz');
      console.log('🔐 Password: Admin@AOS2025!');
    } else {
      console.log('❌ Error:', data.error || 'Unknown error');
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
};

createAdmin();
