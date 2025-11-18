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

async function testActivities() {
  try {
    console.log('🔍 Testing activity_log table...\n');

    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'activity_log'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ activity_log table does NOT exist!');
      console.log('   Run: node run-activity-migration.js');
      process.exit(1);
    }

    console.log('✅ activity_log table exists');

    // Count activities
    const countResult = await pool.query('SELECT COUNT(*) FROM activity_log');
    const count = parseInt(countResult.rows[0].count);
    console.log(`📊 Total activities in database: ${count}`);

    // Get recent activities
    const recentResult = await pool.query(`
      SELECT 
        activity_type,
        description,
        created_at,
        (SELECT email FROM schools WHERE id = activity_log.school_id) as school_email
      FROM activity_log
      ORDER BY created_at DESC
      LIMIT 5
    `);

    if (recentResult.rows.length > 0) {
      console.log('\n📝 Recent activities:');
      recentResult.rows.forEach((row, i) => {
        console.log(`   ${i + 1}. [${row.activity_type}] ${row.description}`);
        console.log(`      School: ${row.school_email}`);
        console.log(`      Time: ${new Date(row.created_at).toLocaleString()}`);
      });
    } else {
      console.log('\n⚠️  No activities found in database');
      console.log('   Activities will be created when you:');
      console.log('   - Add a student');
      console.log('   - Update a student');
      console.log('   - Submit a batch');
      console.log('   - Update your profile');
      console.log('   - Upload logo/signature');
    }

    // Test with a specific school
    console.log('\n🔍 Checking schools...');
    const schoolsResult = await pool.query('SELECT id, email, name FROM schools LIMIT 5');
    console.log(`   Found ${schoolsResult.rows.length} schools`);
    
    if (schoolsResult.rows.length > 0) {
      const school = schoolsResult.rows[0];
      console.log(`\n   Testing with school: ${school.email}`);
      
      const schoolActivities = await pool.query(
        'SELECT COUNT(*) FROM activity_log WHERE school_id = $1',
        [school.id]
      );
      console.log(`   Activities for this school: ${schoolActivities.rows[0].count}`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === '42P01') {
      console.log('\n💡 The activity_log table does not exist.');
      console.log('   Run: node run-activity-migration.js');
    }
  } finally {
    await pool.end();
  }
}

testActivities();
