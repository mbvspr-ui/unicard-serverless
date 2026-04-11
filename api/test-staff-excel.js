import { query } from './src/config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function testStaffExcel() {
  try {
    console.log('Testing staff Excel export...\n');

    // Check if there are any batches with staff
    const batchCheck = await query(`
      SELECT bs.id, bs.school_id, COUNT(CASE WHEN sm.member_type = 'staff' THEN 1 END) as staff_count 
      FROM batch_submissions bs 
      LEFT JOIN submission_members sm ON bs.id = sm.submission_id 
      GROUP BY bs.id 
      HAVING COUNT(CASE WHEN sm.member_type = 'staff' THEN 1 END) > 0 
      LIMIT 1
    `);

    if (batchCheck.rows.length === 0) {
      console.log('No batches with staff found. Creating a test batch...\n');
      
      // Get first school
      const school = await query('SELECT id FROM schools LIMIT 1');
      if (school.rows.length === 0) {
        console.log('No schools found. Exiting.');
        process.exit(1);
      }

      const schoolId = school.rows[0].id;
      console.log(`Using school: ${schoolId}`);

      // Get first staff member
      const staff = await query('SELECT id FROM staff LIMIT 1');
      if (staff.rows.length === 0) {
        console.log('No staff found. Exiting.');
        process.exit(1);
      }

      const staffId = staff.rows[0].id;
      console.log(`Using staff: ${staffId}`);

      // Create test batch
      const batch = await query(`
        INSERT INTO batch_submissions (school_id, status) 
        VALUES ($1, 'submitted') 
        RETURNING id
      `, [schoolId]);

      const batchId = batch.rows[0].id;
      console.log(`Created batch: ${batchId}`);

      // Add staff to batch
      await query(`
        INSERT INTO submission_members (submission_id, member_type, member_id) 
        VALUES ($1, 'staff', $2)
      `, [batchId, staffId]);
      console.log(`Added staff to batch\n`);

      // Now test the staff Excel export
      console.log('Testing staff Excel export for batch:', batchId);
      
      // Get staff data
      const staffData = await query(`
        SELECT 
          st.id,
          st.name, 
          st.father_spouse_name, 
          st.date_of_birth, 
          st.gender,
          st.phone_number, 
          st.blood_group, 
          st.address, 
          st.state,
          st.district, 
          st.city, 
          st.pincode,
          st.designation, 
          st.department, 
          st.employee_id,
          st.staff_type,
          st.date_of_joining, 
          st.qualification, 
          st.experience_years,
          st.id as photo
        FROM staff st
        JOIN submission_members sm ON st.id = sm.member_id
        WHERE sm.submission_id = $1 AND sm.member_type = 'staff'
        ORDER BY st.name
      `, [batchId]);

      console.log('Staff data retrieved:', staffData.rows.length, 'records');
      console.log('Sample staff:', JSON.stringify(staffData.rows[0], null, 2));

    } else {
      const batchId = batchCheck.rows[0].id;
      console.log('Found batch with staff:', batchId);

      // Get staff data
      const staffData = await query(`
        SELECT 
          st.id,
          st.name, 
          st.father_spouse_name, 
          st.date_of_birth, 
          st.gender,
          st.phone_number, 
          st.blood_group, 
          st.address, 
          st.state,
          st.district, 
          st.city, 
          st.pincode,
          st.designation, 
          st.department, 
          st.employee_id,
          st.staff_type,
          st.date_of_joining, 
          st.qualification, 
          st.experience_years,
          st.id as photo
        FROM staff st
        JOIN submission_members sm ON st.id = sm.member_id
        WHERE sm.submission_id = $1 AND sm.member_type = 'staff'
        ORDER BY st.name
      `, [batchId]);

      console.log('Staff data retrieved:', staffData.rows.length, 'records');
      console.log('Sample staff:', JSON.stringify(staffData.rows[0], null, 2));
    }

    console.log('\n✅ Test completed successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

testStaffExcel();
