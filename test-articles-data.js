// Test if articles.html loads data from API correctly
const http = require('http');

console.log('=== Testing Articles Page Data Loading ===');
console.log('Test Time:', new Date().toISOString());
console.log('');

// Test the API endpoint that articles.html would use
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/articles?useCache=false',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`Testing: GET /api/v1/articles?useCache=false`);
  console.log(`  Status Code: ${res.statusCode}`);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      try {
        const apiResponse = JSON.parse(data);
        const articles = apiResponse.data?.articles || {};
        const categoryCount = Object.keys(articles).length;
        
        console.log(`  ✅ Successfully retrieved ${categoryCount} article categories`);
        
        // Calculate total articles and stats
        let totalArticles = 0;
        let totalViews = 0;
        let totalLikes = 0;
        
        Object.entries(articles).forEach(([category, categoryArticles]) => {
          const articleCount = categoryArticles.length;
          const categoryViews = categoryArticles.reduce((sum, article) => sum + (article.views || 0), 0);
          const categoryLikes = categoryArticles.reduce((sum, article) => sum + (article.likes || 0), 0);
          
          totalArticles += articleCount;
          totalViews += categoryViews;
          totalLikes += categoryLikes;
          
          console.log(`  📁 ${category}: ${articleCount} articles, ${categoryViews} views, ${categoryLikes} likes`);
        });
        
        console.log(`  📊 Total: ${totalArticles} articles, ${totalViews} views, ${totalLikes} likes`);
        
        // Check if data appears real
        if (totalArticles > 0) {
          console.log(`  ✅ Articles page should display ${totalArticles} articles with real stats`);
        } else {
          console.log(`  ⚠️  No articles found in API response`);
        }
        
      } catch (parseError) {
        console.log(`  ❌ Failed to parse API response: ${parseError.message}`);
      }
    } else {
      console.log(`  ❌ API request failed with status: ${res.statusCode}`);
    }
    
    console.log('');
    console.log('=== Articles Page Data Loading Test Complete ===');
  });
});

req.on('error', (error) => {
  console.log(`  ❌ API request failed: ${error.message}`);
  console.log('');
  console.log('=== Articles Page Data Loading Test Complete ===');
});

req.end();