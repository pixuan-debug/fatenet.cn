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

    // 导入初始文章数据
    importInitialArticles();
}

// 导入初始文章数据
function importInitialArticles() {
    const articlesJsonPath = path.join(__dirname, '..', 'articles.json');
    
    fs.readFile(articlesJsonPath, 'utf8', (err, data) => {
        if (err) {
            console.error('读取articles.json失败:', err.message);
            return;
        }

        try {
            const articlesData = JSON.parse(data);
            
            // 遍历所有分类
            Object.keys(articlesData).forEach(category => {
                const categoryArticles = articlesData[category];
                
                categoryArticles.forEach(article => {
                    // 插入或更新文章
                    const sql = `INSERT OR REPLACE INTO articles 
                                (article_id, category, title, content, likes, views, last_updated, version) 
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
                    
                    const lastUpdated = new Date(article.date || Date.now()).toISOString();
                    
                    db.run(sql, [
                        article.id,
                        category,
                        article.title,
                        article.content,
                        article.likes || 0,
                        article.views || 0,
                        lastUpdated,
                        1
                    ], function(err) {
                        if (err) {
                            console.error('导入文章失败:', err.message);
                        } else {
                            console.log(`成功导入文章: ${article.title} (${article.id})`);
                        }
                    });
                });
            });
        } catch (parseErr) {
            console.error('解析articles.json失败:', parseErr.message);
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

// 公开路由：获取文章列表
app.get('/api/v1/articles', (req, res) => {
    const sql = `SELECT * FROM articles ORDER BY last_updated DESC`;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({
                code: 500,
                message: '获取文章列表失败',
                errorDetails: {
                    reason: err.message
                }
            });
        }
        
        res.json({
            code: 200,
            message: '成功获取文章列表',
            data: {
                articles: rows,
                total: rows.length
            }
        });
    });
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
        
        res.json({
            code: 200,
            message: '成功获取文章',
            data: row
        });
    });
});

// 公开路由：同步文章数据（点赞、浏览量）
app.post('/api/v1/articles/sync', (req, res) => {
    const { type, articleId, category, likes, views, timestamp, eventId } = req.body;
    
    // 验证必填参数
    if (!eventId || !type || !articleId || !category) {
        return res.status(400).json({
            code: 400,
            message: '请求参数不完整',
            errorDetails: {
                reason: '缺少必填参数',
                required: ['eventId', 'type', 'articleId', 'category']
            }
        });
    }
    
    // 保存同步事件
    const syncEventSql = `INSERT OR IGNORE INTO sync_events 
                        (event_id, event_type, article_id, category, data, status) 
                        VALUES (?, ?, ?, ?, ?, ?)`;
    
    const eventData = JSON.stringify(req.body);
    
    db.run(syncEventSql, [eventId, type, articleId, category, eventData, 'processed'], (err) => {
        if (err) {
            console.error('保存同步事件失败:', err.message);
        }
    });
    
    // 更新文章数据
    let updateSql = `UPDATE articles SET `;
    let updateParams = [];
    let updateFields = [];
    
    if (type === 'like' && likes !== undefined) {
        updateFields.push(`likes = ?`);
        updateParams.push(likes);
    } else if (type === 'view' && views !== undefined) {
        updateFields.push(`views = ?`);
        updateParams.push(views);
    }
    
    // 更新版本号和最后更新时间
    updateFields.push(`version = version + 1`);
    updateFields.push(`last_updated = ?`);
    updateParams.push(new Date(timestamp || Date.now()).toISOString());
    
    updateSql += updateFields.join(', ') + ` WHERE article_id = ? AND category = ?`;
    updateParams.push(articleId, category);
    
    db.run(updateSql, updateParams, function(err) {
        if (err) {
            return res.status(500).json({
                code: 500,
                message: '更新文章数据失败',
                errorDetails: {
                    reason: err.message
                }
            });
        }
        
        // 检查是否更新了记录
        if (this.changes === 0) {
            // 文章不存在，创建新记录
            const insertSql = `INSERT INTO articles 
                            (article_id, category, likes, views, last_updated, version) 
                            VALUES (?, ?, ?, ?, ?, ?)`;
            
            db.run(insertSql, [
                articleId, 
                category, 
                likes || 0, 
                views || 0, 
                new Date(timestamp || Date.now()).toISOString(), 
                1
            ], function(err) {
                if (err) {
                    return res.status(500).json({
                        code: 500,
                        message: '创建文章记录失败',
                        errorDetails: {
                            reason: err.message
                        }
                    });
                }
                
                // 返回成功响应
                res.json({
                    code: 201,
                    message: '文章记录创建成功',
                    data: {
                        syncedEvents: 1,
                        articleId,
                        category,
                        likes: likes || 0,
                        views: views || 0,
                        timestamp: new Date().toISOString(),
                        version: 1,
                        status: 'created'
                    },
                    requestId: eventId
                });
            });
        } else {
            // 查询更新后的文章数据
            db.get(`SELECT * FROM articles WHERE article_id = ? AND category = ?`, 
                  [articleId, category], (err, updatedArticle) => {
                if (err) {
                    console.error('查询更新后文章失败:', err.message);
                }
                
                // 返回成功响应
                res.json({
                    code: 200,
                    message: '文章数据更新成功',
                    data: {
                        syncedEvents: 1,
                        articleId,
                        category,
                        likes: updatedArticle?.likes || likes,
                        views: updatedArticle?.views || views,
                        timestamp: updatedArticle?.last_updated || new Date().toISOString(),
                        version: updatedArticle?.version || 1,
                        status: 'updated'
                    },
                    requestId: eventId
                });
            });
        }
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

// 管理员路由：获取所有文章数据（需要认证）
app.get('/api/v1/admin/articles', authenticateToken, (req, res) => {
    const sql = `SELECT * FROM articles ORDER BY category, article_id`;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({
                code: 500,
                message: '获取所有文章失败',
                errorDetails: {
                    reason: err.message
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
            message: '成功获取所有文章',
            data: articlesByCategory
        });
    });
});

// 健康检查路由
app.get('/api/v1/health', (req, res) => {
    res.json({
        code: 200,
        message: 'API服务运行正常',
        data: {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            status: 'healthy'
        }
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`文章同步API服务已启动，监听端口 ${PORT}`);
    console.log(`健康检查: http://localhost:${PORT}/api/v1/health`);
    console.log(`API文档: http://localhost:${PORT}/api/v1/`);
    console.log(`登录接口: http://localhost:${PORT}/api/v1/auth/login`);
    console.log(`同步接口: http://localhost:${PORT}/api/v1/articles/sync`);
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