import fs from 'fs';
import path from 'path';

/**
 * Test script for migration 010
 * Validates migration SQL files without requiring database connection
 */

console.log('🧪 Testing Migration 010: Staff Management\n');

// Test 1: Check migration files exist
console.log('📋 Test 1: Checking migration files...');
const migrationFile = './migrations/010_add_staff_management.sql';
const rollbackFile = './migrations/010_rollback_staff_management.sql';

if (!fs.existsSync(migrationFile)) {
  console.error('❌ Migration file not found:', migrationFile);
  process.exit(1);
}
console.log('✅ Forward migration file exists');

if (!fs.existsSync(rollbackFile)) {
  console.error('❌ Rollback file not found:', rollbackFile);
  process.exit(1);
}
console.log('✅ Rollback migration file exists\n');

// Test 2: Validate migration SQL syntax
console.log('📋 Test 2: Validating SQL syntax...');
const migrationSQL = fs.readFileSync(migrationFile, 'utf8');
const rollbackSQL = fs.readFileSync(rollbackFile, 'utf8');

// Check for required SQL statements in forward migration
const requiredStatements = [
  'CREATE TABLE IF NOT EXISTS staff',
  'CREATE TABLE IF NOT EXISTS submission_members',
  'INSERT INTO submission_members',
  'DROP TABLE IF EXISTS submission_students',
  'CREATE INDEX',
  'CHECK (staff_type IN',
  'CHECK (member_type IN'
];

let allFound = true;
requiredStatements.forEach(stmt => {
  if (!migrationSQL.includes(stmt)) {
    console.error(`❌ Missing required statement: ${stmt}`);
    allFound = false;
  }
});

if (allFound) {
  console.log('✅ All required SQL statements found in forward migration');
}

// Check for required SQL statements in rollback
const rollbackStatements = [
  'CREATE TABLE IF NOT EXISTS submission_students',
  'INSERT INTO submission_students',
  'DROP TABLE IF EXISTS submission_members',
  'DROP TABLE IF EXISTS staff'
];

let allRollbackFound = true;
rollbackStatements.forEach(stmt => {
  if (!rollbackSQL.includes(stmt)) {
    console.error(`❌ Missing required rollback statement: ${stmt}`);
    allRollbackFound = false;
  }
});

if (allRollbackFound) {
  console.log('✅ All required SQL statements found in rollback migration\n');
}

// Test 3: Check staff table columns
console.log('📋 Test 3: Validating staff table structure...');
const staffColumns = [
  'id UUID PRIMARY KEY',
  'school_id UUID NOT NULL',
  'name VARCHAR(255) NOT NULL',
  'father_spouse_name VARCHAR(255)',
  'date_of_birth DATE',
  'gender VARCHAR(20)',
  'phone_number VARCHAR(20)',
  'blood_group VARCHAR(10)',
  'photo_url TEXT',
  'employee_id VARCHAR(50)',
  'staff_type VARCHAR(50) NOT NULL',
  'designation VARCHAR(100) NOT NULL',
  'department VARCHAR(100)',
  'date_of_joining DATE',
  'qualification VARCHAR(255)',
  'address TEXT',
  'state VARCHAR(100) NOT NULL',
  'district VARCHAR(100) NOT NULL',
  'city VARCHAR(100) NOT NULL',
  'pincode VARCHAR(6) NOT NULL',
  'emergency_contact_name VARCHAR(255)',
  'emergency_contact_number VARCHAR(20)',
  'emergency_contact_relationship VARCHAR(50)',
  'created_at TIMESTAMP',
  'updated_at TIMESTAMP'
];

let allColumnsFound = true;
staffColumns.forEach(col => {
  if (!migrationSQL.includes(col)) {
    console.error(`❌ Missing staff column: ${col}`);
    allColumnsFound = false;
  }
});

if (allColumnsFound) {
  console.log('✅ All staff table columns defined correctly');
}

// Test 4: Check indexes
console.log('\n📋 Test 4: Validating indexes...');
const requiredIndexes = [
  'idx_staff_school_id',
  'idx_staff_name',
  'idx_staff_employee_id',
  'idx_staff_type',
  'idx_staff_department',
  'idx_staff_created_at',
  'idx_submission_members_submission_id',
  'idx_submission_members_member_id',
  'idx_submission_members_lookup'
];

let allIndexesFound = true;
requiredIndexes.forEach(idx => {
  if (!migrationSQL.includes(idx)) {
    console.error(`❌ Missing index: ${idx}`);
    allIndexesFound = false;
  }
});

if (allIndexesFound) {
  console.log('✅ All required indexes defined');
}

// Test 5: Check constraints
console.log('\n📋 Test 5: Validating constraints...');
const constraints = [
  "CHECK (gender IN ('Male', 'Female', 'Other', NULL))",
  "CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', NULL))",
  "CHECK (staff_type IN ('Teaching', 'Non-Teaching', 'Administrative', 'Support'))",
  "CHECK (member_type IN ('student', 'staff'))",
  'UNIQUE(submission_id, member_type, member_id)'
];

let allConstraintsFound = true;
constraints.forEach(constraint => {
  if (!migrationSQL.includes(constraint)) {
    console.error(`❌ Missing constraint: ${constraint}`);
    allConstraintsFound = false;
  }
});

if (allConstraintsFound) {
  console.log('✅ All constraints defined correctly');
}

// Test 6: Check foreign keys
console.log('\n📋 Test 6: Validating foreign keys...');
const foreignKeys = [
  'REFERENCES schools(id) ON DELETE CASCADE',
  'REFERENCES batch_submissions(id) ON DELETE CASCADE'
];

let allForeignKeysFound = true;
foreignKeys.forEach(fk => {
  if (!migrationSQL.includes(fk)) {
    console.error(`❌ Missing foreign key: ${fk}`);
    allForeignKeysFound = false;
  }
});

if (allForeignKeysFound) {
  console.log('✅ All foreign keys defined correctly');
}

// Test 7: Check data migration logic
console.log('\n📋 Test 7: Validating data migration logic...');
const dataMigrationChecks = [
  "INSERT INTO submission_members (submission_id, member_type, member_id",
  "'student' as member_type",
  "student_id as member_id",
  "FROM submission_students",
  "ON CONFLICT (submission_id, member_type, member_id) DO NOTHING"
];

let dataMigrationValid = true;
dataMigrationChecks.forEach(check => {
  if (!migrationSQL.includes(check)) {
    console.error(`❌ Missing data migration logic: ${check}`);
    dataMigrationValid = false;
  }
});

if (dataMigrationValid) {
  console.log('✅ Data migration logic is correct');
}

// Test 8: Check triggers
console.log('\n📋 Test 8: Validating triggers...');
if (migrationSQL.includes('CREATE TRIGGER update_staff_updated_at')) {
  console.log('✅ Updated_at trigger defined for staff table');
} else {
  console.error('❌ Missing updated_at trigger for staff table');
}

// Test 9: Check comments
console.log('\n📋 Test 9: Validating documentation comments...');
const comments = [
  "COMMENT ON TABLE staff",
  "COMMENT ON TABLE submission_members",
  "COMMENT ON COLUMN staff.staff_type",
  "COMMENT ON COLUMN submission_members.member_type"
];

let allCommentsFound = true;
comments.forEach(comment => {
  if (!migrationSQL.includes(comment)) {
    console.error(`❌ Missing comment: ${comment}`);
    allCommentsFound = false;
  }
});

if (allCommentsFound) {
  console.log('✅ All documentation comments present');
}

// Test 10: Validate rollback completeness
console.log('\n📋 Test 10: Validating rollback completeness...');
const rollbackChecks = [
  'CREATE TABLE IF NOT EXISTS submission_students',
  "INSERT INTO submission_students (submission_id, student_id)",
  "WHERE member_type = 'student'",
  'DROP TABLE IF EXISTS submission_members',
  'DROP TABLE IF EXISTS staff CASCADE'
];

let rollbackComplete = true;
rollbackChecks.forEach(check => {
  if (!rollbackSQL.includes(check)) {
    console.error(`❌ Missing rollback logic: ${check}`);
    rollbackComplete = false;
  }
});

if (rollbackComplete) {
  console.log('✅ Rollback migration is complete');
}

// Test 11: Check runner scripts
console.log('\n📋 Test 11: Checking runner scripts...');
const runnerScript = './run-migration-010.js';
const rollbackScript = './run-migration-010-rollback.js';

if (!fs.existsSync(runnerScript)) {
  console.error('❌ Runner script not found:', runnerScript);
  process.exit(1);
}
console.log('✅ Forward migration runner exists');

if (!fs.existsSync(rollbackScript)) {
  console.error('❌ Rollback runner script not found:', rollbackScript);
  process.exit(1);
}
console.log('✅ Rollback migration runner exists');

// Test 12: Validate runner script content
console.log('\n📋 Test 12: Validating runner scripts...');
const runnerContent = fs.readFileSync(runnerScript, 'utf8');
const rollbackContent = fs.readFileSync(rollbackScript, 'utf8');

const runnerChecks = [
  'import pg from',
  'import dotenv from',
  'const pool = new Pool',
  'fs.readFileSync(migrationFile',
  'await client.query(sql)',
  'Verifying tables',
  'Verifying staff table structure',
  'Verifying submission_members table structure'
];

let runnerValid = true;
runnerChecks.forEach(check => {
  if (!runnerContent.includes(check)) {
    console.error(`❌ Missing in runner script: ${check}`);
    runnerValid = false;
  }
});

if (runnerValid) {
  console.log('✅ Forward migration runner is valid');
}

const rollbackRunnerChecks = [
  'import readline from',
  'askQuestion',
  'Are you sure you want to proceed',
  'ROLLBACK WARNING',
  'Delete the staff table and ALL staff data'
];

let rollbackRunnerValid = true;
rollbackRunnerChecks.forEach(check => {
  if (!rollbackContent.includes(check)) {
    console.error(`❌ Missing in rollback runner: ${check}`);
    rollbackRunnerValid = false;
  }
});

if (rollbackRunnerValid) {
  console.log('✅ Rollback migration runner is valid');
}

// Final summary
console.log('\n' + '='.repeat(60));
console.log('📊 MIGRATION TEST SUMMARY');
console.log('='.repeat(60));

const allTestsPassed = 
  allFound && 
  allRollbackFound && 
  allColumnsFound && 
  allIndexesFound && 
  allConstraintsFound && 
  allForeignKeysFound && 
  dataMigrationValid && 
  allCommentsFound && 
  rollbackComplete && 
  runnerValid && 
  rollbackRunnerValid;

if (allTestsPassed) {
  console.log('✅ ALL TESTS PASSED');
  console.log('\nMigration 010 is ready to be applied to the database.');
  console.log('\nNext steps:');
  console.log('1. Ensure DATABASE_URL is configured in api/.env');
  console.log('2. Run: cd api && node run-migration-010.js');
  console.log('3. Verify migration success');
  console.log('4. Test staff creation via API');
  console.log('\nTo rollback:');
  console.log('  cd api && node run-migration-010-rollback.js');
} else {
  console.log('❌ SOME TESTS FAILED');
  console.log('\nPlease fix the issues above before applying the migration.');
  process.exit(1);
}

console.log('='.repeat(60) + '\n');
