// 简单测试同步接口
const http = require('http');

console.log('=== 简单同步接口测试 ===');

// 配置
const config = {
    hostname: 'localhost',
    port: 3000,
    basePath: '/api/v1/articles/sync'
};

// 发送同步请求
function sendSyncRequest(deviceId, articleId, category, likes = 0, views = 1) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            eventId: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            type: 'sync',
            articleId: articleId,
            category: category,
            likes: likes,
            views: views,
            timestamp: Date.now(),
            deviceId: deviceId
        });

        const options = {
            hostname: config.hostname,
            port: config.port,
            path: config.basePath,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        console.log(`\n发送请求到: http://${config.hostname}:${config.port}${config.basePath}`);
        console.log(`请求数据: ${data}`);

        const req = http.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                console.log(`响应状态码: ${res.statusCode}`);
                console.log(`响应数据: ${responseData}`);
                try {
                    const result = JSON.parse(responseData);
                    resolve(result);
                } catch (error) {
                    console.error('解析响应失败:', error.message);
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            console.error('请求发送失败:', error.message);
            reject(error);
        });
        
        req.write(data);
        req.end();
    });
}

// 运行测试
async function runTest() {
    const deviceId = 'test_script_device';
    const articleId = 3;
    const category = 'basic-theory';
    
    console.log('\n=== 测试配置 ===');
    console.log('设备ID:', deviceId);
    console.log('文章ID:', articleId);
    console.log('分类:', category);
    
    // 发送第一次请求
    console.log('\n=== 第一次请求 ===');
    const result1 = await sendSyncRequest(deviceId, articleId, category, 0, 1);
    console.log('第一次请求结果:', result1.data.status);
    
    // 发送第二次请求
    console.log('\n=== 第二次请求 ===');
    const result2 = await sendSyncRequest(deviceId, articleId, category, 0, 1);
    console.log('第二次请求结果:', result2.data.status);
    
    console.log('\n=== 测试完成 ===');
}

runTest();
