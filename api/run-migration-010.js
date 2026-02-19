import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  try {
    console.log('🚀 Starting staff management migration (010)...\n');
    
    const migrationFile = './migrations/010_add_staff_management.sql';
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
      AND table_name IN ('staff', 'submission_members')
      ORDER BY table_name
    `);
    
    console.log('Tables created/modified:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });
    
    // Verify staff table columns
    console.log('\n📋 Verifying staff table structure...');
    const staffColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'staff'
      ORDER BY ordinal_position
    `);
    
    console.log('Staff table columns:');
    staffColumns.rows.forEach(col => {
      console.log(`  ✓ ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Verify submission_members table
    console.log('\n📋 Verifying submission_members table structure...');
    const memberColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'submission_members'
      ORDER BY ordinal_position
    `);
    
    console.log('Submission_members table columns:');
    memberColumns.rows.forEach(col => {
      console.log(`  ✓ ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Check if old submission_students table still exists
    console.log('\n🔍 Checking for old submission_students table...');
    const oldTable = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name = 'submission_students'
    `);
    
    if (oldTable.rows.length > 0) {
      console.log('⚠️  Old submission_students table still exists!');
    } else {
      console.log('✅ Old submission_students table successfully removed');
    }
    
    // Verify indexes
    console.log('\n📊 Verifying indexes...');
    const indexes = await pool.query(`
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND (tablename = 'staff' OR tablename = 'submission_members')
      ORDER BY tablename, indexname
    `);
    
    console.log('Indexes created:');
    indexes.rows.forEach(idx => {
      console.log(`  ✓ ${idx.tablename}.${idx.indexname}`);
    });
    
    await pool.end();
    console.log('\n✅ Migration 010 completed successfully!');
    console.log('\n📝 Note: To rollback this migration, run: node run-migration-010-rollback.js');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
