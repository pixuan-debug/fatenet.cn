// 测试数据库操作
const sqlite3 = require('sqlite3').verbose();

// 连接到数据库
const db = new sqlite3.Database('api/database/articles.db', (err) => {
    if (err) {
        console.error('连接数据库失败:', err.message);
        process.exit(1);
    }
    console.log('成功连接到SQLite数据库');
});

// 测试插入和查询操作
async function testDatabaseOperations() {
    console.log('\n=== 测试数据库操作 ===');
    
    // 测试数据
    const testData = {
        deviceId: 'test_database_device',
        articleId: 999,
        category: 'test-category',
        actionType: 'like'
    };
    
    // 1. 插入操作记录
    console.log('1. 插入操作记录...');
    await new Promise((resolve, reject) => {
        const insertSql = `INSERT OR IGNORE INTO user_actions 
                          (device_id, article_id, category, action_type) 
                          VALUES (?, ?, ?, ?)`;
        
        db.run(insertSql, [testData.deviceId, testData.articleId, testData.category, testData.actionType], function(err) {
            if (err) {
                reject(err);
            } else {
                console.log(`   插入结果: 影响行数 ${this.changes}`);
                resolve();
            }
        });
    });
    
    // 2. 查询操作记录
    console.log('2. 查询操作记录...');
    await new Promise((resolve, reject) => {
        const selectSql = `SELECT * FROM user_actions 
                          WHERE device_id = ? AND article_id = ? AND category = ?`;
        
        db.all(selectSql, [testData.deviceId, testData.articleId, testData.category], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                console.log(`   查询结果: ${rows.length} 条记录`);
                rows.forEach(row => {
                    console.log(`   - ID: ${row.id}, 设备ID: ${row.device_id}, 文章ID: ${row.article_id}, 分类: ${row.category}, 操作类型: ${row.action_type}`);
                });
                resolve();
            }
        });
    });
    
    // 3. 尝试再次插入相同的操作记录
    console.log('3. 再次插入相同的操作记录...');
    await new Promise((resolve, reject) => {
        const insertSql = `INSERT OR IGNORE INTO user_actions 
                          (device_id, article_id, category, action_type) 
                          VALUES (?, ?, ?, ?)`;
        
        db.run(insertSql, [testData.deviceId, testData.articleId, testData.category, testData.actionType], function(err) {
            if (err) {
                reject(err);
            } else {
                console.log(`   插入结果: 影响行数 ${this.changes}`);
                resolve();
            }
        });
    });
    
    // 4. 再次查询操作记录，验证去重
    console.log('4. 再次查询操作记录，验证去重...');
    await new Promise((resolve, reject) => {
        const selectSql = `SELECT * FROM user_actions 
                          WHERE device_id = ? AND article_id = ? AND category = ?`;
        
        db.all(selectSql, [testData.deviceId, testData.articleId, testData.category], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                console.log(`   查询结果: ${rows.length} 条记录`);
                rows.forEach(row => {
                    console.log(`   - ID: ${row.id}, 设备ID: ${row.device_id}, 文章ID: ${row.article_id}, 分类: ${row.category}, 操作类型: ${row.action_type}`);
                });
                resolve();
            }
        });
    });
    
    // 5. 查询所有操作记录
    console.log('5. 查询所有操作记录...');
    await new Promise((resolve, reject) => {
        const selectAllSql = `SELECT * FROM user_actions`;
        
        db.all(selectAllSql, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                console.log(`   总记录数: ${rows.length}`);
                resolve();
            }
        });
    });
    
    console.log('\n=== 测试完成 ===');
}

// 运行测试
testDatabaseOperations()
    .then(() => {
        // 关闭数据库连接
        db.close((err) => {
            if (err) {
                console.error('关闭数据库连接失败:', err.message);
            } else {
                console.log('\n数据库连接已关闭');
            }
        });
    })
    .catch((err) => {
        console.error('测试失败:', err.message);
        db.close();
        process.exit(1);
    });
