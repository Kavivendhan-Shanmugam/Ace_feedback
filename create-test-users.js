import bcrypt from 'bcryptjs';
import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

// Create connection
const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'feedback_portal'
});

const createTestUsers = async () => {
  try {
    console.log('🔐 Creating test users...');

    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const studentPassword = await bcrypt.hash('test123', 10);

    // Create admin user
    const adminId = 'admin-uuid-' + Date.now();
    await new Promise((resolve, reject) => {
      connection.query(
        'INSERT IGNORE INTO users (id, email, password_hash) VALUES (?, ?, ?)',
        [adminId, 'admin@feedback.com', adminPassword],
        (err, result) => err ? reject(err) : resolve(result)
      );
    });

    // Create admin profile
    await new Promise((resolve, reject) => {
      connection.query(
        'INSERT IGNORE INTO profiles (id, first_name, last_name, is_admin, email) VALUES (?, ?, ?, ?, ?)',
        [adminId, 'Admin', 'User', true, 'admin@feedback.com'],
        (err, result) => err ? reject(err) : resolve(result)
      );
    });

    // Create student user
    const studentId = 'student-uuid-' + Date.now();
    await new Promise((resolve, reject) => {
      connection.query(
        'INSERT IGNORE INTO users (id, email, password_hash) VALUES (?, ?, ?)',
        [studentId, 'student@test.com', studentPassword],
        (err, result) => err ? reject(err) : resolve(result)
      );
    });

    // Create student profile
    await new Promise((resolve, reject) => {
      connection.query(
        'INSERT IGNORE INTO profiles (id, first_name, last_name, is_admin, email) VALUES (?, ?, ?, ?, ?)',
        [studentId, 'Test', 'Student', false, 'student@test.com'],
        (err, result) => err ? reject(err) : resolve(result)
      );
    });

    console.log('✅ Test users created successfully!');
    console.log('');
    console.log('🔑 LOGIN CREDENTIALS:');
    console.log('');
    console.log('👑 ADMIN USER:');
    console.log('   Email: admin@feedback.com');
    console.log('   Password: admin123');
    console.log('');
    console.log('👤 TEST STUDENT USER:');
    console.log('   Email: student@test.com');
    console.log('   Password: test123');
    console.log('');
    console.log('🌐 Go to: http://localhost:8080/login');
    
  } catch (error) {
    console.error('❌ Error creating test users:', error);
  } finally {
    connection.end();
    process.exit(0);
  }
};

createTestUsers();
