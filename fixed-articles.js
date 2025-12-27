// 修复后的文章数据管理逻辑

// 渲染文章函数
function renderArticles(data) {
    // 遍历所有文章分类
    ['basic-theory', 'celebrity-views', 'flower-fruit-method', 'essays'].forEach(category => {
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
    
    // 为所有查看更多按钮添加点击事件处理
    const viewMoreBtns = document.querySelectorAll('.view-more-btn');
    viewMoreBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            // 跳转到文章列表页面
            window.location.href = 'articles.html';
        });
    });
}

// 初始化文章板块 - 修复版
function initArticleSectionsFixed() {
    // 尝试从本地存储加载文章数据
    const savedData = localStorage.getItem('articlesData');
    
    if (savedData) {
        // 使用本地存储的数据
        let articlesData = JSON.parse(savedData);
        
        // 确保所有分类都存在
        ['basic-theory', 'celebrity-views', 'flower-fruit-method', 'essays'].forEach(category => {
            if (!articlesData[category]) {
                articlesData[category] = [];
            }
        });
        
        // 渲染文章
        renderArticles(articlesData);
    } else {
        // 从articles.json加载数据
        fetch('articles.json')
            .then(response => response.json())
            .then(data => {
                // 确保所有分类都存在
                ['basic-theory', 'celebrity-views', 'flower-fruit-method', 'essays'].forEach(category => {
                    if (!data[category]) {
                        data[category] = [];
                    }
                });
                
                // 保存到localStorage
                localStorage.setItem('articlesData', JSON.stringify(data));
                
                // 渲染文章
                renderArticles(data);
            })
            .catch(error => {
                console.error('从articles.json加载数据出错:', error);
                // 使用空数据作为默认值
                const emptyData = {
                    'basic-theory': [], 
                    'celebrity-views': [], 
                    'flower-fruit-method': [], 
                    'essays': []
                };
                
                // 渲染空数据
                renderArticles(emptyData);
            });
    }
}

// 替换原始的initArticleSections函数
if (typeof window !== 'undefined') {
    window.initArticleSections = initArticleSectionsFixed;
}