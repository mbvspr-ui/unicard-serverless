import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read CA certificate
const caCertPath = path.join(__dirname, '../../ca-certificate.crt');
const ca = fs.existsSync(caCertPath) ? fs.readFileSync(caCertPath, 'utf8') : undefined;

// Database configuration
const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require')
    ? { 
        rejectUnauthorized: false,
        ca: ca
      }
    : undefined,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection cannot be established
};

// Set environment variable to allow self-signed certificates
if (process.env.DATABASE_URL?.includes('sslmode=require')) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// Create connection pool
const pool = new Pool(poolConfig);

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connected successfully at:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Query helper with error handling and retry logic
export const query = async (text: string, params?: any[]): Promise<any> => {
  const start = Date.now();
  let retries = 3;
  let lastError: Error | null = null;

  while (retries > 0) {
    try {
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      
      // Log slow queries in development
      if (process.env.NODE_ENV === 'development' && duration > 1000) {
        console.warn(`⚠️ Slow query (${duration}ms):`, text);
      }
      
      return result;
    } catch (error) {
      lastError = error as Error;
      retries--;
      
      if (retries > 0) {
        console.warn(`Query failed, retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
      }
    }
  }

  // All retries failed
  console.error('Query failed after all retries:', lastError);
  throw lastError;
};

// Transaction helper
export const transaction = async (callback: (client: any) => Promise<any>): Promise<any> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Get a client from the pool (for complex operations)
export const getClient = async () => {
  return await pool.connect();
};

// Close all connections (for graceful shutdown)
export const closePool = async (): Promise<void> => {
  await pool.end();
  console.log('Database pool closed');
};

// Export pool for direct access if needed
export default pool;
