import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkColumns() {
  try {
    console.log('🔍 Checking schools table columns...\n');
    
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'schools'
      ORDER BY ordinal_position;
    `);
    
    console.log('Columns in schools table:');
    console.log('─'.repeat(80));
    result.rows.forEach(row => {
      console.log(`${row.column_name.padEnd(25)} ${row.data_type.padEnd(20)} ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    console.log('─'.repeat(80));
    console.log(`\nTotal columns: ${result.rows.length}\n`);
    
    // Check for email verification columns
    const emailCols = result.rows.filter(r => 
      ['email_verified', 'verification_otp', 'otp_expires_at', 'otp_attempts'].includes(r.column_name)
    );
    
    if (emailCols.length === 4) {
      console.log('✅ All email verification columns exist!');
    } else {
      console.log('❌ Missing email verification columns:');
      const missing = ['email_verified', 'verification_otp', 'otp_expires_at', 'otp_attempts']
        .filter(col => !emailCols.find(r => r.column_name === col));
      missing.forEach(col => console.log(`  - ${col}`));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkColumns();
