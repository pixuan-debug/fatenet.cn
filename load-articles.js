// 文章加载和渲染逻辑
function initArticles() {
    // 尝试从本地存储或articles.json加载文章数据
    loadArticles();
    
    // 为所有查看更多按钮添加点击事件处理
    const viewMoreBtns = document.querySelectorAll('.view-more-btn');
    viewMoreBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            // 跳转到文章列表页面
            window.location.href = 'articles.html';
        });
    });
    
    // 加载文章数据函数
    async function loadArticles() {
        let articlesData = null;
        
        // 缓存过期时间：24小时（毫秒）
        const CACHE_EXPIRY = 24 * 60 * 60 * 1000;
        
        // 尝试从本地存储加载
        const savedData = localStorage.getItem('articlesData');
        const savedTimestamp = localStorage.getItem('articlesDataTimestamp');
        const now = Date.now();
        
        if (savedData && savedTimestamp) {
            try {
                const parsedData = JSON.parse(savedData);
                const timestamp = parseInt(savedTimestamp, 10);
                
                // 检查缓存是否过期
                if (now - timestamp < CACHE_EXPIRY) {
                    articlesData = parsedData;
                    renderArticles(articlesData);
                    return;
                }
            } catch (parseError) {
                console.error('解析本地存储数据出错:', parseError);
                // 清除损坏的本地存储数据
                localStorage.removeItem('articlesData');
                localStorage.removeItem('articlesDataTimestamp');
            }
        }
        
        // 从articles.json加载数据
        try {
            // 添加缓存控制，确保获取最新数据
            const response = await fetch('articles.json', {
                cache: 'no-cache'
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            articlesData = await response.json();
            // 保存到本地存储，并添加时间戳
            localStorage.setItem('articlesData', JSON.stringify(articlesData));
            localStorage.setItem('articlesDataTimestamp', now.toString());
            renderArticles(articlesData);
        } catch (fetchError) {
            console.error('从articles.json加载数据出错:', fetchError);
            // 使用空数据作为最后的 fallback
            renderArticles({
                'basic-theory': [], 
                'celebrity-views': [], 
                'flower-fruit-method': [], 
                'essays': []
            });
        }
    }
    
    // 渲染文章函数
    function renderArticles(data) {
        // 遍历所有文章分类
        Object.keys(data).forEach(category => {
            const grid = document.getElementById(`${category}-grid`);
            if (grid) {
                // 清空现有内容
                grid.innerHTML = '';
                // 生成文章卡片 - 只显示精华文章
                const categoryArticles = data[category] || [];
                const featuredArticles = categoryArticles.filter(article => article.isFeatured);
                
                featuredArticles.forEach(article => {
                    const card = createArticleCard(article, category);
                    grid.appendChild(card);
                });
            }
        });
    }
}

// 页面加载完成后初始化文章
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initArticles);
} else {
    // DOM已经加载完成
    initArticles();
}