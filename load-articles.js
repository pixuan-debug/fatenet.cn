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
        
        // 尝试从本地存储加载
        const savedData = localStorage.getItem('articlesData');
        if (savedData) {
            try {
                articlesData = JSON.parse(savedData);
                renderArticles(articlesData);
                return;
            } catch (parseError) {
                console.error('解析本地存储数据出错:', parseError);
                // 清除损坏的本地存储数据
                localStorage.removeItem('articlesData');
            }
        }
        
        // 从articles.json加载数据
        try {
            const response = await fetch('articles.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            articlesData = await response.json();
            // 保存到本地存储
            localStorage.setItem('articlesData', JSON.stringify(articlesData));
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