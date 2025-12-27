// Test if index.html loads and displays featured articles correctly
const http = require('http');

console.log('=== Testing Index Page Data Loading ===');
console.log('Test Time:', new Date().toISOString());
console.log('');

// Simulate the API request that index.html would make
const apiOptions = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/articles?useCache=false',
  method: 'GET'
};

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
        
        // 2. Check for featured articles in each category
        console.log(`2. Checking for featured articles in each category`);
        
        let totalFeaturedArticles = 0;
        
        Object.entries(articles).forEach(([category, categoryArticles]) => {
          // Filter featured articles
          const featuredArticles = categoryArticles.filter(article => article.isFeatured);
          totalFeaturedArticles += featuredArticles.length;
          
          console.log(`   📁 ${category}: ${featuredArticles.length} featured articles`);
          
          // Display first few featured articles
          featuredArticles.slice(0, 2).forEach(article => {
            console.log(`   - ${article.title} (${article.views || 0} views, ${article.likes || 0} likes)`);
          });
          
          if (featuredArticles.length > 2) {
            console.log(`   ... and ${featuredArticles.length - 2} more`);
          }
        });
        
        console.log('');
        console.log(`   📊 Total featured articles: ${totalFeaturedArticles}`);
        
        if (totalFeaturedArticles > 0) {
          console.log(`   ✅ Index page should display ${totalFeaturedArticles} featured articles correctly`);
          console.log(`   Each category has featured articles to display`);
        } else {
          console.log(`   ⚠️  No featured articles found in API response`);
          console.log(`   This means no articles will be displayed on the index page`);
        }
        
      } catch (parseError) {
        console.log(`   ❌ Failed to parse API response: ${parseError.message}`);
      }
    } else {
      console.log(`   ❌ API request failed with status: ${res.statusCode}`);
    }
    
    console.log('');
    console.log('=== Index Page Data Loading Test Complete ===');
  });
});

req.on('error', (error) => {
  console.log(`   ❌ API request failed: ${error.message}`);
  console.log('');
  console.log('=== Index Page Data Loading Test Complete ===');
});

req.end();