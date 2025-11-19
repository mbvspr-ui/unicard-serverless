import { query } from './dist/config/database.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    console.log('Running audit log migration...');
    
    const migrationSQL = readFileSync(
      join(__dirname, 'migrations', '004_admin_audit_log.sql'),
      'utf8'
    );
    
    await query(migrationSQL);
    
    console.log('✅ Audit log migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
