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

async function resetAdmin() {
  try {
    const email = 'admin@unicard.com';
    const password = 'Admin@123';
    
    console.log('🔧 Resetting admin user...');
    console.log('');
    
    // Delete existing admin
    await pool.query('DELETE FROM admins WHERE email = $1', [email]);
    console.log('✅ Deleted existing admin');
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    console.log('✅ Password hashed');
    
    // Create new admin
    const result = await pool.query(
      'INSERT INTO admins (email, password_hash, role) VALUES ($1, $2, $3) RETURNING *',
      [email, passwordHash, 'admin']
    );
    
    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('📋 Details:');
    console.log(`   Email: ${result.rows[0].email}`);
    console.log(`   Role: ${result.rows[0].role}`);
    console.log('');
    console.log('🔑 Login credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

resetAdmin();
