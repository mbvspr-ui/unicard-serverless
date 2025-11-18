import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const { Pool } = pg;

async function runMigration() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔄 Running migration 008: Add must_change_password flag...');
    
    const migrationSQL = readFileSync(
      join(__dirname, 'migrations', '008_add_must_change_password.sql'),
      'utf-8'
    );

    await pool.query(migrationSQL);
    
    console.log('✅ Migration 008 completed successfully!');
    console.log('   - Added must_change_password column to schools table');
    
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
