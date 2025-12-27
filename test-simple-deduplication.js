// 简化版地址去重测试
// 只测试单一操作类型，便于调试

const http = require('http');

console.log('=== 简化版地址去重测试 ===');
console.log('测试时间:', new Date().toISOString());
console.log('');

// 测试配置
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

        const req = http.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const result = JSON.parse(responseData);
                    console.log(`   Response: ${JSON.stringify(result)}`);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });
        
        req.write(data);
        req.end();
    });
}

// 测试场景：同一设备多次浏览请求
async function testSameDeviceMultipleViews() {
    console.log('1. 测试场景：同一设备多次浏览请求');
    console.log('   预期：同一设备的多次浏览请求应只被计数一次');
    
    const deviceId = 'simple_device_final_fix'; // 使用全新的设备ID
    const articleId = 3;
    const category = 'basic-theory';
    
    console.log('   设备ID:', deviceId);
    console.log('   文章ID:', articleId);
    console.log('   分类:', category);
    console.log('   执行3次同步请求...');
    
    // 发送3次请求，只包含浏览操作
    const results = [];
    for (let i = 0; i < 3; i++) {
        try {
            const result = await sendSyncRequest(deviceId, articleId, category, 0, 1);
            results.push(result);
            console.log(`   请求 ${i+1}: ${result.code === 200 ? '✅' : '❌'} ${result.message}`);
        } catch (error) {
            console.log(`   请求 ${i+1}: ❌ 错误: ${error.message}`);
        }
    }
    
    console.log('');
    console.log('   测试结果分析：');
    console.log('   - 第一次请求应返回更新成功');
    console.log('   - 后续请求应返回"没有需要更新的数据（已去重）"');
    
    // 验证结果
    const successCount = results.filter(r => r.code === 200 && r.data.status === 'updated').length;
    const unchangedCount = results.filter(r => r.code === 200 && r.data.status === 'unchanged').length;
    
    console.log(`   - 更新成功次数: ${successCount} (预期: 1)`);
    console.log(`   - 已去重次数: ${unchangedCount} (预期: ${results.length - 1})`);
    console.log('');
    
    return successCount === 1 && unchangedCount === results.length - 1;
}

// 运行测试
async function runTests() {
    console.log('=== 开始测试 ===');
    console.log('');
    
    const test1Result = await testSameDeviceMultipleViews();
    
    console.log('=== 测试总结 ===');
    console.log('');
    console.log('测试结果:');
    console.log(`1. 同一设备多次浏览请求测试: ${test1Result ? '✅ 通过' : '❌ 失败'}`);
    console.log('');
    
    if (test1Result) {
        console.log('🎉 测试通过！地址去重功能正常工作。');
        console.log('每个唯一地址在数据集中仅被计算为一个数据量单位。');
    } else {
        console.log('❌ 测试失败，需要进一步调试。');
    }
}

runTests();
