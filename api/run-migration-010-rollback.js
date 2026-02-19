import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import readline from 'readline';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : undefined
});

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function rollbackMigration() {
  try {
    console.log('⚠️  ROLLBACK WARNING ⚠️\n');
    console.log('This will:');
    console.log('  1. Delete the staff table and ALL staff data');
    console.log('  2. Convert submission_members back to submission_students');
    console.log('  3. Remove any staff members from batch submissions\n');
    
    const answer = await askQuestion('Are you sure you want to proceed? (yes/no): ');
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('\n❌ Rollback cancelled');
      rl.close();
      await pool.end();
      process.exit(0);
    }
    
    console.log('\n🚀 Starting rollback of staff management migration (010)...\n');
    
    const migrationFile = './migrations/010_rollback_staff_management.sql';
    console.log(`📄 Reading rollback file: ${migrationFile}`);
    
    const sql = fs.readFileSync(migrationFile, 'utf8');
    console.log(`✅ Rollback file loaded (${sql.length} characters)\n`);
    
    console.log('🔄 Executing rollback...');
    const client = await pool.connect();
    
    try {
      await client.query(sql);
      console.log('✅ Rollback executed successfully!\n');
    } catch (error) {
      console.error('❌ Rollback failed:', error.message);
      throw error;
    } finally {
      client.release();
    }
    
    // Verify tables
    console.log('📊 Verifying tables...');
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name IN ('staff', 'submission_students', 'submission_members')
      ORDER BY table_name
    `);
    
    console.log('Current tables:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });
    
    // Check if staff table was removed
    console.log('\n🔍 Verifying staff table removal...');
    const staffTable = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name = 'staff'
    `);
    
    if (staffTable.rows.length === 0) {
      console.log('✅ Staff table successfully removed');
    } else {
      console.log('⚠️  Staff table still exists!');
    }
    
    // Check if submission_students was restored
    console.log('\n🔍 Verifying submission_students restoration...');
    const submissionStudents = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name = 'submission_students'
    `);
    
    if (submissionStudents.rows.length > 0) {
      console.log('✅ submission_students table successfully restored');
      
      // Count records
      const count = await pool.query('SELECT COUNT(*) FROM submission_students');
      console.log(`   Records restored: ${count.rows[0].count}`);
    } else {
      console.log('⚠️  submission_students table not found!');
    }
    
    rl.close();
    await pool.end();
    console.log('\n✅ Rollback completed successfully!');
    console.log('\n📝 Note: To re-apply the migration, run: node run-migration-010.js');
  } catch (error) {
    console.error('\n❌ Rollback failed:', error.message);
    console.error(error);
    rl.close();
    await pool.end();
    process.exit(1);
  }
}

rollbackMigration();
