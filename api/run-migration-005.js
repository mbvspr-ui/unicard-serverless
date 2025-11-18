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
    console.log('🚀 Running migration 005: Remove Admin Approval...\n');
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '005_remove_admin_approval.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Executing migration...');
    
    // Run migration
    await client.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!\n');
    
    // Check results
    const result = await client.query("SELECT status, COUNT(*) as count FROM schools GROUP BY status");
    console.log('📊 School status distribution:');
    result.rows.forEach(row => {
      console.log(`   ${row.status}: ${row.count} schools`);
    });
    
    console.log('\n🎉 All schools are now auto-approved!');
    
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
