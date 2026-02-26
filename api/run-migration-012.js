import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const { Pool } = pg;

// Set environment variable to allow self-signed certificates
if (process.env.DATABASE_URL?.includes('sslmode=require')) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require')
    ? { 
        rejectUnauthorized: false,
        ca: fs.readFileSync('./ca-certificate.crt', 'utf8')
      }
    : false
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Starting migration 012: Make mother_name optional...');
    
    const migrationSQL = fs.readFileSync(
      './migrations/012_make_mother_name_optional.sql',
      'utf8'
    );
    
    await client.query('BEGIN');
    await client.query(migrationSQL);
    await client.query('COMMIT');
    
    console.log('Migration 012 completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(console.error);
