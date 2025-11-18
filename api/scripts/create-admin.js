import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : false,
});

async function createAdmin() {
  const email = process.argv[2] || 'admin@unicard.com';
  const password = process.argv[3] || 'Admin@123';
  const role = process.argv[4] || 'admin';

  try {
    console.log('🔧 Creating admin user...');
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Role: ${role}`);
    console.log('');

    // Check if admin already exists
    const checkQuery = 'SELECT id FROM admins WHERE email = $1';
    const existing = await pool.query(checkQuery, [email]);

    if (existing.rows.length > 0) {
      console.log('❌ Admin user already exists with this email');
      console.log('💡 Use a different email or delete the existing admin first');
      process.exit(1);
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert admin
    const insertQuery = `
      INSERT INTO admins (email, password_hash, role)
      VALUES ($1, $2, $3)
      RETURNING id, email, role, created_at
    `;
    const result = await pool.query(insertQuery, [email, passwordHash, role]);

    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('📋 Details:');
    console.log(`   ID: ${result.rows[0].id}`);
    console.log(`   Email: ${result.rows[0].email}`);
    console.log(`   Role: ${result.rows[0].role}`);
    console.log(`   Created: ${result.rows[0].created_at}`);
    console.log('');
    console.log('🔑 Login credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('');
    console.log('⚠️  IMPORTANT: Please change the password after first login!');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Check DATABASE_URL is set correctly');
    console.error('2. Verify database migration has been run');
    console.error('3. Ensure database is accessible');
    console.error('');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Display usage if --help is provided
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('');
  console.log('📖 Admin User Creation Script');
  console.log('');
  console.log('Usage:');
  console.log('  node scripts/create-admin.js [email] [password] [role]');
  console.log('');
  console.log('Arguments:');
  console.log('  email    - Admin email address (default: admin@unicard.com)');
  console.log('  password - Admin password (default: Admin@123)');
  console.log('  role     - Admin role: admin or super_admin (default: admin)');
  console.log('');
  console.log('Examples:');
  console.log('  # Create admin with default credentials');
  console.log('  node scripts/create-admin.js');
  console.log('');
  console.log('  # Create admin with custom email and password');
  console.log('  node scripts/create-admin.js admin@example.com MyPassword123');
  console.log('');
  console.log('  # Create super admin');
  console.log('  node scripts/create-admin.js superadmin@example.com SecurePass456 super_admin');
  console.log('');
  process.exit(0);
}

createAdmin();
