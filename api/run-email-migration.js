import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const { Pool } = pg;

// Disable SSL verification for Aiven
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  try {
    console.log('🔄 Running email verification migration...\n');
    
    const migrationPath = path.join(__dirname, 'migrations', '004_add_email_verification.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    await pool.query(sql);
    
    console.log('✅ Migration completed successfully!\n');
    console.log('Added columns:');
    console.log('  - email_verified (BOOLEAN)');
    console.log('  - verification_otp (VARCHAR(6))');
    console.log('  - otp_expires_at (TIMESTAMP)');
    console.log('  - otp_attempts (INTEGER)\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
