const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function testLogin() {
  try {
    // Connect to database
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'feedback_portal'
    });

    // Check if admin user exists
    const [users] = await connection.execute('SELECT * FROM users WHERE email = ?', ['admin@feedback.com']);
    console.log('Users found:', users.length);
    
    if (users.length > 0) {
      console.log('User:', users[0]);
      
      // Test password
      const validPassword = await bcrypt.compare('admin123', users[0].password_hash);
      console.log('Password valid:', validPassword);
    } else {
      console.log('No admin user found');
      
      // Create admin user
      const passwordHash = await bcrypt.hash('admin123', 10);
      console.log('Generated hash:', passwordHash);
      
      const adminId = '550e8400-e29b-41d4-a716-446655440000';
      await connection.execute('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)', [adminId, 'admin@feedback.com', passwordHash]);
      await connection.execute('INSERT INTO profiles (id, first_name, last_name, is_admin, email) VALUES (?, ?, ?, ?, ?)', [adminId, 'Admin', 'User', true, 'admin@feedback.com']);
      
      console.log('Admin user created');
    }
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

testLogin();
