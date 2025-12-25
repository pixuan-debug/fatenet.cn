// 模拟API服务 - 用于替代真实Node.js API服务
// 提供与真实API相同的接口和响应格式

// 模拟数据库
const mockDatabase = {
    articles: {},
    syncEvents: [],
    lastId: 1
};

// 初始化模拟数据
function initMockData() {
    // 从articles.json加载初始数据
    fetch('articles.json')
        .then(response => response.json())
        .then(data => {
            // 初始化文章数据
            Object.keys(data).forEach(category => {
                data[category].forEach(article => {
                    if (!mockDatabase.articles[category]) {
                        mockDatabase.articles[category] = [];
                    }
                    mockDatabase.articles[category].push({
                        ...article,
                        version: 1,
                        last_updated: new Date().toISOString()
                    });
                });
            });
            console.log('模拟API数据初始化完成');
        })
        .catch(error => {
            console.error('初始化模拟数据失败:', error);
        });
}

// 模拟API请求处理类
class MockAPI {
    constructor() {
        this.apiBase = 'http://localhost:3000/api/v1';
    }
    
    // 模拟延迟
    delay(ms = 200) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // 生成唯一ID
    generateId() {
        return `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // 模拟登录获取Token
    async login(username, password) {
        await this.delay();
        
        if (username === 'admin' && password === 'admin123') {
            return {
                code: 200,
                message: '登录成功',
                data: {
                    token: 'mock_jwt_token_' + Date.now(),
                    username: 'admin',
                    role: 'admin'
                }
            };
        } else {
            return {
                code: 401,
                message: '用户名或密码错误',
                errorDetails: {
                    field: 'username/password',
                    reason: '无效的登录凭证',
                    solution: '请检查用户名和密码是否正确'
                }
            };
        }
    }
    
    // 模拟获取文章列表
    async getArticles() {
        await this.delay();
        
        // 转换为列表格式
        const articlesList = [];
        Object.keys(mockDatabase.articles).forEach(category => {
            mockDatabase.articles[category].forEach(article => {
                articlesList.push(article);
            });
        });
        
        return {
            code: 200,
            message: '成功获取文章列表',
            data: {
                articles: articlesList,
                total: articlesList.length
            }
        };
    }
    
    // 模拟获取单篇文章
    async getArticle(articleId, category) {
        await this.delay();
        
        if (mockDatabase.articles[category]) {
            const article = mockDatabase.articles[category].find(a => a.id === articleId);
            if (article) {
                return {
                    code: 200,
                    message: '成功获取文章',
                    data: article
                };
            }
        }
        
        return {
            code: 404,
            message: '文章不存在',
            errorDetails: {
                reason: '未找到指定ID的文章'
            }
        };
    }
    
    // 模拟同步文章数据
    async syncArticle(data) {
        await this.delay();
        
        const { type, articleId, category, likes, views, timestamp, eventId } = data;
        
        // 验证必填参数
        if (!eventId || !type || !articleId || !category) {
            return {
                code: 400,
                message: '请求参数不完整',
                errorDetails: {
                    reason: '缺少必填参数',
                    required: ['eventId', 'type', 'articleId', 'category']
                }
            };
        }
        
        // 保存同步事件
        mockDatabase.syncEvents.push({
            eventId,
            type,
            articleId,
            category,
            data: {...data},
            status: 'processed',
            created_at: new Date().toISOString()
        });
        
        // 确保分类存在
        if (!mockDatabase.articles[category]) {
            mockDatabase.articles[category] = [];
        }
        
        // 查找文章
        let article = mockDatabase.articles[category].find(a => a.id === articleId);
        let isNew = false;
        
        if (!article) {
            // 创建新文章
            article = {
                id: articleId,
                title: `文章 ${articleId}`,
                content: '',
                category,
                likes: likes || 0,
                views: views || 0,
                version: 1,
                last_updated: new Date(timestamp || Date.now()).toISOString()
            };
            mockDatabase.articles[category].push(article);
            isNew = true;
        } else {
            // 更新现有文章
            if (type === 'like' && likes !== undefined) {
                article.likes = likes;
            } else if (type === 'view' && views !== undefined) {
                article.views = views;
            }
            
            article.version += 1;
            article.last_updated = new Date(timestamp || Date.now()).toISOString();
        }
        
        // 返回响应
        return {
            code: isNew ? 201 : 200,
            message: isNew ? '文章记录创建成功' : '文章数据更新成功',
            data: {
                syncedEvents: 1,
                articleId,
                category,
                likes: article.likes,
                views: article.views,
                timestamp: article.last_updated,
                version: article.version,
                status: isNew ? 'created' : 'updated'
            },
            requestId: eventId
        };
    }
    
    // 模拟获取所有文章（管理员）
    async getAllArticles() {
        await this.delay();
        return {
            code: 200,
            message: '成功获取所有文章',
            data: mockDatabase.articles
        };
    }
    
    // 模拟获取同步事件
    async getSyncEvents(status = 'all', limit = 100) {
        await this.delay();
        
        let events = [...mockDatabase.syncEvents];
        
        if (status !== 'all') {
            events = events.filter(event => event.status === status);
        }
        
        // 按创建时间倒序
        events.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // 限制数量
        events = events.slice(0, limit);
        
        return {
            code: 200,
            message: '成功获取同步事件',
            data: {
                events,
                total: events.length
            }
        };
    }
    
    // 模拟健康检查
    async healthCheck() {
        await this.delay(100);
        return {
            code: 200,
            message: 'API服务运行正常',
            data: {
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                status: 'healthy'
            }
        };
    }
}

// 初始化模拟API
const mockApi = new MockAPI();

// 页面加载时初始化模拟数据
window.addEventListener('DOMContentLoaded', initMockData);

// 暴露全局API对象
window.mockApi = mockApi;