// 测试地址去重功能
// 用于验证每个唯一地址在数据集中仅被计算为一个数据量单位

const http = require('http');

console.log('=== 地址去重测试 ===');
console.log('测试时间:', new Date().toISOString());
console.log('');

// 测试配置
const config = {
    hostname: 'localhost',
    port: 3000,
    basePath: '/api/v1/articles/sync'
};

// 发送同步请求
function sendSyncRequest(deviceId, articleId, category, likes = 1, views = 1) {
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
                    // 添加详细日志
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

// 测试场景1：同一设备多次请求
async function testSameDeviceMultipleRequests() {
    console.log('1. 测试场景：同一设备多次请求');
    console.log('   预期：同一设备的多次请求应只被计数一次');
    
    const deviceId = 'test_device_001';
    const articleId = 1;
    const category = 'basic-theory';
    
    console.log('   设备ID:', deviceId);
    console.log('   文章ID:', articleId);
    console.log('   分类:', category);
    console.log('   执行5次同步请求...');
    
    // 发送5次请求
    const results = [];
    for (let i = 0; i < 5; i++) {
        try {
            const result = await sendSyncRequest(deviceId, articleId, category);
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

// 测试场景2：不同设备请求
async function testDifferentDevices() {
    console.log('2. 测试场景：不同设备请求');
    console.log('   预期：每个设备应被计数一次');
    
    const articleId = 2;
    const category = 'celebrity-views';
    
    console.log('   文章ID:', articleId);
    console.log('   分类:', category);
    console.log('   执行3次不同设备的请求...');
    
    // 使用3个不同的设备
    const deviceIds = ['test_device_002', 'test_device_003', 'test_device_004'];
    const results = [];
    
    for (const deviceId of deviceIds) {
        try {
            const result = await sendSyncRequest(deviceId, articleId, category);
            results.push(result);
            console.log(`   设备 ${deviceId}: ${result.code === 200 ? '✅' : '❌'} ${result.message}`);
        } catch (error) {
            console.log(`   设备 ${deviceId}: ❌ 错误: ${error.message}`);
        }
    }
    
    console.log('');
    console.log('   测试结果分析：');
    console.log('   - 每个设备应返回更新成功');
    
    // 验证结果
    const successCount = results.filter(r => r.code === 200 && r.data.status === 'updated').length;
    
    console.log(`   - 更新成功次数: ${successCount} (预期: ${deviceIds.length})`);
    console.log('');
    
    return successCount === deviceIds.length;
}

// 运行所有测试
async function runAllTests() {
    console.log('=== 开始测试 ===');
    console.log('');
    
    const test1Result = await testSameDeviceMultipleRequests();
    const test2Result = await testDifferentDevices();
    
    console.log('=== 测试总结 ===');
    console.log('');
    console.log('测试结果:');
    console.log(`1. 同一设备多次请求测试: ${test1Result ? '✅ 通过' : '❌ 失败'}`);
    console.log(`2. 不同设备请求测试: ${test2Result ? '✅ 通过' : '❌ 失败'}`);
    console.log('');
    
    if (test1Result && test2Result) {
        console.log('🎉 所有测试通过！地址去重功能正常工作。');
        console.log('每个唯一地址在数据集中仅被计算为一个数据量单位。');
    } else {
        console.log('❌ 部分测试失败，需要进一步调试。');
    }
}

// 启动服务器（如果未运行）
// 注意：此代码仅用于测试，实际环境中服务器应已启动
runAllTests();
