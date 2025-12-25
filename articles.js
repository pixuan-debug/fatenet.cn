// 文章数据，将从articles.json文件加载
let articles = {
    'basic-theory': [],
    'celebrity-views': [],
    'flower-fruit-method': [],
    'essays': []
};

// 从articles.json加载文章数据
async function loadArticles() {
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
                articles = parsedData;
                renderAllArticles();
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
        const response = await fetch('articles.json', {
            cache: 'no-cache'
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        articles = data;
        // 保存到本地存储，并添加时间戳
        localStorage.setItem('articlesData', JSON.stringify(data));
        localStorage.setItem('articlesDataTimestamp', now.toString());
        renderAllArticles();
    } catch (error) {
        console.error('加载文章数据失败:', error);
        // 如果加载失败，使用默认数据
        console.log('使用默认文章数据');
        renderAllArticles();
    }
}

// 渲染所有文章
function renderAllArticles() {
    // 清空所有文章容器
    document.getElementById('basic-theory-grid').innerHTML = '';
    document.getElementById('celebrity-views-grid').innerHTML = '';
    document.getElementById('flower-fruit-method-grid').innerHTML = '';
    document.getElementById('essays-grid').innerHTML = '';

    // 渲染每个分类的文章
    renderArticles('basic-theory');
    renderArticles('celebrity-views');
    renderArticles('flower-fruit-method');
    renderArticles('essays');
}

// 渲染特定分类的文章
function renderArticles(category) {
    const articlesList = articles[category] || [];
    const container = document.getElementById(`${category}-grid`);
    
    articlesList.forEach(article => {
        const articleCard = document.createElement('div');
        articleCard.className = 'article-card';
        articleCard.innerHTML = `
            <h3 class="article-title">${article.title}</h3>
            <p class="article-excerpt">${article.excerpt}</p>
            <div class="article-meta">
                <span class="article-date">
                    <i class="fa fa-calendar"></i>
                    ${article.date}
                </span>
                <div class="article-actions">
                    <button class="action-btn like-btn" onclick="likeArticle(${article.id}, '${category}')">
                        <i class="fa fa-heart"></i>
                        <span>${article.likes || 0}</span>
                    </button>
                    <button class="action-btn view-btn" onclick="viewArticle(${article.id}, '${category}')">
                        <i class="fa fa-eye"></i>
                        <span>${article.views || 0}</span>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(articleCard);
    });
}

// 点赞文章
function likeArticle(articleId, category) {
    const articlesList = articles[category] || [];
    const article = articlesList.find(a => a.id === articleId);
    if (article) {
        article.likes = (article.likes || 0) + 1;
        renderAllArticles();
    }
}

// 查看文章详情
function viewArticle(articleId, category) {
    const articlesList = articles[category] || [];
    const article = articlesList.find(a => a.id === articleId);
    if (article) {
        article.views = (article.views || 0) + 1;
        
        // 创建文章详情弹窗
        const modal = document.createElement('div');
        modal.className = 'contact-modal active';
        modal.innerHTML = `
            <div class="contact-modal-content">
                <div class="modal-header">
                    <h3>${article.title}</h3>
                    <button class="modal-close-btn" onclick="this.closest('.contact-modal').remove()">&times;</button>
                </div>
                <div class="modal-body article-detail">
                    <div class="article-meta">
                        <span class="article-date">
                            <i class="fa fa-calendar"></i>
                            ${article.date}
                        </span>
                        <div class="article-actions">
                            <button class="action-btn like-btn" onclick="likeArticle(${article.id}, '${category}')">
                                <i class="fa fa-heart"></i>
                                <span>${article.likes || 0}</span>
                            </button>
                            <span class="action-btn">
                                <i class="fa fa-eye"></i>
                                <span>${article.views}</span>
                            </span>
                        </div>
                    </div>
                    <div class="article-content">
                        ${article.content.replace(/\n/g, '<br>')}
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        renderAllArticles();
    }
}

// 页面加载完成后加载文章
document.addEventListener('DOMContentLoaded', function() {
    loadArticles();
});
