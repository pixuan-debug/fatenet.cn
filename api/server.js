// 文章点赞和浏览量同步API服务
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// 初始化Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 配置中间件
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// JWT密钥配置
const JWT_SECRET = 'your_jwt_secret_key_here'; // 生产环境中应从环境变量获取

// 确保数据库目录存在
const dbPath = path.join(__dirname, 'database', 'articles.db');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// 初始化数据库
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('连接数据库失败:', err.message);
    } else {
        console.log('成功连接到SQLite数据库');
        initDatabase();
    }
});

// 初始化数据库表
function initDatabase() {
    // 创建文章表
    db.run(`CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        article_id INTEGER NOT NULL,
        category TEXT NOT NULL,
        title TEXT,
        content TEXT,
        likes INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
        version INTEGER DEFAULT 1,
        UNIQUE(article_id, category)
    )`, (err) => {
        if (err) {
            console.error('创建文章表失败:', err.message);
        } else {
            console.log('文章表创建成功');
        }
    });

    // 创建同步事件表
    db.run(`CREATE TABLE IF NOT EXISTS sync_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id TEXT NOT NULL UNIQUE,
        event_type TEXT NOT NULL,
        article_id INTEGER NOT NULL,
        category TEXT NOT NULL,
        data TEXT,
        status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        processed_at TEXT
    )`, (err) => {
        if (err) {
            console.error('创建同步事件表失败:', err.message);
        } else {
            console.log('同步事件表创建成功');
        }
    });

    // 创建用户操作记录表（用于去重）
    db.run(`CREATE TABLE IF NOT EXISTS user_actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT NOT NULL,
        article_id INTEGER NOT NULL,
        category TEXT NOT NULL,
        action_type TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(device_id, article_id, category, action_type)
    )`, (err) => {
        if (err) {
            console.error('创建用户操作记录表失败:', err.message);
        } else {
            console.log('用户操作记录表创建成功');
        }
    });

    // 导入初始文章数据
    importInitialArticles();
}

// 导入初始文章数据
function importInitialArticles() {
    console.log('开始导入初始文章数据...');
    
    // 检查数据库中是否已有文章数据
    db.get('SELECT COUNT(*) AS count FROM articles', [], (err, row) => {
        if (err) {
            console.error('检查数据库文章数量失败:', err.message);
            return;
        }
        
        // 如果数据库中已有文章数据，就不再导入
        if (row.count > 0) {
            console.log(`数据库中已有 ${row.count} 篇文章，跳过初始导入`);
            return;
        }
        
        try {
            // 从articles.json文件导入完整文章数据
            const articlesJsonPath = path.join(__dirname, '..', 'articles.json');
            const articlesData = JSON.parse(fs.readFileSync(articlesJsonPath, 'utf8'));
            
            console.log('从articles.json读取到文章数据，分类数:', Object.keys(articlesData).length);
            
            // 准备要插入的数据
            let initialArticles = [];
            Object.keys(articlesData).forEach(category => {
                articlesData[category].forEach(article => {
                    initialArticles.push({
                        article_id: article.id,
                        category: category,
                        title: article.title,
                        content: article.content,
                        likes: article.likes || 0,
                        views: article.views || 0,
                        last_updated: new Date().toISOString()
                    });
                });
            });
            
            console.log('准备插入', initialArticles.length, '篇文章');
            
            // 批量插入初始文章数据
            const sql = `INSERT OR IGNORE INTO articles 
                        (article_id, category, title, content, likes, views, last_updated) 
                        VALUES (?, ?, ?, ?, ?, ?, ?)`;
            
            let insertedCount = 0;
            
            // 使用事务批量插入
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');
                
                initialArticles.forEach(article => {
                    db.run(sql, [
                        article.article_id,
                        article.category,
                        article.title,
                        article.content,
                        article.likes,
                        article.views,
                        article.last_updated
                    ], function(err) {
                        if (err) {
                            console.error('插入初始文章失败:', err.message);
                        } else {
                            insertedCount++;
                        }
                    });
                });
                
                db.run('COMMIT', (err) => {
                    if (err) {
                        console.error('提交事务失败:', err.message);
                    } else {
                        console.log(`成功导入 ${insertedCount} 篇初始文章`);
                        // 更新缓存
                        updateCacheFromDatabase();
                    }
                });
            });
        } catch (error) {
            console.error('从articles.json导入数据失败:', error.message);
            // 如果导入失败，使用默认数据
            const initialArticles = [
                { article_id: 1, category: 'basic-theory', title: '命学基础理论', content: '命学基础理论内容...', likes: 120, views: 2500 },
                { article_id: 2, category: 'celebrity-views', title: '名人八字分析', content: '名人八字分析内容...', likes: 95, views: 1800 },
                { article_id: 3, category: 'flower-fruit-method', title: '花果论心法详解', content: '花果论心法详解内容...', likes: 88, views: 1500 },
                { article_id: 4, category: 'essays', title: '命理随笔：命运与性格', content: '命理随笔内容...', likes: 75, views: 1200 }
            ];
            
            const sql = `INSERT OR IGNORE INTO articles 
                        (article_id, category, title, content, likes, views, last_updated) 
                        VALUES (?, ?, ?, ?, ?, ?, ?)`;
            
            let insertedCount = 0;
            
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');
                
                initialArticles.forEach(article => {
                    db.run(sql, [
                        article.article_id,
                        article.category,
                        article.title,
                        article.content,
                        article.likes,
                        article.views,
                        new Date().toISOString()
                    ], function(err) {
                        if (err) {
                            console.error('插入默认文章失败:', err.message);
                        } else {
                            insertedCount++;
                        }
                    });
                });
                
                db.run('COMMIT', (err) => {
                    if (err) {
                        console.error('提交默认数据事务失败:', err.message);
                    } else {
                        console.log(`成功导入 ${insertedCount} 篇默认文章`);
                        updateCacheFromDatabase();
                    }
                });
            });
        }
    });
}

// 生成JWT Token
function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// 验证JWT Token
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return null;
    }
}

// 认证中间件
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token == null) {
        return res.status(401).json({
            code: 401,
            message: '未授权访问',
            errorDetails: {
                field: 'Authorization',
                reason: '缺少Token',
                solution: '请在请求头中添加有效的Token'
            }
        });
    }
    
    const decoded = verifyToken(token);
    if (decoded == null) {
        return res.status(403).json({
            code: 403,
            message: '无效的Token',
            errorDetails: {
                field: 'Authorization',
                reason: 'Token已过期或无效',
                solution: '请重新获取有效的Token'
            }
        });
    }
    
    req.user = decoded;
    next();
}

// 公开路由：登录获取Token
app.post('/api/v1/auth/login', (req, res) => {
    const { username, password } = req.body;
    
    // 简单的管理员验证（生产环境应使用密码哈希）
    if (username === 'admin' && password === 'admin123') {
        const token = generateToken({ username: 'admin', role: 'admin' });
        res.json({
            code: 200,
            message: '登录成功',
            data: {
                token,
                username: 'admin',
                role: 'admin'
            }
        });
    } else {
        res.status(401).json({
            code: 401,
            message: '用户名或密码错误',
            errorDetails: {
                field: 'username/password',
                reason: '无效的登录凭证',
                solution: '请检查用户名和密码是否正确'
            }
        });
    }
});

// 公开路由：获取单篇文章
app.get('/api/v1/articles/:articleId', (req, res) => {
    const articleId = req.params.articleId;
    const category = req.query.category;
    
    let sql = `SELECT * FROM articles WHERE article_id = ?`;
    let params = [articleId];
    
    if (category) {
        sql += ` AND category = ?`;
        params.push(category);
    }
    
    db.get(sql, params, (err, row) => {
        if (err) {
            return res.status(500).json({
                code: 500,
                message: '获取文章失败',
                errorDetails: {
                    reason: err.message
                }
            });
        }
        
        if (!row) {
            return res.status(404).json({
                code: 404,
                message: '文章不存在',
                errorDetails: {
                    reason: '未找到指定ID的文章'
                }
            });
        }
        
        // 过滤掉没有标题的文章
        if (!row.title || row.title.trim() === '') {
            return res.status(404).json({
                code: 404,
                message: '文章不存在',
                errorDetails: {
                    reason: '未找到指定ID的文章'
                }
            });
        }
        
        res.json({
            code: 200,
            message: '成功获取文章',
            data: row
        });
    });
});

// 公开路由：同步文章数据（点赞、浏览量）
app.post('/api/v1/articles/sync', (req, res) => {
    // 使用console.log确保日志被正确输出
    console.log('\n=== 收到同步请求 ===');
    console.log('请求方法:', req.method);
    console.log('请求URL:', req.url);
    console.log('请求体:', JSON.stringify(req.body, null, 2));
    
    const { type, articleId, category, likes, views, timestamp, eventId, deviceId } = req.body;
    
    // 验证必填参数
    if (!eventId || !type || !articleId || !category || !deviceId) {
        console.log('❌ 请求参数不完整');
        return res.status(400).json({
            code: 400,
            message: '请求参数不完整',
            errorDetails: {
                reason: '缺少必填参数',
                required: ['eventId', 'type', 'articleId', 'category', 'deviceId'],
                provided: req.body
            }
        });
    }
    
    // 将articleId转换为数字类型，确保与数据库中的INTEGER类型匹配
    const numericArticleId = parseInt(articleId);
    if (isNaN(numericArticleId)) {
        return res.status(400).json({
            code: 400,
            message: '无效的articleId',
            errorDetails: {
                reason: 'articleId必须是数字类型',
                provided: articleId
            }
        });
    }
    
    // 保存同步事件
    const syncEventSql = `INSERT OR IGNORE INTO sync_events 
                        (event_id, event_type, article_id, category, data, status) 
                        VALUES (?, ?, ?, ?, ?, ?)`;
    
    const eventData = JSON.stringify(req.body);
    
    db.run(syncEventSql, [eventId, type, numericArticleId, category, eventData, 'processed'], (err) => {
        if (err) {
            console.log('保存同步事件失败:', err.message);
        } else {
            console.log('✅ 保存同步事件成功');
        }
    });
    
    // 更新时间
    const updateTime = new Date(timestamp || Date.now()).toISOString();
    
    // 首先查询当前文章数据
    const selectSql = `SELECT * FROM articles WHERE article_id = ? AND category = ?`;
    
    // 验证数据库连接和表存在
    console.log('\n=== 验证数据库表 ===');
    db.get('SELECT name FROM sqlite_master WHERE type="table" AND name="user_actions"', [], (err, row) => {
        if (err) {
            console.error('查询表失败:', err.message);
        } else {
            console.log('  user_actions表存在:', row ? '是' : '否');
        }
    });
    
    // 检查用户操作记录，实现去重
    console.log('\n=== 开始去重检查 ===');
    console.log('设备ID:', deviceId);
    console.log('文章ID:', numericArticleId);
    console.log('分类:', category);
    console.log('请求的点赞数:', likes);
    console.log('请求的浏览数:', views);
    
    // 准备要检查的操作类型
    const actionsToCheck = [];
    if (likes > 0) actionsToCheck.push('like');
    if (views > 0) actionsToCheck.push('view');
    
    console.log('  需要检查的操作类型:', actionsToCheck);
    console.log('  likes:', likes, 'views:', views);
    
    // 如果没有要检查的操作类型，直接返回成功
    if (actionsToCheck.length === 0) {
        console.log('  没有需要检查的操作类型，返回成功状态');
        const selectSql = `SELECT * FROM articles WHERE article_id = ? AND category = ?`;
        db.get(selectSql, [numericArticleId, category], (err, row) => {
            if (err) {
                console.error('获取当前数据失败:', err.message);
                return res.status(500).json({
                    code: 500,
                    message: '获取当前数据失败',
                    errorDetails: {
                        reason: err.message
                    },
                    requestId: eventId
                });
            }
            
            res.json({
                code: 200,
                message: '没有需要更新的数据',
                data: {
                    syncedEvents: 0,
                    articleId,
                    category,
                    likes: row.likes,
                    views: row.views,
                    timestamp: row.last_updated,
                    version: row.version,
                    status: 'unchanged'
                },
                requestId: eventId
            });
        });
        return;
    }
    
    // 直接查询是否已经有记录，使用更简单的去重方法
    console.log('\n=== 执行去重检查 ===');
    console.log('设备ID:', deviceId);
    console.log('文章ID:', numericArticleId);
    console.log('分类:', category);
    console.log('请求的点赞数:', likes);
    console.log('请求的浏览数:', views);
    
    // 收集所有新操作类型
    let newActions = [];
    let processedActions = 0;
    
    console.log('  开始检查每种操作类型...');
    
    actionsToCheck.forEach(action => {
        const checkSql = `SELECT COUNT(*) as count FROM user_actions 
                         WHERE device_id = ? AND article_id = ? AND category = ? AND action_type = ?`;
        
        console.log(`  检查操作类型 ${action}:`);
        
        db.get(checkSql, [deviceId, numericArticleId, category, action], (err, result) => {
            processedActions++;
            
            if (err) {
                console.error(`  ❌ 检查${action}操作记录失败:`, err.message);
            } else {
                console.log(`  检查结果: 找到 ${result.count} 条${action}操作记录`);
                
                if (result.count === 0) {
                    newActions.push(action);
                }
            }
            
            // 所有操作类型检查完成
            if (processedActions === actionsToCheck.length) {
                console.log(`\n  检查完成，找到 ${newActions.length} 种新操作类型`);
                
                if (newActions.length === 0) {
                    // 所有操作类型都已存在，返回unchanged
                    console.log('\n=== 去重检查结果 ===');
                    console.log('  该设备已存在所有需要的操作记录，返回unchanged状态');
                    
                    // 查询当前数据
                    const selectSql = `SELECT * FROM articles WHERE article_id = ? AND category = ?`;
                    db.get(selectSql, [numericArticleId, category], (err, row) => {
                        if (err) {
                            console.error('获取当前数据失败:', err.message);
                            return res.status(500).json({
                                code: 500,
                                message: '获取当前数据失败',
                                errorDetails: {
                                    reason: err.message
                                },
                                requestId: eventId
                            });
                        }
                        
                        res.json({
                            code: 200,
                            message: '没有需要更新的数据（已去重）',
                            data: {
                                syncedEvents: 0,
                                articleId,
                                category,
                                likes: row.likes,
                                views: row.views,
                                timestamp: row.last_updated,
                                version: row.version,
                                status: 'unchanged'
                            },
                            requestId: eventId
                        });
                    });
                } else {
                    // 有新操作需要处理，插入记录并更新文章数据
                    console.log('\n=== 去重检查结果 ===');
                    console.log('  该设备缺少某些操作记录，需要更新');
                    console.log('  需要更新的操作类型:', newActions);
                    console.log('  需要更新的数据，开始处理...');
                    
                    // 使用事务处理插入和更新操作，确保原子性
                    console.log('\n=== 执行事务处理 ===');
                    
                    db.serialize(() => {
                        db.run('BEGIN TRANSACTION');
                        
                        let insertCount = 0;
                        
                        // 计算需要更新的点赞数和浏览数
                        let likesToAdd = 0;
                        let viewsToAdd = 0;
                        
                        if (newActions.includes('like')) {
                            likesToAdd = 1;
                        }
                        if (newActions.includes('view')) {
                            viewsToAdd = 1;
                        }
                        
                        console.log('  需要增加的点赞数:', likesToAdd);
                        console.log('  需要增加的浏览数:', viewsToAdd);
                        
                        // 1. 执行所有插入操作
                        newActions.forEach(action => {
                            const insertSql = `INSERT INTO user_actions (device_id, article_id, category, action_type) VALUES (?, ?, ?, ?)`;
                            db.run(insertSql, [deviceId, numericArticleId, category, action], function(err) {
                                if (err) {
                                    console.error(`  ❌ 插入${action}操作记录失败:`, err.message);
                                } else {
                                    console.log(`  ✅ 插入${action}操作记录成功，影响行数: ${this.changes}`);
                                    if (this.changes > 0) {
                                        insertCount++;
                                    }
                                }
                            });
                        });
                        
                        // 2. 更新文章数据
                        const selectSql = `SELECT * FROM articles WHERE article_id = ? AND category = ?`;
                        
                        db.get(selectSql, [numericArticleId, category], (err, article) => {
                            if (err) {
                                console.error('查询文章数据失败:', err.message);
                                db.run('ROLLBACK');
                                return res.status(500).json({
                                    code: 500,
                                    message: '查询文章数据失败',
                                    errorDetails: {
                                        reason: err.message
                                    },
                                    requestId: eventId
                                });
                            }
                            
                            let updateSql, updateParams;
                            
                            if (article) {
                                // 文章存在，执行增量更新
                                updateSql = `UPDATE articles 
                                          SET likes = likes + ?, 
                                              views = views + ?, 
                                              last_updated = ?, 
                                              version = version + 1 
                                          WHERE article_id = ? AND category = ?`;
                                updateParams = [likesToAdd, viewsToAdd, updateTime, numericArticleId, category];
                            } else {
                                // 文章不存在，创建新记录
                                updateSql = `INSERT INTO articles 
                                          (article_id, category, title, likes, views, version, last_updated) 
                                          VALUES (?, ?, ?, ?, ?, ?, ?)`;
                                updateParams = [numericArticleId, category, `临时标题 ${numericArticleId}`, likesToAdd, viewsToAdd, 1, updateTime];
                            }
                            
                            // 执行更新或插入
                            db.run(updateSql, updateParams, function(err) {
                                if (err) {
                                    console.error('更新文章数据失败:', err.message);
                                    db.run('ROLLBACK');
                                    return res.status(500).json({
                                        code: 500,
                                        message: '更新文章数据失败',
                                        errorDetails: {
                                            reason: err.message
                                        },
                                        requestId: eventId
                                    });
                                }
                                
                                // 3. 查询更新后的数据
                                db.get(selectSql, [numericArticleId, category], (err, updatedRow) => {
                                    if (err) {
                                        console.error('查询更新后数据失败:', err.message);
                                        db.run('ROLLBACK');
                                        return res.status(500).json({
                                            code: 500,
                                            message: '查询更新后数据失败',
                                            errorDetails: {
                                                reason: err.message
                                            },
                                            requestId: eventId
                                        });
                                    }
                                    
                                    // 4. 提交事务
                                    db.run('COMMIT', (err) => {
                                        if (err) {
                                            console.error('提交事务失败:', err.message);
                                            return res.status(500).json({
                                                code: 500,
                                                message: '提交事务失败',
                                                errorDetails: {
                                                    reason: err.message
                                                },
                                                requestId: eventId
                                            });
                                        }
                                        
                                        // 5. 更新缓存
                                        updateCacheFromDatabase()
                                            .then(() => {
                                                // 返回成功响应
                                                res.json({
                                                    code: 200,
                                                    message: '文章数据更新成功（已去重）',
                                                    data: {
                                                        syncedEvents: insertCount,
                                                        articleId,
                                                        category,
                                                        likes: updatedRow.likes,
                                                        views: updatedRow.views,
                                                        timestamp: updatedRow.last_updated,
                                                        version: updatedRow.version,
                                                        status: article ? 'updated' : 'created'
                                                    },
                                                    requestId: eventId
                                                });
                                            })
                                            .catch((err) => {
                                                // 缓存更新失败不影响数据更新
                                                res.json({
                                                    code: 200,
                                                    message: '文章数据更新成功（已去重），但缓存更新失败',
                                                    data: {
                                                        syncedEvents: insertCount,
                                                        articleId,
                                                        category,
                                                        likes: updatedRow.likes,
                                                        views: updatedRow.views,
                                                        timestamp: updatedRow.last_updated,
                                                        version: updatedRow.version,
                                                        status: article ? 'updated' : 'created'
                                                    },
                                                    requestId: eventId
                                                });
                                            });
                                    });
                                });
                            });
                        });
                    });
                }
            }
        });
    });
});

// 管理员路由：获取同步事件日志（需要认证）
app.get('/api/v1/sync/events', authenticateToken, (req, res) => {
    const status = req.query.status || 'all';
    const limit = parseInt(req.query.limit) || 100;
    
    let sql = `SELECT * FROM sync_events`;
    let params = [];
    
    if (status !== 'all') {
        sql += ` WHERE status = ?`;
        params.push(status);
    }
    
    sql += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);
    
    db.all(sql, params, (err, rows) => {
        if (err) {
            return res.status(500).json({
                code: 500,
                message: '获取同步事件失败',
                errorDetails: {
                    reason: err.message
                }
            });
        }
        
        res.json({
            code: 200,
            message: '成功获取同步事件',
            data: {
                events: rows,
                total: rows.length
            }
        });
    });
});

// 健康检查路由已移至下方，使用增强版本

// 内存缓存
const cache = {
    articles: null,
    lastUpdated: null,
    cacheDuration: 30 * 1000, // 30秒缓存，缩短缓存时间以提高同步速度
    syncStatus: 'idle', // idle, syncing, completed, error
    lastSyncError: null
};

// 数据处理流水线
function processDataPipeline(data) {
    try {
        console.log('开始数据处理流水线...');
        
        // 1. 数据验证
        if (!data || typeof data !== 'object') {
            throw new Error('无效的数据格式');
        }
        
        // 2. 数据清洗
        let cleanedData = {};
        Object.keys(data).forEach(category => {
            cleanedData[category] = data[category].filter(article => {
                // 过滤无效文章，支持从数据库获取的文章（使用article_id）和从JSON获取的文章（使用id）
                // 过滤掉没有标题的文章
                return (article.id || article.article_id) && article.title && article.title.trim() !== '';
            }).map(article => ({
                id: article.article_id || article.id,
                title: article.title.trim(),
                content: article.content || '',
                category: article.category || category,
                date: article.date || article.last_updated?.split('T')[0] || new Date().toISOString().split('T')[0],
                likes: typeof article.likes === 'number' ? article.likes : 0,
                views: typeof article.views === 'number' ? article.views : 0,
                isFeatured: article.isFeatured || false,
                images: Array.isArray(article.images) ? article.images : [],
                version: typeof article.version === 'number' ? article.version : 1,
                last_updated: article.last_updated || new Date().toISOString()
            }));
        });
        
        // 3. 数据转换
        let transformedData = {
            articles: cleanedData,
            totalArticles: Object.values(cleanedData).reduce((sum, category) => sum + category.length, 0),
            lastUpdated: new Date().toISOString()
        };
        
        // 4. 数据存储（更新缓存）
        updateCache(transformedData);
        
        console.log('数据处理流水线完成');
        return transformedData;
    } catch (error) {
        console.error('数据处理流水线失败:', error);
        throw error;
    }
}

// 更新缓存
function updateCache(data) {
    cache.articles = data;
    cache.lastUpdated = new Date();
    cache.syncStatus = 'completed';
    cache.lastSyncError = null;
    console.log('缓存已更新，时间:', cache.lastUpdated);
}

// 从articles.json文件同步数据到数据库
async function syncFromJsonFile() {
    try {
        console.log('开始从JSON文件同步数据...');
        
        // 从articles.json文件读取完整文章数据
        const articlesJsonPath = path.join(__dirname, '..', 'articles.json');
        const articlesData = JSON.parse(fs.readFileSync(articlesJsonPath, 'utf8'));
        
        console.log('从articles.json读取到文章数据，分类数:', Object.keys(articlesData).length);
        
        // 准备要插入或更新的数据
        let syncData = [];
        Object.keys(articlesData).forEach(category => {
            articlesData[category].forEach(article => {
                syncData.push({
                    article_id: article.id,
                    category: category,
                    title: article.title,
                    content: article.content,
                    likes: article.likes || 0,
                    views: article.views || 0,
                    last_updated: article.last_updated || new Date().toISOString()
                });
            });
        });
        
        console.log('准备同步', syncData.length, '篇文章');
        
        // 使用事务批量插入或更新数据
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');
                
                const sql = `INSERT OR REPLACE INTO articles 
                            (article_id, category, title, content, likes, views, last_updated, version) 
                            VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT version FROM articles WHERE article_id = ? AND category = ?), 0) + 1)`;
                
                let processedCount = 0;
                let errorOccurred = false;
                
                syncData.forEach(article => {
                    db.run(sql, [
                        article.article_id,
                        article.category,
                        article.title,
                        article.content,
                        article.likes,
                        article.views,
                        article.last_updated,
                        article.article_id,
                        article.category
                    ], function(err) {
                        if (err) {
                            console.error('同步文章失败:', err.message);
                            errorOccurred = true;
                        } else {
                            processedCount++;
                        }
                    });
                });
                
                db.run('COMMIT', (err) => {
                    if (err || errorOccurred) {
                        console.error('提交同步事务失败:', err?.message || '未知错误');
                        reject(err || new Error('同步数据失败'));
                    } else {
                        console.log(`成功同步 ${processedCount} 篇文章到数据库`);
                        resolve({ total: processedCount });
                    }
                });
            });
        });
    } catch (error) {
        console.error('从JSON文件同步数据失败:', error.message);
        throw error;
    }
}

// 从数据库获取最新数据并更新缓存
async function updateCacheFromDatabase() {
    try {
        console.log('从数据库更新缓存...');
        cache.syncStatus = 'syncing';
        cache.lastSyncError = null;
        
        // 从数据库获取所有文章
        const sql = `SELECT * FROM articles ORDER BY category, article_id`;
        
        return new Promise((resolve, reject) => {
            db.all(sql, [], (err, rows) => {
                if (err) {
                    console.error('从数据库获取文章失败:', err.message);
                    cache.syncStatus = 'error';
                    cache.lastSyncError = err.message;
                    reject(err);
                    return;
                }
                
                console.log('从数据库获取到', rows.length, '篇文章');
                
                // 去重：根据article_id和category组合去重
                const uniqueArticles = [];
                const seenArticleIds = new Set();
                
                rows.forEach(article => {
                    const articleKey = `${article.article_id}-${article.category}`;
                    if (!seenArticleIds.has(articleKey)) {
                        seenArticleIds.add(articleKey);
                        uniqueArticles.push(article);
                    } else {
                        console.warn(`发现重复文章: article_id=${article.article_id}, category=${article.category}，已跳过`);
                    }
                });
                
                console.log('去重后剩余', uniqueArticles.length, '篇文章');
                
                // 按分类分组文章
                let articlesData = {};
                uniqueArticles.forEach(article => {
                    if (!articlesData[article.category]) {
                        articlesData[article.category] = [];
                    }
                    // 转换为前端需要的格式
                    articlesData[article.category].push({
                        id: article.article_id,
                        title: article.title,
                        content: article.content,
                        category: article.category,
                        date: article.last_updated.split('T')[0],
                        likes: article.likes,
                        views: article.views,
                        isFeatured: true, // 默认设为精华
                        images: [],
                        last_updated: article.last_updated,
                        version: article.version
                    });
                });
                
                // 执行数据处理流水线
                const processedData = processDataPipeline(articlesData);
                
                const totalArticles = Object.values(processedData.articles).reduce((sum, category) => sum + category.length, 0);
                console.log('从数据库更新缓存完成，共', totalArticles, '篇文章');
                resolve(processedData);
            });
        });
    } catch (error) {
        console.error('从数据库更新缓存失败:', error);
        cache.syncStatus = 'error';
        cache.lastSyncError = error.message;
        throw error;
    }
}

// 数据同步函数
async function syncData() {
    try {
        console.log('开始数据同步...');
        cache.syncStatus = 'syncing';
        cache.lastSyncError = null;
        const startTime = new Date();
        
        // 1. 从JSON文件获取最新数据并更新数据库
        await syncFromJsonFile();
        
        // 2. 从数据库获取最新数据并更新缓存
        const processedData = await updateCacheFromDatabase();
        
        const endTime = new Date();
        const duration = endTime - startTime;
        console.log('数据同步完成，耗时:', duration, 'ms');
        
        return processedData;
    } catch (error) {
        console.error('数据同步失败:', error);
        cache.syncStatus = 'error';
        cache.lastSyncError = error.message;
        throw error;
    }
}

// 定时数据同步任务
function scheduleDataSync() {
    console.log('启动定时数据同步任务...');
    
    // 每5分钟同步一次数据
    const syncInterval = 5 * 60 * 1000;
    
    // 立即执行一次
    syncData();
    
    // 设置定时任务
    const intervalId = setInterval(syncData, syncInterval);
    
    console.log('定时数据同步任务已启动，每', syncInterval / 1000, '秒执行一次');
    
    // 监听进程退出，清理定时任务
    process.on('exit', () => {
        clearInterval(intervalId);
        console.log('定时数据同步任务已停止');
    });
}

// 增强的健康检查接口，包含数据同步状态
app.get('/api/v1/health', (req, res) => {
    const fullResponse = {
        code: 200,
        message: 'API服务运行正常',
        data: {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            status: 'healthy',
            lastSyncTime: cache.lastUpdated?.toISOString() || '从未同步',
            cacheStatus: cache.articles ? '有效' : '无效',
            articleCount: cache.articles?.totalArticles || 0,
            syncStatus: cache.syncStatus,
            lastSyncError: cache.lastSyncError
        }
    };
    console.log('健康检查请求，返回完整响应:', fullResponse);
    res.json(fullResponse);
});

// 添加手动触发同步的接口（暂时移除认证要求，方便手动同步）
app.post('/api/v1/sync/trigger', async (req, res) => {
    try {
        const result = await syncData();
        res.json({
            code: 200,
            message: '手动触发同步成功',
            data: {
                lastSyncTime: cache.lastUpdated?.toISOString(),
                articleCount: result.totalArticles,
                syncStatus: cache.syncStatus
            }
        });
    } catch (error) {
        res.status(500).json({
            code: 500,
            message: '手动触发同步失败',
            errorDetails: {
                reason: error.message
            }
        });
    }
});

// 文章列表接口（兼容旧版本，无版本号）
app.get('/api/articles', (req, res) => {
    const useCache = req.query.useCache !== 'false';
    
    // 如果使用缓存且缓存有效，直接返回缓存数据
    if (useCache && cache.articles && (new Date() - cache.lastUpdated < cache.cacheDuration)) {
        console.log('返回缓存数据');
        return res.json({
            code: 200,
            message: '成功获取文章列表（缓存）',
            data: {
                articles: cache.articles.articles,
                total: cache.articles.totalArticles,
                lastUpdated: cache.lastUpdated?.toISOString()
            },
            syncInfo: {
                fromCache: true,
                cacheAge: new Date() - cache.lastUpdated,
                cacheDuration: cache.cacheDuration,
                syncStatus: cache.syncStatus,
                lastSyncTime: cache.lastUpdated?.toISOString()
            }
        });
    }
    
    // 否则从数据库获取
    const sql = `SELECT * FROM articles ORDER BY last_updated DESC`;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({
                code: 500,
                message: '获取文章列表失败',
                errorDetails: {
                    reason: err.message
                },
                syncInfo: {
                    fromCache: false,
                    syncStatus: cache.syncStatus,
                    lastSyncTime: cache.lastUpdated?.toISOString()
                }
            });
        }
        
        // 按分类分组文章
        const articlesByCategory = {};
        rows.forEach(article => {
            // 过滤掉没有标题的文章
            if (!article.title || article.title.trim() === '') {
                return;
            }
            if (!articlesByCategory[article.category]) {
                articlesByCategory[article.category] = [];
            }
            // 转换为前端需要的格式
            articlesByCategory[article.category].push({
                id: article.article_id,
                title: article.title.trim(),
                content: article.content,
                date: article.last_updated.split('T')[0],
                likes: article.likes,
                views: article.views,
                isFeatured: true, // 默认设为精华
                images: [],
                category: article.category,
                last_updated: article.last_updated,
                version: article.version
            });
        });
        
        res.json({
            code: 200,
            message: '成功获取文章列表（数据库）',
            data: {
                articles: articlesByCategory,
                total: rows.length,
                lastUpdated: new Date().toISOString()
            },
            syncInfo: {
                fromCache: false,
                syncStatus: cache.syncStatus,
                lastSyncTime: cache.lastUpdated?.toISOString()
            }
        });
    });
});

// 增强的文章列表接口，支持缓存
app.get('/api/v1/articles', (req, res) => {
    const useCache = req.query.useCache !== 'false';
    
    // 如果使用缓存且缓存有效，直接返回缓存数据
    if (useCache && cache.articles && (new Date() - cache.lastUpdated < cache.cacheDuration)) {
        console.log('返回缓存数据');
        return res.json({
            code: 200,
            message: '成功获取文章列表（缓存）',
            data: {
                articles: cache.articles.articles,
                total: cache.articles.totalArticles,
                lastUpdated: cache.lastUpdated?.toISOString()
            },
            syncInfo: {
                fromCache: true,
                cacheAge: new Date() - cache.lastUpdated,
                cacheDuration: cache.cacheDuration,
                syncStatus: cache.syncStatus,
                lastSyncTime: cache.lastUpdated?.toISOString()
            }
        });
    }
    
    // 否则从数据库获取
    const sql = `SELECT * FROM articles ORDER BY last_updated DESC`;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({
                code: 500,
                message: '获取文章列表失败',
                errorDetails: {
                    reason: err.message
                },
                syncInfo: {
                    fromCache: false,
                    syncStatus: cache.syncStatus,
                    lastSyncTime: cache.lastUpdated?.toISOString()
                }
            });
        }
        
        // 按分类分组文章
        const articlesByCategory = {};
        rows.forEach(article => {
            // 过滤掉没有标题的文章
            if (!article.title || article.title.trim() === '') {
                return;
            }
            if (!articlesByCategory[article.category]) {
                articlesByCategory[article.category] = [];
            }
            // 转换为前端需要的格式
            articlesByCategory[article.category].push({
                id: article.article_id,
                title: article.title.trim(),
                content: article.content,
                date: article.last_updated.split('T')[0],
                likes: article.likes,
                views: article.views,
                isFeatured: true, // 默认设为精华
                images: [],
                category: article.category,
                last_updated: article.last_updated,
                version: article.version
            });
        });
        
        res.json({
            code: 200,
            message: '成功获取文章列表（数据库）',
            data: {
                articles: articlesByCategory,
                total: rows.length,
                lastUpdated: new Date().toISOString()
            },
            syncInfo: {
                fromCache: false,
                syncStatus: cache.syncStatus,
                lastSyncTime: cache.lastUpdated?.toISOString()
            }
        });
    });
});

// 管理员获取所有文章，支持缓存（暂时移除认证要求，方便自动同步）
app.get('/api/v1/admin/articles', (req, res) => {
    const useCache = req.query.useCache !== 'false';
    
    // 如果使用缓存且缓存有效，直接返回缓存数据
    if (useCache && cache.articles && (new Date() - cache.lastUpdated < cache.cacheDuration)) {
        console.log('返回缓存数据给管理员');
        return res.json({
            code: 200,
            message: '成功获取所有文章（缓存）',
            data: cache.articles.articles,
            lastUpdated: cache.lastUpdated?.toISOString(),
            syncInfo: {
                fromCache: true,
                cacheAge: new Date() - cache.lastUpdated,
                cacheDuration: cache.cacheDuration,
                syncStatus: cache.syncStatus,
                lastSyncTime: cache.lastUpdated?.toISOString()
            }
        });
    }
    
    const sql = `SELECT * FROM articles ORDER BY category, article_id`;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({
                code: 500,
                message: '获取所有文章失败',
                errorDetails: {
                    reason: err.message
                },
                syncInfo: {
                    fromCache: false,
                    syncStatus: cache.syncStatus,
                    lastSyncTime: cache.lastUpdated?.toISOString()
                }
            });
        }
        
        // 按分类分组
        const articlesByCategory = {};
        rows.forEach(article => {
            if (!articlesByCategory[article.category]) {
                articlesByCategory[article.category] = [];
            }
            // 转换为前端需要的格式
            articlesByCategory[article.category].push({
                id: article.article_id,
                title: article.title,
                content: article.content,
                date: article.last_updated.split('T')[0],
                likes: article.likes,
                views: article.views,
                isFeatured: true, // 默认设为精华
                images: [],
                category: article.category
            });
        });
        
        res.json({
            code: 200,
            message: '成功获取所有文章（数据库）',
            data: articlesByCategory,
            lastUpdated: new Date().toISOString(),
            syncInfo: {
                fromCache: false,
                syncStatus: cache.syncStatus,
                lastSyncTime: cache.lastUpdated?.toISOString()
            }
        });
    });
});

// 获取同步状态的接口
app.get('/api/v1/sync/status', (req, res) => {
    res.json({
        code: 200,
        message: '成功获取同步状态',
        data: {
            syncStatus: cache.syncStatus,
            lastSyncTime: cache.lastUpdated?.toISOString(),
            lastSyncError: cache.lastSyncError,
            cacheAge: cache.lastUpdated ? new Date() - cache.lastUpdated : null,
            cacheDuration: cache.cacheDuration,
            articleCount: cache.articles?.totalArticles || 0
        }
    });
});

// 调试接口：查看数据库中的所有文章记录
app.get('/api/v1/debug/articles', (req, res) => {
    const sql = `SELECT * FROM articles ORDER BY category, article_id`;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({
                code: 500,
                message: '获取文章失败',
                errorDetails: {
                    reason: err.message
                }
            });
        }
        
        res.json({
            code: 200,
            message: '成功获取所有文章记录',
            data: {
                articles: rows,
                total: rows.length
            }
        });
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`文章同步API服务已启动，监听端口 ${PORT}`);
    console.log(`健康检查: http://localhost:${PORT}/api/v1/health`);
    console.log(`API文档: http://localhost:${PORT}/api/v1/`);
    console.log(`登录接口: http://localhost:${PORT}/api/v1/auth/login`);
    console.log(`同步接口: http://localhost:${PORT}/api/v1/articles/sync`);
    
    // 启动定时数据同步任务
    scheduleDataSync();
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('正在关闭服务器...');
    db.close((err) => {
        if (err) {
            console.error('关闭数据库连接失败:', err.message);
        } else {
            console.log('数据库连接已关闭');
        }
        process.exit(0);
    });
});