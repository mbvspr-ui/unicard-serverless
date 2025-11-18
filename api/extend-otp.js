import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function extendOTP() {
  try {
    const email = process.argv[2];
    if (!email) {
      console.log('Usage: node extend-otp.js <email>');
      process.exit(1);
    }

    // Extend OTP expiry by 30 minutes from now
    const newExpiry = new Date(Date.now() + 30 * 60 * 1000);
    
    const result = await pool.query(
      'UPDATE schools SET otp_expires_at = $1, otp_attempts = 0 WHERE email = $2 RETURNING verification_otp, otp_expires_at',
      [newExpiry.toISOString(), email]
    );

    if (result.rows.length === 0) {
      console.log('❌ School not found');
      process.exit(1);
    }

    console.log('\n✅ OTP expiry extended!');
    console.log('📧 Email:', email);
    console.log('🔢 OTP:', result.rows[0].verification_otp);
    console.log('⏰ New Expiry:', result.rows[0].otp_expires_at);
    console.log('⏱️  Valid for: 30 minutes\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

extendOTP();
