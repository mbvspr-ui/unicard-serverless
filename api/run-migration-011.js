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
    : undefined
});

async function runMigration() {
  try {
    console.log('🚀 Starting activity log removal migration (011)...\n');
    
    const migrationFile = './migrations/011_drop_activity_log.sql';
    console.log(`📄 Reading migration file: ${migrationFile}`);
    
    const sql = fs.readFileSync(migrationFile, 'utf8');
    console.log(`✅ Migration file loaded (${sql.length} characters)\n`);
    
    console.log('🔄 Executing migration...');
    const client = await pool.connect();
    
    try {
      await client.query(sql);
      console.log('✅ Migration executed successfully!\n');
    } catch (error) {
      if (error.code === '42P01') {
        console.log('⚠️  activity_log table does not exist, skipping\n');
      } else {
        throw error;
      }
    } finally {
      client.release();
    }
    
    // Verify table is dropped
    console.log('📊 Verifying activity_log table is dropped...');
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name = 'activity_log'
    `);
    
    if (result.rows.length === 0) {
      console.log('✅ activity_log table successfully dropped');
    } else {
      console.log('⚠️  activity_log table still exists!');
    }
    
    await pool.end();
    console.log('\n✅ Migration 011 completed successfully!');
    console.log('\n📝 Note: This migration is irreversible. Activity log data has been permanently deleted.');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
