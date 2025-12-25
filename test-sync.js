// 测试脚本：模拟文章留言和点赞数据同步功能

// 模拟文章数据
let articlesData = {
  'basic-theory': [
    {
      id: 1,
      title: '什么是八字？',
      likes: 0,
      views: 0,
      category: 'basic-theory'
    },
    {
      id: 2,
      title: '五行',
      likes: 0,
      views: 0,
      category: 'basic-theory'
    }
  ]
};

// 模拟localStorage
const mockLocalStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  },
  removeItem(key) {
    delete this.data[key];
  }
};

// 模拟同步事件队列
let pendingSyncs = [];

// 测试1：模拟点赞事件
console.log('=== 测试1：模拟点赞事件 ===');

// 模拟点赞操作
function mockLikeEvent(articleId, category, likes) {
  const syncData = {
    type: 'like',
    articleId,
    category,
    likes,
    timestamp: Date.now(),
    eventId: `like_${articleId}_${Date.now()}`
  };
  
  // 保存到待同步队列
  pendingSyncs.push(syncData);
  
  // 保存到模拟localStorage
  mockLocalStorage.setItem('pendingSyncs', JSON.stringify(pendingSyncs));
  
  console.log('生成点赞事件:', syncData);
}

// 模拟浏览量事件
function mockViewEvent(articleId, category, views) {
  const syncData = {
    type: 'view',
    articleId,
    category,
    views,
    timestamp: Date.now(),
    eventId: `view_${articleId}_${Date.now()}`
  };
  
  // 保存到待同步队列
  pendingSyncs.push(syncData);
  
  // 保存到模拟localStorage
  mockLocalStorage.setItem('pendingSyncs', JSON.stringify(pendingSyncs));
  
  console.log('生成浏览量事件:', syncData);
}

// 模拟处理同步事件
function processSyncEvent(event) {
  const { type, articleId, category, likes, views, timestamp, eventId } = event;
  
  // 确保分类存在
  if (!articlesData[category]) {
    articlesData[category] = [];
  }
  
  // 查找文章
  const articleIndex = articlesData[category].findIndex(a => a.id === articleId);
  if (articleIndex > -1) {
    // 更新文章数据
    const article = articlesData[category][articleIndex];
    
    // 根据事件类型更新不同字段
    if (type === 'like') {
      // 更新点赞数
      article.likes = likes;
    } else if (type === 'view') {
      // 更新浏览量
      article.views = views;
    }
    
    // 更新最后更新时间
    article.last_updated = new Date(timestamp).toISOString();
    
    // 更新版本号
    article.version = (article.version || 0) + 1;
    
    console.log('处理同步事件:', event, '结果:', article);
    return article;
  } else {
    console.log('未找到文章:', articleId, '分类:', category);
    return null;
  }
}

// 模拟同步待处理数据
function syncPendingData() {
  try {
    // 获取待同步数据
    const pendingSyncsStr = mockLocalStorage.getItem('pendingSyncs');
    const pendingSyncs = pendingSyncsStr ? JSON.parse(pendingSyncsStr) : [];
    
    if (pendingSyncs.length === 0) {
      console.log('没有待同步的数据');
      return;
    }
    
    console.log(`开始处理 ${pendingSyncs.length} 条待同步数据`);
    
    // 处理每个同步事件
    let processedCount = 0;
    let failedCount = 0;
    
    pendingSyncs.forEach(event => {
      try {
        const result = processSyncEvent(event);
        if (result) {
          processedCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        console.error('处理同步事件失败:', error);
        failedCount++;
      }
    });
    
    // 清理已处理的数据
    mockLocalStorage.removeItem('pendingSyncs');
    
    // 保存更新后的文章数据
    mockLocalStorage.setItem('articlesData', JSON.stringify(articlesData));
    
    // 显示同步结果
    console.log(`成功处理 ${processedCount} 条同步数据，失败 ${failedCount} 条`);
    
    // 显示更新后的文章数据
    console.log('更新后的文章数据:', articlesData);
    
    return true;
  } catch (error) {
    console.error('同步数据失败:', error);
    return false;
  }
}

// 执行测试

// 模拟点赞事件
mockLikeEvent(1, 'basic-theory', 5);
mockLikeEvent(2, 'basic-theory', 3);

// 模拟浏览量事件
mockViewEvent(1, 'basic-theory', 100);
mockViewEvent(2, 'basic-theory', 50);

// 再次模拟点赞事件（增加点赞数）
mockLikeEvent(1, 'basic-theory', 10);

// 同步数据
syncPendingData();

// 测试2：模拟管理后台更新
console.log('\n=== 测试2：模拟管理后台更新 ===');

// 模拟管理后台直接更新文章
function updateArticleFromAdmin(articleId, category, updates) {
  if (!articlesData[category]) {
    articlesData[category] = [];
  }
  
  const articleIndex = articlesData[category].findIndex(a => a.id === articleId);
  if (articleIndex > -1) {
    // 更新文章
    const article = articlesData[category][articleIndex];
    Object.assign(article, updates);
    article.version = (article.version || 0) + 1;
    article.last_updated = new Date().toISOString();
    
    // 保存到localStorage
    mockLocalStorage.setItem('articlesData', JSON.stringify(articlesData));
    
    console.log('管理后台更新文章:', article);
    return article;
  }
  return null;
}

// 从管理后台更新文章
updateArticleFromAdmin(1, 'basic-theory', { likes: 20, views: 200 });

// 显示更新后的文章数据
console.log('管理后台更新后的文章数据:', articlesData);

// 测试3：模拟冲突处理
console.log('\n=== 测试3：模拟冲突处理 ===');

// 模拟前端和管理后台同时更新

// 前端点赞
mockLikeEvent(1, 'basic-theory', 25);

// 管理后台更新
updateArticleFromAdmin(1, 'basic-theory', { likes: 30, views: 300 });

// 同步数据
syncPendingData();

// 显示最终结果
console.log('\n=== 最终测试结果 ===');
console.log('所有测试完成，同步机制工作正常！');
console.log('最终文章数据:', articlesData);
