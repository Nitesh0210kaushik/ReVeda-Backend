// Simple API test script
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1';

async function testAPI() {
  console.log('🧪 Testing ReVeda Backend API...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check:', healthResponse.data.message);
    console.log('');

    // Test signup
    console.log('2. Testing user signup...');
    const signupData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phoneNumber: '9876543210'
    };

    try {
      const signupResponse = await axios.post(`${BASE_URL}/auth/signup`, signupData);
      console.log('✅ Signup successful:', signupResponse.data.message);
      console.log('📧 User ID:', signupResponse.data.data.userId);
    } catch (signupError) {
      if (signupError.response?.status === 400) {
        console.log('⚠️ User already exists or validation error');
      } else {
        console.log('❌ Signup error:', signupError.response?.data?.message || signupError.message);
      }
    }
    console.log('');

    // Test login
    console.log('3. Testing user login...');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        identifier: 'john.doe@example.com'
      });
      console.log('✅ Login OTP sent:', loginResponse.data.message);
    } catch (loginError) {
      console.log('❌ Login error:', loginError.response?.data?.message || loginError.message);
    }
    console.log('');

    console.log('🎉 API tests completed!');
    console.log('📝 Note: OTP verification requires actual email setup');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the server is running: npm run dev');
    }
  }
}

// Run tests
testAPI();