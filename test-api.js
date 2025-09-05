// Test API endpoints
const testApi = async () => {
  try {
    console.log('🔍 Testing API endpoints...');

    // Test health endpoint
    const healthResponse = await fetch('http://localhost:3001/api/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);

    // Test login
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@feedback.com',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('🔐 Login response:', loginData);

    if (loginData.token) {
      console.log('✅ Login successful, testing subjects endpoint...');
      
      // Test subjects endpoint
      const subjectsResponse = await fetch('http://localhost:3001/api/subjects', {
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json',
        }
      });
      
      const subjectsData = await subjectsResponse.json();
      console.log('📚 Subjects response:', subjectsData);
      
      if (Array.isArray(subjectsData) && subjectsData.length === 0) {
        console.log('⚠️  No subjects found in database. Let me create a test subject...');
        
        // Create a test subject
        const createSubjectResponse = await fetch('http://localhost:3001/api/subjects', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${loginData.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'Mathematics',
            period: 1,
            batchId: null,
            semesterNumber: 1
          })
        });
        
        const newSubject = await createSubjectResponse.json();
        console.log('📝 Created test subject:', newSubject);
      }
    }

  } catch (error) {
    console.error('❌ Error testing API:', error);
  }
};

testApi();
