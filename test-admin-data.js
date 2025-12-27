// Test if admin.html loads data from API correctly
// This script simulates the browser's API requests
const http = require('http');

console.log('=== Testing Admin Page Data Loading ===');
console.log('Test Time:', new Date().toISOString());
console.log('');

// Simulate the API requests that admin.html would make
const apiEndpoints = [
  {
    name: 'Get Articles from API',
    url: '/api/v1/articles?useCache=false',
    method: 'GET'
  },
  {
    name: 'Health Check',
    url: '/api/v1/health',
    method: 'GET'
  }
];

// Run tests for each API endpoint
let completedTests = 0;
const totalTests = apiEndpoints.length;

apiEndpoints.forEach(endpoint => {
  console.log(`Testing: ${endpoint.name}`);
  console.log(`  Request: ${endpoint.method} ${endpoint.url}`);
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: endpoint.url,
    method: endpoint.method
  };
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`  Status Code: ${res.statusCode}`);
      
      if (res.statusCode === 200) {
        try {
          const apiResponse = JSON.parse(data);
          
          if (endpoint.name === 'Get Articles from API') {
            const categoryCount = Object.keys(apiResponse.data.articles || {}).length;
            console.log(`  ✅ Successfully retrieved ${categoryCount} article categories`);
            
            // Check if articles have non-zero views and likes
            let hasNonZeroData = false;
            let totalViews = 0;
            let totalLikes = 0;
            
            Object.values(apiResponse.data.articles).forEach(category => {
              category.forEach(article => {
                totalViews += article.views || 0;
                totalLikes += article.likes || 0;
                if ((article.views || 0) > 0 || (article.likes || 0) > 0) {
                  hasNonZeroData = true;
                }
              });
            });
            
            console.log(`  📊 Total Views: ${totalViews}, Total Likes: ${totalLikes}`);
            if (hasNonZeroData) {
              console.log(`  ✅ Articles have real non-zero data`);
            } else {
              console.log(`  ⚠️  Articles have zero views and likes`);
            }
          } else if (endpoint.name === 'Health Check') {
            console.log(`  ✅ API service is healthy: ${apiResponse.data.status}`);
          }
        } catch (parseError) {
          console.log(`  ❌ Failed to parse API response: ${parseError.message}`);
        }
      } else {
        console.log(`  ❌ API request failed with status: ${res.statusCode}`);
      }
      
      console.log('');
      
      completedTests++;
      if (completedTests === totalTests) {
        console.log('=== Admin Page Data Loading Test Complete ===');
        console.log('All API endpoints tested!');
      }
    });
  });
  
  req.on('error', (error) => {
    console.log(`  ❌ API request failed: ${error.message}`);
    console.log('');
    
    completedTests++;
    if (completedTests === totalTests) {
      console.log('=== Admin Page Data Loading Test Complete ===');
      console.log('All API endpoints tested!');
    }
  });
  
  req.end();
});