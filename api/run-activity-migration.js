import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set environment variable to allow self-signed certificates (same as database.ts)
if (process.env.DATABASE_URL?.includes('sslmode=require')) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// Parse connection string and configure SSL
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.error('Please check your .env file');
  process.exit(1);
}

const poolConfig = {
  connectionString: connectionString,
};

// Aiven requires SSL - configure same as database.ts
if (connectionString?.includes('sslmode=require')) {
  const caPath = path.join(__dirname, 'ca-certificate.crt');
  const ca = fs.existsSync(caPath) ? fs.readFileSync(caPath, 'utf8') : undefined;
  
  poolConfig.ssl = {
    rejectUnauthorized: false,
    ca: ca
  };
}

const pool = new Pool(poolConfig);

async function runMigration() {
  console.log('🚀 Starting activity log migration...\n');

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '009_add_activity_log.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded');
    console.log('🔗 Connecting to database...');

    // Execute migration
    await pool.query(migrationSQL);

    console.log('\n✅ Activity log table created successfully!');
    console.log('\n📊 The activity_log table will now track:');
    console.log('   - Student additions');
    console.log('   - Student updates');
    console.log('   - Student deletions');
    console.log('   - Batch submissions');
    console.log('   - Profile updates');
    console.log('   - Logo uploads');
    console.log('   - Signature uploads');
    console.log('\n🎉 All activities will appear in the Dashboard Recent Activity feed!');

    // Verify table was created
    console.log('\n🔍 Verifying table...');
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'activity_log'
      ORDER BY ordinal_position;
    `);

    if (result.rows.length > 0) {
      console.log('\n✅ Verified table structure:');
      result.rows.forEach(row => {
        console.log(`   ✓ ${row.column_name} (${row.data_type})`);
      });
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    
    if (error.message.includes('already exists')) {
      console.log('\n💡 Note: Table already exists. This is normal if you\'ve run this migration before.');
    } else {
      console.error('\n🔧 Troubleshooting:');
      console.error('   1. Check your DATABASE_URL in .env file');
      console.error('   2. Ensure the database is accessible');
      console.error('   3. Verify you have permission to create tables');
      process.exit(1);
    }
  } finally {
    await pool.end();
    console.log('\n👋 Database connection closed');
  }
}

// Run the migration
runMigration().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
