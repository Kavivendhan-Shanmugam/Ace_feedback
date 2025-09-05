const fetch = require('node-fetch');

async function testStudentCreation() {
  try {
    console.log('Testing student creation API...');
    
    const response = await fetch('http://localhost:3001/api/students', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dummy-token'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        batchId: 1,
        semesterNumber: 3
      })
    });

    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testStudentCreation();
