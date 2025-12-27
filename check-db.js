// 检查数据库中的user_actions表数据
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接数据库
const dbPath = path.join(__dirname, 'api', 'database', 'articles.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('连接数据库失败:', err.message);
        process.exit(1);
    } else {
        console.log('成功连接到SQLite数据库');
        
        // 查询user_actions表
            console.log('\n=== user_actions表数据 ===');
            const sql = `SELECT * FROM user_actions ORDER BY created_at DESC`;
            db.all(sql, [], (err, rows) => {
                if (err) {
                    console.error('查询user_actions表失败:', err.message);
                } else {
                    console.log(`找到 ${rows.length} 条记录:`);
                    rows.forEach(row => {
                        console.log(`ID: ${row.id}, 设备ID: ${row.device_id}, 文章ID: ${row.article_id}, 分类: ${row.category}, 操作类型: ${row.action_type}, 创建时间: ${row.created_at}`);
                    });
                }
                
                // 查询articles表中的文章数据
                console.log('\n=== articles表数据 ===');
                const articlesSql = `SELECT article_id, category, likes, views FROM articles WHERE article_id IN (1, 2, 3)`;
                db.all(articlesSql, [], (err, rows) => {
                    if (err) {
                        console.error('查询articles表失败:', err.message);
                    } else {
                        console.log(`找到 ${rows.length} 条记录:`);
                        rows.forEach(row => {
                            console.log(`文章ID: ${row.article_id}, 分类: ${row.category}, 点赞数: ${row.likes}, 浏览数: ${row.views}`);
                        });
                    }
                    
                    // 特别查询测试设备的操作记录
                    console.log('\n=== 测试设备操作记录 ===');
                    const testSql = `SELECT * FROM user_actions WHERE device_id LIKE 'simple_device_%' ORDER BY created_at DESC`;
                    db.all(testSql, [], (err, rows) => {
                        if (err) {
                            console.error('查询测试设备操作记录失败:', err.message);
                        } else {
                            console.log(`找到 ${rows.length} 条测试设备记录:`);
                            rows.forEach(row => {
                                console.log(`ID: ${row.id}, 设备ID: ${row.device_id}, 文章ID: ${row.article_id}, 分类: ${row.category}, 操作类型: ${row.action_type}, 创建时间: ${row.created_at}`);
                            });
                        }
                        
                        // 关闭数据库连接
                        db.close((err) => {
                            if (err) {
                                console.error('关闭数据库连接失败:', err.message);
                            } else {
                                console.log('\n数据库连接已关闭');
                            }
                        });
                    });
                });
            });
    }
});
