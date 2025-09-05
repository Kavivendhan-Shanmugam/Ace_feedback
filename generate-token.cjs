const jwt = require('jsonwebtoken');

const payload = {
  userId: '550e8400-e29b-41d4-a716-446655440000',
  email: 'admin@feedback.com'
};

const secret = 'your-super-secret-jwt-key-change-this-in-production';
const token = jwt.sign(payload, secret, { expiresIn: '7d' });

console.log('JWT Token:', token);
