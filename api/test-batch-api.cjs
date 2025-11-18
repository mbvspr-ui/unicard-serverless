require('dotenv').config();
const fetch = require('node-fetch');

async function testBatchAPI() {
  try {
    // First, login to get a token
    console.log('1. Logging in...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/school/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'otpsender77@gmail.com',
        password: 'your-password-here' // You'll need to provide the actual password
      })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed. Please update the password in the script.');
      console.log('Status:', loginResponse.status);
      const error = await loginResponse.text();
      console.log('Error:', error);
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful');
    console.log('Token:', token.substring(0, 20) + '...');
    
    // Now fetch batches
    console.log('\n2. Fetching batch submissions...');
    const batchResponse = await fetch('http://localhost:3001/api/batches?page=1&limit=20', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Status:', batchResponse.status);
    const batchData = await batchResponse.json();
    console.log('\n3. API Response:');
    console.log(JSON.stringify(batchData, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

console.log('Testing Batch API endpoint...\n');
testBatchAPI();
