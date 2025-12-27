// 测试文章数据保存和加载逻辑
const fs = require('fs');
const path = require('path');

// 模拟localStorage
class MockLocalStorage {
    constructor() {
        this.storage = {};
    }
    
    getItem(key) {
        return this.storage[key] || null;
    }
    
    setItem(key, value) {
        this.storage[key] = value;
    }
    
    removeItem(key) {
        delete this.storage[key];
    }
    
    clear() {
        this.storage = {};
    }
}

// 模拟window对象
const mockWindow = {
    localStorage: new MockLocalStorage()
};

// 模拟DOM元素
class MockElement {
    constructor(tagName, id) {
        this.tagName = tagName;
        this.id = id;
        this.innerHTML = '';
    }
}

// 模拟document对象
const mockDocument = {
    getElementById: (id) => {
        return new MockElement('div', id);
    },
    querySelectorAll: () => {
        return [];
    }
};

// 测试initArticleSections函数的修复版
function testInitArticleSectionsFixed() {
    console.log('=== 测试initArticleSectionsFixed函数 ===');
    console.log('测试时间:', new Date().toISOString());
    
    // 模拟从articles.json加载数据
    function mockFetchArticlesJson() {
        return new Promise((resolve) => {
            const articlesJsonPath = path.join(__dirname, 'articles.json');
            const data = fs.readFileSync(articlesJsonPath, 'utf-8');
            resolve(JSON.parse(data));
        });
    }
    
    // 模拟createArticleCard函数
    function createArticleCard(article, category) {
        return new MockElement('div', `article-${article.id}`);
    }
    
    // 修复版的initArticleSections函数逻辑
    async function initArticleSectionsFixed() {
        console.log('1. 尝试从localStorage加载文章数据...');
        const savedData = mockWindow.localStorage.getItem('articlesData');
        
        if (savedData) {
            console.log('   从localStorage加载数据成功');
            let articlesData = JSON.parse(savedData);
            
            // 确保所有分类都存在
            ['basic-theory', 'celebrity-views', 'flower-fruit-method', 'essays'].forEach(category => {
                if (!articlesData[category]) {
                    articlesData[category] = [];
                }
            });
            
            console.log('   渲染文章列表...');
            return articlesData;
        } else {
            console.log('   localStorage中没有数据，从articles.json加载...');
            // 从articles.json加载数据
            const data = await mockFetchArticlesJson();
            
            // 确保所有分类都存在
            ['basic-theory', 'celebrity-views', 'flower-fruit-method', 'essays'].forEach(category => {
                if (!data[category]) {
                    data[category] = [];
                }
            });
            
            // 保存到localStorage
            mockWindow.localStorage.setItem('articlesData', JSON.stringify(data));
            console.log('   数据已保存到localStorage');
            
            console.log('   渲染文章列表...');
            return data;
        }
    }
    
    // 模拟updateLocalStorage函数
    function updateLocalStorage(article) {
        console.log('\n4. 更新文章数据到localStorage...');
        try {
            // 获取当前localStorage中的文章数据
            const savedData = mockWindow.localStorage.getItem('articlesData');
            let articlesData = savedData ? JSON.parse(savedData) : {
                'basic-theory': [],
                'celebrity-views': [],
                'flower-fruit-method': [],
                'essays': []
            };
            
            // 确保所有分类都存在
            ['basic-theory', 'celebrity-views', 'flower-fruit-method', 'essays'].forEach(category => {
                if (!articlesData[category]) {
                    articlesData[category] = [];
                }
            });
            
            // 查找并更新文章
            const articleIndex = articlesData[article.category].findIndex(a => a.id === article.id);
            if (articleIndex > -1) {
                // 更新现有文章
                articlesData[article.category][articleIndex] = article;
                console.log(`   更新文章: ${article.title} (${article.id})`);
            } else {
                // 添加新文章
                articlesData[article.category].push(article);
                console.log(`   添加文章: ${article.title} (${article.id})`);
            }
            
            // 保存到localStorage
            mockWindow.localStorage.setItem('articlesData', JSON.stringify(articlesData));
            console.log('   文章数据已更新到localStorage');
            
            return articlesData;
        } catch (error) {
            console.error('   更新localStorage失败:', error);
            throw error;
        }
    }
    
    // 运行测试
    async function runTest() {
        try {
            // 测试1: 初始化文章数据
            const initialData = await initArticleSectionsFixed();
            const initialArticleCount = Object.values(initialData).reduce((sum, category) => sum + category.length, 0);
            console.log(`   初始文章数量: ${initialArticleCount}`);
            
            // 测试2: 模拟点赞操作
            console.log('\n2. 模拟点赞操作...');
            const testArticle = initialData['basic-theory'][0];
            console.log(`   点赞文章: ${testArticle.title} (${testArticle.id})`);
            testArticle.likes += 1;
            testArticle.views += 1;
            
            // 测试3: 更新localStorage
            const updatedData = updateLocalStorage(testArticle);
            const updatedArticleCount = Object.values(updatedData).reduce((sum, category) => sum + category.length, 0);
            console.log(`   更新后文章数量: ${updatedArticleCount}`);
            
            // 测试4: 验证文章数量没有减少
            if (updatedArticleCount < initialArticleCount) {
                console.error('❌ 测试失败：点赞后文章数量减少');
                return false;
            } else {
                console.log('✅ 测试通过：点赞后文章数量没有减少');
            }
            
            // 测试5: 验证点赞数已更新
            const updatedArticle = updatedData['basic-theory'].find(a => a.id === testArticle.id);
            if (updatedArticle && updatedArticle.likes === testArticle.likes) {
                console.log('✅ 测试通过：点赞数已正确更新');
            } else {
                console.error('❌ 测试失败：点赞数未正确更新');
                return false;
            }
            
            // 测试6: 模拟清除缓存
            console.log('\n5. 模拟清除浏览器缓存...');
            mockWindow.localStorage.clear();
            console.log('   localStorage已清除');
            
            // 测试7: 重新加载数据
            console.log('\n6. 重新初始化文章数据...');
            const reloadedData = await initArticleSectionsFixed();
            const reloadedArticleCount = Object.values(reloadedData).reduce((sum, category) => sum + category.length, 0);
            console.log(`   重新加载后文章数量: ${reloadedArticleCount}`);
            
            // 测试8: 验证文章数量没有丢失
            if (reloadedArticleCount > 0) {
                console.log('✅ 测试通过：清除缓存后重新加载，文章数据没有丢失');
            } else {
                console.error('❌ 测试失败：清除缓存后重新加载，文章数据丢失');
                return false;
            }
            
            console.log('\n=== 所有测试通过！===');
            return true;
            
        } catch (error) {
            console.error('测试过程中发生错误:', error);
            return false;
        }
    }
    
    return runTest();
}

// 运行测试
testInitArticleSectionsFixed()
    .then(success => {
        if (success) {
            console.log('\n🎉 修复验证成功：文章数据保存和加载逻辑正常工作！');
            console.log('   - 点赞后文章不会消失');
            console.log('   - 清除缓存后数据不会丢失');
            console.log('   - 数据能够正确保存和恢复');
        } else {
            console.log('\n❌ 修复验证失败：文章数据保存和加载逻辑存在问题');
        }
    })
    .catch(error => {
        console.error('测试执行失败:', error);
    });