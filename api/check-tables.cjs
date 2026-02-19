const { Pool } = require('pg');
require('dotenv').config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkTables() {
  try {
    console.log('🔍 Checking database tables...\n');

    // Check if submission_members exists
    const membersCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'submission_members'
      );
    `);
    
    console.log('submission_members table exists:', membersCheck.rows[0].exists);

    // Check if submission_students exists
    const studentsCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'submission_students'
      );
    `);
    
    console.log('submission_students table exists:', studentsCheck.rows[0].exists);

    // Check if staff table exists
    const staffCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'staff'
      );
    `);
    
    console.log('staff table exists:', staffCheck.rows[0].exists);

    // If submission_members exists, check its structure
    if (membersCheck.rows[0].exists) {
      const columns = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'submission_members'
        ORDER BY ordinal_position;
      `);
      
      console.log('\nsubmission_members columns:');
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    }

    await pool.end();
    console.log('\n✅ Check complete');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkTables();
