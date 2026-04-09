import { query } from './src/config/database.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Delete all batch submissions and associated data
 * (Does NOT delete students or staff data)
 */
async function deleteAllSubmissions() {
  try {
    console.log('Starting deletion of all batch submissions...\n');

    // Connect to database
    await query('BEGIN');

    // Delete from submission_members first (foreign key constraint)
    console.log('Deleting submission_members...');
    const membersResult = await query('DELETE FROM submission_members');
    console.log(`  Deleted ${membersResult.rowCount} submission_members records`);

    // Delete from batch_submissions
    console.log('Deleting batch_submissions...');
    const batchResult = await query('DELETE FROM batch_submissions');
    console.log(`  Deleted ${batchResult.rowCount} batch_submissions records`);

    // Commit transaction
    await query('COMMIT');

    console.log('\n✅ All batch submissions deleted successfully!');
    console.log(`   Total records deleted: ${membersResult.rowCount + batchResult.rowCount}`);

  } catch (error) {
    console.error('\n❌ Error deleting submissions:', error);
    await query('ROLLBACK');
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

deleteAllSubmissions();
