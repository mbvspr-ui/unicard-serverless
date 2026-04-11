import { query } from './src/config/database.js';
import dotenv from 'dotenv';
dotenv.config();

const result = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'staff' ORDER BY ordinal_position");
console.log('Staff table columns:');
result.rows.forEach(row => console.log(' -', row.column_name));
process.exit(0);
