import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

// Create connection pool for better performance
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'feedback_portal',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
});

// Get promise-based pool
const promisePool = pool.promise();

// Test the connection
const testConnection = async () => {
  try {
    const [rows] = await promisePool.execute('SELECT 1 as test');
    console.log('✅ MySQL database connected successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error connecting to MySQL database:', error.message);
    return false;
  }
};

// Initialize database and tables
const initializeDatabase = async () => {
  try {
    // Create database if it doesn't exist
    const connection = mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
    });

    await new Promise((resolve, reject) => {
      connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'feedback_portal'}\``, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    connection.end();

    // Test connection to the specific database
    await testConnection();
    
    return true;
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    return false;
  }
};

export {
  promisePool as pool,
  testConnection,
  initializeDatabase
};
