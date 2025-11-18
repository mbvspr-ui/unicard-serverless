import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set environment variable to allow self-signed certificates
if (process.env.DATABASE_URL?.includes('sslmode=require')) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const poolConfig = {
  connectionString: process.env.DATABASE_URL,
};

if (process.env.DATABASE_URL?.includes('sslmode=require')) {
  const caPath = path.join(__dirname, 'ca-certificate.crt');
  const ca = fs.existsSync(caPath) ? fs.readFileSync(caPath, 'utf8') : undefined;
  
  poolConfig.ssl = {
    rejectUnauthorized: false,
    ca: ca
  };
}

const pool = new Pool(poolConfig);

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Running migration 006: Add School Location Fields...\n');
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '006_add_school_location_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Executing migration...');
    
    // Run migration
    await client.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!\n');
    
    // Check results - show table structure
    const result = await client.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'schools'
      AND column_name IN ('city', 'state', 'pincode', 'principal_name')
      ORDER BY column_name;
    `);
    
    console.log('📊 New columns added to schools table:');
    result.rows.forEach(row => {
      const length = row.character_maximum_length ? `(${row.character_maximum_length})` : '';
      const nullable = row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      console.log(`   ${row.column_name}: ${row.data_type}${length} ${nullable}`);
    });
    
    console.log('\n🎉 Schools table now has all required fields for registration!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
