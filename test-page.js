// Test if static files are being served correctly
const http = require('http');

console.log('=== Testing Static File Server ===');
console.log('Test Time:', new Date().toISOString());
console.log('');

// Test URLs to check
const testUrls = [
  '/admin.html',
  '/articles.html',
  '/article-detail.html?id=1&category=basic-theory',
  '/index.html'
];

// Run tests for each URL
let completedTests = 0;
const totalTests = testUrls.length;

testUrls.forEach(url => {
  console.log(`Testing: http://localhost:8080${url}`);
  
  const options = {
    hostname: 'localhost',
    port: 8080,
    path: url,
    method: 'GET'
  };
  
  const req = http.request(options, (res) => {
    console.log(`  Status Code: ${res.statusCode}`);
    console.log(`  Content-Type: ${res.headers['content-type']}`);
    
    // Check if response is HTML
    if (res.statusCode === 200 && res.headers['content-type'].includes('text/html')) {
      console.log(`  ✓ ${url} is accessible and serving HTML`);
    } else {
      console.log(`  ✗ ${url} is not accessible or not serving HTML`);
    }
    
    console.log('');
    
    completedTests++;
    if (completedTests === totalTests) {
      console.log('=== Static File Server Test Complete ===');
      console.log('All tests completed!');
    }
  });
  
  req.on('error', (error) => {
    console.log(`  ✗ ${url} request failed: ${error.message}`);
    console.log('');
    
    completedTests++;
    if (completedTests === totalTests) {
      console.log('=== Static File Server Test Complete ===');
      console.log('All tests completed!');
    }
  });
  
  req.end();
});