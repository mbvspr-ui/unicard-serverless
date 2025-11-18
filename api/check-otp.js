import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkOTP() {
  try {
    const email = process.argv[2];
    if (!email) {
      console.log('Usage: node check-otp.js <email>');
      process.exit(1);
    }

    const result = await pool.query(
      'SELECT email, verification_otp, otp_expires_at, otp_attempts, email_verified, created_at FROM schools WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      console.log('❌ School not found');
      process.exit(1);
    }

    const school = result.rows[0];
    const now = new Date();
    const expiry = new Date(school.otp_expires_at);
    const diff = (expiry.getTime() - now.getTime()) / 1000 / 60;

    console.log('\n📧 School:', school.email);
    console.log('🔢 OTP:', school.verification_otp);
    console.log('⏰ Expires At:', school.otp_expires_at);
    console.log('🕐 Current Time:', now.toISOString());
    console.log('⏱️  Time Remaining:', diff.toFixed(2), 'minutes');
    console.log('🔄 Attempts:', school.otp_attempts);
    console.log('✅ Verified:', school.email_verified);
    console.log('📅 Created:', school.created_at);
    
    if (diff < 0) {
      console.log('\n❌ OTP is EXPIRED');
    } else {
      console.log('\n✅ OTP is VALID');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkOTP();
