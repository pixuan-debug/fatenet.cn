// 直接测试数据库插入和去重逻辑
const http = require('http');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('=== 直接数据库插入和去重测试 ===');
console.log('测试时间:', new Date().toISOString());
console.log('');

// 数据库连接
const dbPath = path.join(__dirname, 'api', 'database', 'articles.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('连接数据库失败:', err.message);
        process.exit(1);
    } else {
        console.log('✅ 成功连接到SQLite数据库');
        runTest();
    }
});

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

        console.log(`   发送请求到: http://${config.hostname}:${config.port}${config.basePath}`);
        console.log(`   请求数据: ${data}`);

        const req = http.request(options, (res) => {
            let responseData = '';
            
            console.log(`   响应状态码: ${res.statusCode}`);
            console.log(`   响应头:`, res.headers);
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                console.log(`   响应数据: ${responseData}`);
                try {
                    const result = JSON.parse(responseData);
                    resolve(result);
                } catch (error) {
                    console.error('   解析响应失败:', error.message);
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            console.error('   请求发送失败:', error.message);
            reject(error);
        });
        
        req.write(data);
        req.end();
    });
}

// 查询数据库中是否存在记录
function checkDatabaseRecord(deviceId, articleId, category, actionType) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM user_actions WHERE device_id = ? AND article_id = ? AND category = ? AND action_type = ?`;
        db.get(sql, [deviceId, articleId, category, actionType], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

// 运行测试
async function runTest() {
    const deviceId = 'test_direct_device';
    const articleId = 3;
    const category = 'basic-theory';
    const actionType = 'view';
    
    console.log('=== 测试配置 ===');
    console.log('设备ID:', deviceId);
    console.log('文章ID:', articleId);
    console.log('分类:', category);
    console.log('操作类型:', actionType);
    console.log('');
    
    // 1. 清空之前的测试记录
    console.log('1. 清空之前的测试记录...');
    db.run('DELETE FROM user_actions WHERE device_id = ?', [deviceId], (err) => {
        if (err) {
            console.error('清空测试记录失败:', err.message);
        } else {
            console.log('✅ 已清空之前的测试记录');
        }
        
        // 2. 发送第一次请求
        console.log('\n2. 发送第一次同步请求...');
        sendSyncRequest(deviceId, articleId, category, 0, 1)
            .then(result => {
                console.log('   请求结果:', JSON.stringify(result.data));
                
                // 3. 检查数据库中是否存在记录
                console.log('\n3. 检查数据库中是否存在记录...');
                return checkDatabaseRecord(deviceId, articleId, category, actionType);
            })
            .then(record => {
                if (record) {
                    console.log('   ✅ 记录已成功插入数据库:', {
                        id: record.id,
                        deviceId: record.device_id,
                        articleId: record.article_id,
                        category: record.category,
                        actionType: record.action_type,
                        createdAt: record.created_at
                    });
                } else {
                    console.log('   ❌ 记录未插入数据库');
                }
                
                // 4. 发送第二次请求，应该被去重
                console.log('\n4. 发送第二次同步请求（应该被去重）...');
                return sendSyncRequest(deviceId, articleId, category, 0, 1);
            })
            .then(result => {
                console.log('   请求结果:', JSON.stringify(result.data));
                console.log('   状态:', result.data.status);
                console.log('   预期状态: unchanged');
                
                if (result.data.status === 'unchanged') {
                    console.log('   ✅ 第二次请求被正确去重');
                } else {
                    console.log('   ❌ 第二次请求没有被去重');
                }
                
                // 5. 再次检查数据库，应该只有一条记录
                console.log('\n5. 再次检查数据库记录数量...');
                db.get('SELECT COUNT(*) as count FROM user_actions WHERE device_id = ? AND article_id = ? AND category = ? AND action_type = ?', 
                       [deviceId, articleId, category, actionType], (err, result) => {
                    if (err) {
                        console.error('   ❌ 查询记录数量失败:', err.message);
                    } else {
                        console.log('   记录数量:', result.count);
                        console.log('   预期数量: 1');
                        
                        if (result.count === 1) {
                            console.log('   ✅ 数据库中只有一条记录，去重成功');
                        } else {
                            console.log('   ❌ 数据库中有多条记录，去重失败');
                        }
                    }
                    
                    console.log('\n=== 测试完成 ===');
                    db.close();
                });
            })
            .catch(error => {
                console.error('测试失败:', error.message);
                db.close();
            });
    });
}
