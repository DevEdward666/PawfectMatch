import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
const useSSL = process.env.NODE_ENV === 'production' || process.env.PGSSLMODE === 'require';

// Database connection using environment variables
const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'petshop',
  port: parseInt(process.env.PGPORT || '5432'),
  ssl: { rejectUnauthorized: false }, 
});

// Test the database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
  } else {
    console.log('✅ Database connected successfully at:', res.rows[0].now);
  }
});

// Export the drizzle instance
export const db = drizzle(pool);
