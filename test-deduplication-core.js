// 核心去重逻辑测试
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接数据库
const dbPath = path.join(__dirname, 'api', 'database', 'articles.db');
const db = new sqlite3.Database(dbPath);

// 测试去重逻辑
function testDeduplication() {
    console.log('=== 核心去重逻辑测试 ===');
    
    // 测试数据
    const testDeviceId = 'test_device_core';
    const testArticleId = 1001;
    const testCategory = 'test-category';
    const testActionType = 'view';
    
    // 第一次插入
    console.log('\n1. 第一次插入操作:');
    const insertSql = `INSERT OR IGNORE INTO user_actions 
                      (device_id, article_id, category, action_type) 
                      VALUES (?, ?, ?, ?)`;
    
    db.run(insertSql, [testDeviceId, testArticleId, testCategory, testActionType], function(err) {
        if (err) {
            console.error('插入失败:', err.message);
            db.close();
            return;
        }
        
        console.log(`   影响行数: ${this.changes}`);
        
        // 第二次插入相同记录
        console.log('\n2. 第二次插入相同记录:');
        db.run(insertSql, [testDeviceId, testArticleId, testCategory, testActionType], function(err) {
            if (err) {
                console.error('插入失败:', err.message);
                db.close();
                return;
            }
            
            console.log(`   影响行数: ${this.changes}`);
            
            // 查询结果
            console.log('\n3. 查询结果:');
            const selectSql = `SELECT * FROM user_actions WHERE device_id = ? AND article_id = ? AND category = ?`;
            db.all(selectSql, [testDeviceId, testArticleId, testCategory], function(err, rows) {
                if (err) {
                    console.error('查询失败:', err.message);
                } else {
                    console.log(`   找到 ${rows.length} 条记录:`);
                    rows.forEach(row => {
                        console.log(`   ID: ${row.id}, 设备ID: ${row.device_id}, 文章ID: ${row.article_id}, 分类: ${row.category}, 操作类型: ${row.action_type}`);
                    });
                }
                
                // 关闭数据库
                db.close();
            });
        });
    });
}

testDeduplication();
