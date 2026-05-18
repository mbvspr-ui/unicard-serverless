import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Run database migrations
 */
export const runMigrations = async (): Promise<void> => {
  const migrationsDir = path.join(__dirname, '../../migrations');
  
  try {
    // Check if migrations directory exists
    if (!fs.existsSync(migrationsDir)) {
      console.log('No migrations directory found');
      return;
    }

    // Get all SQL files
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('No migration files found');
      return;
    }

    console.log(`Found ${files.length} migration file(s)`);

    // Run each migration
    for (const file of files) {
      console.log(`\n📄 Running migration: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      try {
        await pool.query(sql);
        console.log(`✅ Migration ${file} completed successfully`);
      } catch (error: any) {
        // Check if error is due to objects already existing
        if (error.code === '42P07' || error.code === '42710') {
          console.log(`⚠️  Migration ${file} - Objects already exist, skipping`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n✅ All migrations completed successfully\n');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
};

// Run migrations if this file is executed directly
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  runMigrations()
    .then(() => {
      console.log('Migration process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration process failed:', error);
      process.exit(1);
    });
}
