import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : false,
});

async function testLogin() {
  try {
    const email = 'admin@unicard.com';
    const password = 'Admin@123';
    
    console.log('Testing login for:', email);
    console.log('Password:', password);
    console.log('');
    
    // Get admin from database
    const result = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      console.log('❌ Admin not found');
      return;
    }
    
    const admin = result.rows[0];
    console.log('✅ Admin found:', admin.email);
    console.log('Password hash:', admin.password_hash);
    console.log('');
    
    // Test password
    const isValid = await bcrypt.compare(password, admin.password_hash);
    console.log('Password valid:', isValid);
    
    if (!isValid) {
      console.log('');
      console.log('❌ Password does not match!');
      console.log('💡 The admin user might have been created with a different password');
      console.log('💡 Try recreating the admin user:');
      console.log('   npm run create-admin');
    } else {
      console.log('');
      console.log('✅ Password matches! Login should work.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

testLogin();
