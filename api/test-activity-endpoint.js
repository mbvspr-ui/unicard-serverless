// Test the activity logging endpoint
// This will help us verify if activity logging works when called directly

console.log('🧪 Testing activity logging endpoint...\n');
console.log('Instructions:');
console.log('1. Make sure the API server is running (npm run dev)');
console.log('2. Login to the school portal');
console.log('3. Open browser console (F12)');
console.log('4. Run this command in the console:\n');
console.log(`
fetch('http://localhost:3001/api/debug/test-activity', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('auth_token'),
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => {
  console.log('✅ Response:', data);
  console.log('Now refresh the dashboard to see the activity!');
})
.catch(err => console.error('❌ Error:', err));
`);

console.log('\n📝 Or use this curl command (replace YOUR_TOKEN):');
console.log('curl -X POST http://localhost:3001/api/debug/test-activity \\');
console.log('  -H "Authorization: Bearer YOUR_TOKEN" \\');
console.log('  -H "Content-Type: application/json"');
