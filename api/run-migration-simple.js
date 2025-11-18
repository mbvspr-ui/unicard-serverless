import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    console.log('🚀 Starting database migration...\n');
    
    const migrationFile = './migrations/001_initial_schema.sql';
    console.log(`📄 Reading migration file: ${migrationFile}`);
    
    const sql = fs.readFileSync(migrationFile, 'utf8');
    console.log(`✅ Migration file loaded (${sql.length} characters)\n`);
    
    console.log('🔄 Executing migration...');
    const client = await pool.connect();
    
    try {
      await client.query(sql);
      console.log('✅ Migration executed successfully!\n');
    } catch (error) {
      if (error.code === '42P07' || error.code === '42710') {
        console.log('⚠️  Tables already exist, skipping\n');
      } else {
        throw error;
      }
    } finally {
      client.release();
    }
    
    // Verify tables
    console.log('📊 Verifying tables...');
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('Tables created:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });
    
    await pool.end();
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
