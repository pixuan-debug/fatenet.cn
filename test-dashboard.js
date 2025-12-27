// Test if dashboard data visualization works correctly
// This script simulates the API requests that admin.html would make for dashboard
const http = require('http');

console.log('=== Testing Dashboard Data Visualization ===');
console.log('Test Time:', new Date().toISOString());
console.log('');

// Test 1: Get articles data for dashboard
const articlesOptions = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/articles?useCache=false',
  method: 'GET'
};

const articlesReq = http.request(articlesOptions, (res) => {
  console.log(`1. Testing articles data for dashboard: GET /api/v1/articles?useCache=false`);
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
        
        console.log(`   ✅ Successfully retrieved articles data for dashboard`);
        console.log(`   Found ${Object.keys(articles).length} categories`);
        console.log('');
        
        // Calculate dashboard statistics
        let totalArticles = 0;
        let totalViews = 0;
        let totalLikes = 0;
        let categoryStats = {};
        
        Object.entries(articles).forEach(([category, categoryArticles]) => {
          const articleCount = categoryArticles.length;
          const categoryViews = categoryArticles.reduce((sum, article) => sum + (article.views || 0), 0);
          const categoryLikes = categoryArticles.reduce((sum, article) => sum + (article.likes || 0), 0);
          
          totalArticles += articleCount;
          totalViews += categoryViews;
          totalLikes += categoryLikes;
          
          categoryStats[category] = {
            articles: articleCount,
            views: categoryViews,
            likes: categoryLikes
          };
        });
        
        console.log(`2. Dashboard Statistics:`);
        console.log(`   📊 Total articles: ${totalArticles}`);
        console.log(`   👁️  Total views: ${totalViews}`);
        console.log(`   👍 Total likes: ${totalLikes}`);
        console.log('');
        
        console.log(`3. Category-wise Statistics:`);
        Object.entries(categoryStats).forEach(([category, stats]) => {
          console.log(`   📁 ${category}:`);
          console.log(`      - Articles: ${stats.articles}`);
          console.log(`      - Views: ${stats.views}`);
          console.log(`      - Likes: ${stats.likes}`);
        });
        
        console.log('');
        console.log(`✅ Dashboard data visualization should display correctly with these statistics`);
        console.log(`   - The dashboard should show ${totalArticles} articles`);
        console.log(`   - It should display charts for ${Object.keys(categoryStats).length} categories`);
        console.log(`   - Total views and likes should be visible`);
        console.log('');
        
        // Test 2: Check health status for dashboard
        console.log(`4. Testing health status for dashboard`);
        const healthOptions = {
          hostname: 'localhost',
          port: 3000,
          path: '/api/v1/health',
          method: 'GET'
        };
        
        const healthReq = http.request(healthOptions, (healthRes) => {
          console.log(`   Status Code: ${healthRes.statusCode}`);
          
          let healthData = '';
          
          healthRes.on('data', (chunk) => {
            healthData += chunk;
          });
          
          healthRes.on('end', () => {
            if (healthRes.statusCode === 200) {
              try {
                const healthResponse = JSON.parse(healthData);
                console.log(`   ✅ API service is healthy: ${healthResponse.data.status}`);
                console.log(`   Last sync time: ${healthResponse.data.lastSyncTime}`);
                console.log(`   Cache status: ${healthResponse.data.cacheStatus}`);
                console.log(`   Article count in cache: ${healthResponse.data.articleCount}`);
                console.log('');
                console.log(`✅ Health status should display correctly on dashboard`);
                console.log('');
              } catch (parseError) {
                console.log(`   ❌ Failed to parse health response: ${parseError.message}`);
                console.log('');
              }
            } else {
              console.log(`   ❌ Health check failed with status: ${healthRes.statusCode}`);
              console.log('');
            }
            
            console.log('=== Dashboard Data Visualization Test Complete ===');
          });
        });
        
        healthReq.on('error', (error) => {
          console.log(`   ❌ Health request failed: ${error.message}`);
          console.log('');
          console.log('=== Dashboard Data Visualization Test Complete ===');
        });
        
        healthReq.end();
        
      } catch (parseError) {
        console.log(`   ❌ Failed to parse articles response: ${parseError.message}`);
        console.log('');
        console.log('=== Dashboard Data Visualization Test Complete ===');
      }
    } else {
      console.log(`   ❌ Articles request failed with status: ${res.statusCode}`);
      console.log('');
      console.log('=== Dashboard Data Visualization Test Complete ===');
    }
  });
});

articlesReq.on('error', (error) => {
  console.log(`   ❌ Articles request failed: ${error.message}`);
  console.log('');
  console.log('=== Dashboard Data Visualization Test Complete ===');
});

articlesReq.end();