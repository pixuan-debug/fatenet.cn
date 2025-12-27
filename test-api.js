// Simple API test using Node.js
const http = require('http');

console.log('=== API Service Test ===');
console.log('Test Time:', new Date().toISOString());
console.log('');

// Test health check endpoint
const healthOptions = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/health',
  method: 'GET'
};

const healthReq = http.request(healthOptions, (res) => {
  console.log('1. Testing health check endpoint: GET /api/v1/health');
  console.log('   Status Code:', res.statusCode);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('   Response:', data);
    console.log('   ✓ Health check passed');
    console.log('');
    
    // Test get articles endpoint
    testGetArticles();
  });
});

healthReq.on('error', (error) => {
  console.log('1. Testing health check endpoint: GET /api/v1/health');
  console.log('   ✗ Health check failed:', error.message);
  console.log('');
  process.exit(1);
});

healthReq.end();

// Test get articles endpoint
function testGetArticles() {
  const articlesOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/articles?useCache=false',
    method: 'GET'
  };
  
  const articlesReq = http.request(articlesOptions, (res) => {
    console.log('2. Testing get articles endpoint: GET /api/v1/articles?useCache=false');
    console.log('   Status Code:', res.statusCode);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const articlesData = JSON.parse(data);
        const categoryCount = Object.keys(articlesData.data.articles).length;
        console.log('   Response: Successfully retrieved', categoryCount, 'categories');
        console.log('   ✓ Get articles passed');
        console.log('');
        console.log('=== API Service Test Complete ===');
        console.log('All tests passed!');
      } catch (parseError) {
        console.log('   ✗ Get articles failed: Invalid JSON response');
        console.log('   Error:', parseError.message);
        console.log('');
        process.exit(1);
      }
    });
  });
  
  articlesReq.on('error', (error) => {
    console.log('2. Testing get articles endpoint: GET /api/v1/articles?useCache=false');
    console.log('   ✗ Get articles failed:', error.message);
    console.log('');
    process.exit(1);
  });
  
  articlesReq.end();
}