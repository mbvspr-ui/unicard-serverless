require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Read SSL certificate
const sslCert = fs.readFileSync(path.join(__dirname, 'ca-certificate.crt'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkSubmissions() {
  try {
    console.log('Checking batch submissions...\n');
    
    // Get all batch submissions
    const batchQuery = `
      SELECT 
        bs.id,
        bs.school_id,
        bs.status,
        bs.submitted_at,
        bs.processed_at,
        s.name as school_name,
        s.email as school_email,
        COUNT(ss.student_id) as student_count
      FROM batch_submissions bs
      LEFT JOIN schools s ON bs.school_id = s.id
      LEFT JOIN submission_students ss ON bs.id = ss.submission_id
      GROUP BY bs.id, bs.school_id, bs.status, bs.submitted_at, bs.processed_at, s.name, s.email
      ORDER BY bs.submitted_at DESC
      LIMIT 10
    `;
    
    const result = await pool.query(batchQuery);
    
    if (result.rows.length === 0) {
      console.log('❌ No batch submissions found in database');
    } else {
      console.log(`✅ Found ${result.rows.length} batch submission(s):\n`);
      result.rows.forEach((row, index) => {
        console.log(`${index + 1}. Submission ID: ${row.id}`);
        console.log(`   School: ${row.school_name} (${row.school_email})`);
        console.log(`   School ID: ${row.school_id}`);
        console.log(`   Status: ${row.status}`);
        console.log(`   Students: ${row.student_count}`);
        console.log(`   Submitted: ${row.submitted_at}`);
        console.log(`   Processed: ${row.processed_at || 'Not yet'}`);
        console.log('');
      });
    }
    
    // Check for any pending submissions
    const pendingQuery = `
      SELECT COUNT(*) as count
      FROM batch_submissions
      WHERE status IN ('submitted', 'processing')
    `;
    
    const pendingResult = await pool.query(pendingQuery);
    console.log(`📊 Pending/Processing submissions: ${pendingResult.rows[0].count}`);
    
    // Check total students in submissions
    const studentQuery = `
      SELECT COUNT(DISTINCT student_id) as count
      FROM submission_students
    `;
    
    const studentResult = await pool.query(studentQuery);
    console.log(`👥 Total unique students in submissions: ${studentResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

checkSubmissions();
