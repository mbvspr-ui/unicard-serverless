import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : false,
});

async function checkAdmin() {
  try {
    const result = await pool.query('SELECT id, email, role, created_at FROM admins');
    
    if (result.rows.length === 0) {
      console.log('❌ No admin users found');
      console.log('💡 Run: npm run create-admin');
    } else {
      console.log('✅ Admin users found:');
      result.rows.forEach(admin => {
        console.log(`   - ${admin.email} (${admin.role}) - Created: ${admin.created_at}`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAdmin();
