// 文章数据管理

// 数据收集器类
class DataCollector {
    constructor() {
        this.pendingSyncData = JSON.parse(localStorage.getItem('pendingSyncData')) || [];
        this.syncInterval = null;
        this.API_URL = '/api/v1/articles/sync';
        this.syncStatus = 'idle';
        // 设备唯一标识符
        this.deviceId = this.getOrGenerateDeviceId();
        // 本地操作记录，用于去重
        this.localActions = JSON.parse(localStorage.getItem('localActions')) || {};
        this.init();
    }

    init() {
        // 设置定期同步
        this.setSyncInterval(60000); // 60秒同步一次
    }

    // 获取或生成设备唯一标识符
    getOrGenerateDeviceId() {
        let deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            // 生成随机设备ID
            deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
            localStorage.setItem('deviceId', deviceId);
        }
        return deviceId;
    }

    // 保存本地操作记录
    saveLocalActions() {
        localStorage.setItem('localActions', JSON.stringify(this.localActions));
    }

    // 设置同步间隔
    setSyncInterval(ms) {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        this.syncInterval = setInterval(() => {
            this.syncPendingData();
        }, ms);
    }

    // 记录文章点赞
    recordLike(articleId, category) {
        const actionKey = `like_${articleId}_${category}`;
        
        // 检查是否已经点赞过，避免重复
        if (this.localActions[actionKey]) {
            console.log('已经点赞过该文章，跳过重复记录');
            return;
        }
        
        const event = {
            eventId: Date.now(),
            type: 'like',
            articleId: articleId,
            category: category,
            timestamp: Date.now(),
            deviceId: this.deviceId
        };
        
        // 记录到本地操作记录
        this.localActions[actionKey] = true;
        this.saveLocalActions();
        
        this.pendingSyncData.push(event);
        this.saveToLocalStorage();
        this.syncPendingData(); // 立即尝试同步
    }

    // 记录文章浏览
    recordView(articleId, category) {
        const actionKey = `view_${articleId}_${category}`;
        
        // 检查是否已经浏览过，避免重复
        if (this.localActions[actionKey]) {
            console.log('已经浏览过该文章，跳过重复记录');
            return;
        }
        
        const event = {
            eventId: Date.now(),
            type: 'view',
            articleId: articleId,
            category: category,
            timestamp: Date.now(),
            deviceId: this.deviceId
        };
        
        // 记录到本地操作记录
        this.localActions[actionKey] = true;
        this.saveLocalActions();
        
        this.pendingSyncData.push(event);
        this.saveToLocalStorage();
    }

    // 保存到本地存储
    saveToLocalStorage() {
        localStorage.setItem('pendingSyncData', JSON.stringify(this.pendingSyncData));
    }

    // 同步待处理数据到API
    async syncPendingData() {
        if (this.pendingSyncData.length === 0 || this.syncStatus === 'syncing') {
            return;
        }

        this.syncStatus = 'syncing';
        
        try {
            // 计算每条文章的总点赞和总浏览
            const aggregatedData = this.aggregateData();
            
            // 发送同步请求
            for (const data of aggregatedData) {
                const response = await this.sendSyncRequest(data);
                if (response && response.success) {
                    // 同步成功，从待处理列表中移除相关事件
                    this.removeSyncedEvents(data.eventIds);
                }
            }
        } catch (error) {
            console.error('同步数据失败:', error);
        } finally {
            this.syncStatus = 'idle';
        }
    }

    // 聚合数据
    aggregateData() {
        const articleDataMap = new Map();
        
        // 遍历所有待处理事件
        this.pendingSyncData.forEach(event => {
            const key = `${event.articleId}-${event.category}`;
            
            if (!articleDataMap.has(key)) {
                articleDataMap.set(key, {
                    articleId: event.articleId,
                    category: event.category,
                    likes: 0,
                    views: 0,
                    eventIds: []
                });
            }
            
            const data = articleDataMap.get(key);
            data.eventIds.push(event.eventId);
            
            if (event.type === 'like') {
                data.likes++;
            } else if (event.type === 'view') {
                data.views++;
            }
        });
        
        // 转换为数组并添加sync类型
        return Array.from(articleDataMap.values()).map(data => ({
            eventId: Date.now(),
            type: 'sync',
            articleId: data.articleId,
            category: data.category,
            likes: data.likes,
            views: data.views,
            timestamp: Date.now(),
            eventIds: data.eventIds
        }));
    }

    // 发送同步请求
    async sendSyncRequest(data) {
        try {
            // 移除eventIds，API不需要
            const { eventIds, ...syncData } = data;
            
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(syncData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP错误! 状态: ${response.status}`);
            }
            
            const result = await response.json();
            return {
                success: result.code === 200,
                data: result
            };
        } catch (error) {
            console.error('发送同步请求失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 移除已同步的事件
    removeSyncedEvents(syncedEventIds) {
        this.pendingSyncData = this.pendingSyncData.filter(event => 
            !syncedEventIds.includes(event.eventId)
        );
        this.saveToLocalStorage();
    }

    // 停止同步
    stopSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }
}

// 初始化数据收集器
const dataCollector = new DataCollector();

// 获取单篇文章
async function fetchArticle(articleId, category) {
    try {
        let url = `/api/v1/articles/${articleId}`;
        if (category) {
            url += `?category=${category}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP错误! 状态: ${response.status}`);
        }
        
        const result = await response.json();
        return result.code === 200 ? result.data : null;
    } catch (error) {
        console.error('获取文章失败:', error);
        return null;
    }
}

// 获取文章列表
async function fetchArticles(category = null, useCache = false) {
    try {
        let url = '/api/v1/articles';
        if (category) {
            url += `?category=${category}&useCache=${useCache}`;
        } else {
            url += `?useCache=${useCache}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP错误! 状态: ${response.status}`);
        }
        
        const result = await response.json();
        return result.code === 200 ? result.data : null;
    } catch (error) {
        console.error('获取文章失败:', error);
        return null;
    }
}

// 点赞文章
async function likeArticle(articleId, category) {
    try {
        // 记录点赞
        dataCollector.recordLike(articleId, category);
        
        console.log('点赞文章:', articleId, category);
        
        // 立即同步数据
        await dataCollector.syncPendingData();
        
        return { success: true, message: '点赞成功，数据已同步' };
    } catch (error) {
        console.error('点赞失败:', error);
        return { success: false, message: '点赞失败，请稍后重试' };
    }
}

// 浏览文章
async function viewArticle(articleId, category) {
    try {
        // 记录浏览
        dataCollector.recordView(articleId, category);
        
        console.log('浏览文章:', articleId, category);
        
        // 立即同步数据
        await dataCollector.syncPendingData();
        
        return { success: true, message: '浏览记录成功，数据已同步' };
    } catch (error) {
        console.error('记录浏览失败:', error);
        return { success: false, message: '记录浏览失败' };
    }
}

// 更新本地存储中的文章数据
async function updateLocalArticlesData(articlesData) {
    try {
        // 存储最新文章数据到localStorage
        localStorage.setItem('articlesData', JSON.stringify(articlesData));
        console.log('本地文章数据已更新');
        return true;
    } catch (error) {
        console.error('更新本地文章数据失败:', error);
        return false;
    }
}

// 从服务器获取最新数据并同步到本地存储
async function syncLocalStorage() {
    try {
        console.log('开始同步本地存储...');
        
        // 优先从articles.json加载数据，确保获取到最新的本地文件数据
        let latestArticles = {};
        try {
            const jsonResponse = await fetch('articles.json');
            if (jsonResponse.ok) {
                latestArticles = await jsonResponse.json();
                console.log('从articles.json获取到最新数据');
            }
        } catch (jsonError) {
            console.error('加载articles.json失败:', jsonError);
        }
        
        // 如果articles.json加载失败或为空，尝试从API获取
        if (Object.keys(latestArticles).length === 0) {
            // 获取最新文章数据
            const articlesResponse = await fetchArticles(null, false); // 强制从服务器获取最新数据，不使用缓存
            
            // 处理不同的API响应格式
            if (articlesResponse) {
                if (articlesResponse.articles) {
                    // 响应包含articles字段
                    latestArticles = articlesResponse.articles;
                } else if (typeof articlesResponse === 'object' && !Array.isArray(articlesResponse)) {
                    // 响应本身就是文章对象
                    latestArticles = articlesResponse;
                }
            }
        }
        
        if (Object.keys(latestArticles).length > 0) {
            // 直接使用最新数据，不合并本地存储，确保清除旧的缓存数据
            await updateLocalArticlesData(latestArticles);
            // 触发自定义事件，通知其他组件数据已更新
            window.dispatchEvent(new CustomEvent('articlesDataUpdated', { detail: latestArticles }));
            console.log('本地存储同步完成，已清除旧缓存数据');
        } else {
            console.log('未获取到有效文章数据，跳过同步');
        }
    } catch (error) {
        console.error('同步本地存储失败:', error);
        // 同步失败时，确保本地存储有数据，使用默认数据
        const localData = localStorage.getItem('articlesData');
        if (!localData) {
            try {
                // 尝试从articles.json加载默认数据
                const response = await fetch('articles.json');
                if (response.ok) {
                    const defaultData = await response.json();
                    await updateLocalArticlesData(defaultData);
                    console.log('使用articles.json作为默认数据');
                }
            } catch (jsonError) {
                console.error('加载articles.json失败:', jsonError);
            }
        }
    }
}

// 合并文章数据，解决冲突
function mergeArticlesData(localData, serverData) {
    // 创建合并结果，以服务器数据为权威源
    const mergedData = { ...serverData };
    
    // 遍历所有分类，合并本地精华状态
    Object.keys(mergedData).forEach(category => {
        // 确保分类存在且是数组
        if (!Array.isArray(mergedData[category])) {
            mergedData[category] = [];
        }
        
        // 遍历服务器文章，合并本地精华状态
        mergedData[category].forEach((serverArticle, index) => {
            // 查找对应本地文章
            if (localData[category] && Array.isArray(localData[category])) {
                const localArticle = localData[category].find(
                    localArticle => localArticle.id === serverArticle.id
                );
                
                if (localArticle) {
                    // 保留本地精华状态
                    mergedData[category][index] = {
                        ...serverArticle, // 以服务器数据为主
                        isFeatured: localArticle.isFeatured || serverArticle.isFeatured || false // 保留本地精华状态
                    };
                }
            }
        });
    });
    
    return mergedData;
}

// 监听localStorage变化，实现跨页面数据同步
window.addEventListener('storage', (event) => {
    if (event.key === 'articlesData') {
        console.log('检测到localStorage变化，刷新文章数据...');
        // 触发自定义事件，通知其他组件数据已更新
        const articlesData = event.newValue ? JSON.parse(event.newValue) : null;
        window.dispatchEvent(new CustomEvent('articlesDataUpdated', { detail: articlesData }));
    }
});

// 页面加载时同步数据
document.addEventListener('DOMContentLoaded', async () => {
    await syncLocalStorage();
    
    // 设置定期同步，每30秒从服务器获取一次最新数据
    setInterval(async () => {
        await syncLocalStorage();
    }, 30000);
});

// 导出
window.articleManager = {
    fetchArticles,
    fetchArticle,
    likeArticle,
    viewArticle,
    dataCollector,
    syncLocalStorage
};
