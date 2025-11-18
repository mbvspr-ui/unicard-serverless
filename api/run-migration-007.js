import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const { Pool } = pg;

async function runMigration() {
  // Set environment variable to accept self-signed certificates
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔄 Running migration 007: Add password reset fields...');
    
    const migrationSQL = readFileSync(
      join(__dirname, 'migrations', '007_add_password_reset_fields.sql'),
      'utf-8'
    );

    await pool.query(migrationSQL);
    
    console.log('✅ Migration 007 completed successfully!');
    console.log('   - Added reset_token column to schools table');
    console.log('   - Added reset_token_expires column to schools table');
    console.log('   - Created index on reset_token');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration()
  .then(() => {
    console.log('\n✨ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error.message);
    process.exit(1);
  });
