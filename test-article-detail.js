// Test if article-detail.html loads and displays article data correctly
const http = require('http');

console.log('=== Testing Article Detail Page Data Loading ===');
console.log('Test Time:', new Date().toISOString());
console.log('');

// Simulate the API request that article-detail.html would make
const apiOptions = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/articles?useCache=false',
  method: 'GET'
};

// URL parameters for testing
const testParams = {
  id: 1,
  category: 'basic-theory'
};

console.log(`Testing article detail page with parameters: id=${testParams.id}, category=${testParams.category}`);
console.log('');

const req = http.request(apiOptions, (res) => {
  console.log(`1. Testing API request: GET /api/v1/articles?useCache=false`);
  console.log(`   Status Code: ${res.statusCode}`);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      try {
        const apiResponse = JSON.parse(data);
        const articles = apiResponse.data?.articles || {};
        
        console.log(`   ✅ Successfully retrieved articles from API`);
        console.log(`   Found ${Object.keys(articles).length} categories`);
        console.log('');
        
        // 2. Check if the test article exists in the API response
        console.log(`2. Checking if article exists: id=${testParams.id}, category=${testParams.category}`);
        
        if (articles[testParams.category]) {
          const targetArticle = articles[testParams.category].find(article => article.id === testParams.id);
          
          if (targetArticle) {
            console.log(`   ✅ Article found: ${targetArticle.title}`);
            console.log(`   📊 Article stats: ${targetArticle.views || 0} views, ${targetArticle.likes || 0} likes`);
            console.log(`   📄 Article content: ${targetArticle.content.substring(0, 100)}...`);
            console.log('');
            console.log(`   ✅ Article detail page should display this article correctly`);
          } else {
            console.log(`   ⚠️  Article with id=${testParams.id} not found in category=${testParams.category}`);
            console.log(`   Available articles in category:`);
            articles[testParams.category].forEach(article => {
              console.log(`   - id: ${article.id}, title: ${article.title}`);
            });
          }
        } else {
          console.log(`   ⚠️  Category ${testParams.category} not found in API response`);
          console.log(`   Available categories:`);
          Object.keys(articles).forEach(category => {
            console.log(`   - ${category}`);
          });
        }
        
      } catch (parseError) {
        console.log(`   ❌ Failed to parse API response: ${parseError.message}`);
      }
    } else {
      console.log(`   ❌ API request failed with status: ${res.statusCode}`);
    }
    
    console.log('');
    console.log('=== Article Detail Page Data Loading Test Complete ===');
  });
});

req.on('error', (error) => {
  console.log(`   ❌ API request failed: ${error.message}`);
  console.log('');
  console.log('=== Article Detail Page Data Loading Test Complete ===');
});

req.end();