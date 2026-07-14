const axios = require('axios');

async function test() {
  console.log('Logging in...');
  try {
    const loginRes = await axios.post('http://localhost:4000/v1/auth/login', {
      email: 'alexsandro@influnext.com.br',
      password: '123456'
    });
    
    const token = loginRes.data.token;
    console.log('Login successful! Token acquired.');

    const headers = {
      Authorization: `Bearer ${token}`
    };

    const endpoints = [
      { name: 'Dashboard Influencer', url: 'http://localhost:4000/v1/dashboard/influencer', method: 'get' },
      { name: 'Admin Stats', url: 'http://localhost:4000/v1/admin/stats', method: 'get' },
      { name: 'Support Admin', url: 'http://localhost:4000/v1/support/admin', method: 'get' },
      { name: 'Growth Strategy', url: 'http://localhost:4000/v1/admin/growth-strategy', method: 'get' }
    ];

    for (const ep of endpoints) {
      try {
        console.log(`Testing [${ep.name}] (${ep.url})...`);
        const res = await axios({
          method: ep.method,
          url: ep.url,
          headers
        });
        console.log(`  -> SUCCESS: Status ${res.status}`);
      } catch (err) {
        console.log(`  -> FAILED: Status ${err.response ? err.response.status : err.message}`);
        if (err.response) {
          console.log('     Response:', JSON.stringify(err.response.data));
        }
      }
    }
  } catch (err) {
    console.error('Login failed:', err.response ? err.response.data : err.message);
  }
}

test();
