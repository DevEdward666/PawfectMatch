// Database initialization script
require('dotenv').config();
const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const schema = require('../shared/schema');
const bcrypt = require('bcrypt');

// Initialize database connection
const pool = new Pool({   connectionString: process.env.DATABASE_URL + '?sslmode=require'});
const db = drizzle(pool, { schema });

// Function to check if a table exists
async function tableExists(tableName) {
  const result = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = $1
    );
  `, [tableName]);
  
  return result.rows[0].exists;
}

// Function to create database schema
async function createSchema() {
  try {
    // Check if users table exists
    const hasUsersTable = await tableExists('users');
    
    if (!hasUsersTable) {
      console.log('Creating database tables...');
      
      // Create types
      await pool.query(`
        CREATE TYPE IF NOT EXISTS user_role AS ENUM ('admin', 'user');
        CREATE TYPE IF NOT EXISTS pet_status AS ENUM ('available', 'adopted', 'pending');
        CREATE TYPE IF NOT EXISTS report_status AS ENUM ('pending', 'reviewing', 'resolved');
        CREATE TYPE IF NOT EXISTS product_category AS ENUM ('food', 'toys', 'accessories', 'grooming', 'other');
      `);
      
      // Create users table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          role user_role NOT NULL DEFAULT 'user',
          phone VARCHAR(20),
          address TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      
      // Create pets table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS pets (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          species VARCHAR(100) NOT NULL,
          breed VARCHAR(100),
          age INTEGER,
          gender VARCHAR(20),
          description TEXT,
          image_url TEXT,
          status pet_status NOT NULL DEFAULT 'available',
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      
      // Create products table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          price DECIMAL(10, 2) NOT NULL,
          image_url TEXT,
          category product_category NOT NULL DEFAULT 'other',
          stock INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      
      // Create adoption_applications table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS adoption_applications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          message TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      
      // Create messages table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          subject VARCHAR(255),
          content TEXT NOT NULL,
          is_read BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      
      // Create reports table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS reports (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          location TEXT,
          image_url TEXT,
          status report_status NOT NULL DEFAULT 'pending',
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      
      // Create report_responses table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS report_responses (
          id SERIAL PRIMARY KEY,
          report_id INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
          admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          response TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      
      console.log('Database tables created successfully');
      
      // Create default admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await db.insert(schema.users).values({
        name: 'Admin User',
        email: 'admin@petshop.com',
        password: hashedPassword,
        role: 'admin'
      });
      
      console.log('Default admin user created: admin@petshop.com / admin123');
    } else {
      console.log('Database tables already exist');
    }
  } catch (error) {
    console.error('Error creating schema:', error);
    throw error;
  }
}

// Function to drop all tables (use with caution)
async function dropSchema() {
  try {
    console.log('Dropping all tables...');
    
    await pool.query(`
      DROP TABLE IF EXISTS report_responses CASCADE;
      DROP TABLE IF EXISTS reports CASCADE;
      DROP TABLE IF EXISTS messages CASCADE;
      DROP TABLE IF EXISTS adoption_applications CASCADE;
      DROP TABLE IF EXISTS products CASCADE;
      DROP TABLE IF EXISTS pets CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      
      DROP TYPE IF EXISTS user_role CASCADE;
      DROP TYPE IF EXISTS pet_status CASCADE;
      DROP TYPE IF EXISTS report_status CASCADE;
      DROP TYPE IF EXISTS product_category CASCADE;
    `);
    
    console.log('All tables dropped successfully');
  } catch (error) {
    console.error('Error dropping schema:', error);
    throw error;
  }
}

// Main function to initialize database
async function initializeDatabase() {
  try {
    // Uncomment the line below if you want to recreate the database from scratch
    // await dropSchema();
    
    await createSchema();
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
  } finally {
    // Close the database connection pool
    await pool.end();
  }
}

// Run the initialization
initializeDatabase();