import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Set environment variable to allow self-signed certificates
if (process.env.DATABASE_URL?.includes('sslmode=require')) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const poolConfig = {
  connectionString: process.env.DATABASE_URL,
};

if (process.env.DATABASE_URL?.includes('sslmode=require')) {
  poolConfig.ssl = {
    rejectUnauthorized: false,
  };
}

const pool = new Pool(poolConfig);

async function insertTestActivity() {
  try {
    console.log('🧪 Inserting test activity...\n');

    // Get a school ID
    const schoolResult = await pool.query('SELECT id, email, name FROM schools LIMIT 1');
    
    if (schoolResult.rows.length === 0) {
      console.log('❌ No schools found in database');
      process.exit(1);
    }

    const school = schoolResult.rows[0];
    console.log(`📧 Using school: ${school.email}`);

    // Insert a test activity
    const insertResult = await pool.query(`
      INSERT INTO activity_log (
        school_id,
        activity_type,
        entity_type,
        description,
        metadata,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `, [
      school.id,
      'student_updated',
      'student',
      'TEST: Updated student: John Doe',
      JSON.stringify({ test: true, studentName: 'John Doe' })
    ]);

    console.log('✅ Test activity inserted!');
    console.log('\nActivity details:');
    console.log('  ID:', insertResult.rows[0].id);
    console.log('  Type:', insertResult.rows[0].activity_type);
    console.log('  Description:', insertResult.rows[0].description);
    console.log('  Created:', new Date(insertResult.rows[0].created_at).toLocaleString());

    // Verify it's there
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM activity_log WHERE school_id = $1',
      [school.id]
    );
    console.log(`\n📊 Total activities for this school: ${countResult.rows[0].count}`);

    console.log('\n✨ Now refresh your dashboard to see the activity!');
    console.log('   It should appear in the "Recent Activity" section');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

insertTestActivity();
