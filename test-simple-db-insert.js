// 简单测试数据库插入操作
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('=== 简单数据库插入测试 ===');
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

async function runTest() {
    // 1. 测试user_actions表是否存在
    console.log('\n1. 测试user_actions表是否存在...');
    db.get('SELECT name FROM sqlite_master WHERE type="table" AND name="user_actions"', [], (err, row) => {
        if (err) {
            console.error('查询表失败:', err.message);
            process.exit(1);
        } else {
            if (row) {
                console.log('✅ user_actions表存在');
            } else {
                console.error('❌ user_actions表不存在');
                process.exit(1);
            }
            
            // 2. 测试插入操作
            console.log('\n2. 测试插入操作...');
            const insertSql = `INSERT INTO user_actions (device_id, article_id, category, action_type) VALUES (?, ?, ?, ?)`;
            
            const deviceId = 'test_simple_device';
            const articleId = 3;
            const category = 'basic-theory';
            const actionType = 'view';
            
            console.log(`插入参数: deviceId=${deviceId}, articleId=${articleId}, category=${category}, actionType=${actionType}`);
            
            db.run(insertSql, [deviceId, articleId, category, actionType], function(err) {
                if (err) {
                    console.error('❌ 插入记录失败:', err.message);
                    process.exit(1);
                } else {
                    console.log(`✅ 插入记录成功，影响行数: ${this.changes}, lastID: ${this.lastID}`);
                    
                    // 3. 验证插入结果
                    console.log('\n3. 验证插入结果...');
                    const selectSql = `SELECT * FROM user_actions WHERE device_id = ? AND article_id = ? AND category = ? AND action_type = ?`;
                    
                    db.get(selectSql, [deviceId, articleId, category, actionType], (err, row) => {
                        if (err) {
                            console.error('❌ 查询记录失败:', err.message);
                            process.exit(1);
                        } else {
                            if (row) {
                                console.log('✅ 查询记录成功:');
                                console.log('  ID:', row.id);
                                console.log('  设备ID:', row.device_id);
                                console.log('  文章ID:', row.article_id);
                                console.log('  分类:', row.category);
                                console.log('  操作类型:', row.action_type);
                                console.log('  创建时间:', row.created_at);
                                
                                // 4. 测试INSERT OR IGNORE
                                console.log('\n4. 测试INSERT OR IGNORE...');
                                const ignoreSql = `INSERT OR IGNORE INTO user_actions (device_id, article_id, category, action_type) VALUES (?, ?, ?, ?)`;
                                
                                db.run(ignoreSql, [deviceId, articleId, category, actionType], function(err) {
                                    if (err) {
                                        console.error('❌ INSERT OR IGNORE失败:', err.message);
                                    } else {
                                        console.log(`✅ INSERT OR IGNORE成功，影响行数: ${this.changes}`);
                                    }
                                    
                                    // 5. 清理测试数据
                                    console.log('\n5. 清理测试数据...');
                                    db.run('DELETE FROM user_actions WHERE device_id = ?', [deviceId], (err) => {
                                        if (err) {
                                            console.error('❌ 清理测试数据失败:', err.message);
                                        } else {
                                            console.log(`✅ 清理测试数据成功，影响行数: ${this.changes}`);
                                        }
                                        
                                        // 6. 验证清理结果
                                        console.log('\n6. 验证清理结果...');
                                        db.get(selectSql, [deviceId, articleId, category, actionType], (err, row) => {
                                            if (err) {
                                                console.error('❌ 验证清理结果失败:', err.message);
                                            } else {
                                                if (row) {
                                                    console.error('❌ 清理失败，记录仍然存在');
                                                } else {
                                                    console.log('✅ 清理成功，记录已删除');
                                                }
                                            }
                                            
                                            console.log('\n=== 测试完成 ===');
                                            db.close();
                                        });
                                    });
                                });
                            } else {
                                console.error('❌ 查询记录失败，记录不存在');
                                process.exit(1);
                            }
                        }
                    });
                }
            });
        }
    });
}
