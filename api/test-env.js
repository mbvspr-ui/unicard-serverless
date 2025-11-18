import dotenv from 'dotenv';

dotenv.config();

console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Loaded ✅' : 'Not found ❌');
console.log('First 50 chars:', process.env.DATABASE_URL?.substring(0, 50));
