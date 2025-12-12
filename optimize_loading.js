// 网站加载优化脚本
// 这个脚本可以帮助优化网站的加载速度

// 1. 预加载和预连接关键资源
(function() {
    // 预连接关键域名
    const preconnectDomains = [
        'https://fonts.googleapis.com',
        'https://cdn.jsdelivr.net'
    ];
    
    preconnectDomains.forEach(domain => {
        const preconnect = document.createElement('link');
        preconnect.rel = 'preconnect';
        preconnect.href = domain;
        preconnect.crossorigin = 'anonymous';
        document.head.appendChild(preconnect);
    });
    
    // 预加载字体资源
    const fontPreload = document.createElement('link');
    fontPreload.rel = 'preload';
    fontPreload.href = 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&display=swap';
    fontPreload.as = 'style';
    document.head.appendChild(fontPreload);

    // 预加载Font Awesome图标
    const fontAwesomePreload = document.createElement('link');
    fontAwesomePreload.rel = 'preload';
    fontAwesomePreload.href = 'https://cdn.jsdelivr.net/npm/font-awesome@4.7.0/css/font-awesome.min.css';
    fontAwesomePreload.as = 'style';
    document.head.appendChild(fontAwesomePreload);
})();

// 2. 延迟加载图片
(function() {
    // 为所有图片添加延迟加载属性
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        if (!img.hasAttribute('loading')) {
            img.setAttribute('loading', 'lazy');
        }
    });
})();

// 3. 延迟加载非关键资源
(function() {
    // 延迟加载非关键JavaScript
    function loadScript(src) {
        const script = document.createElement('script');
        script.src = src;
        script.defer = true;
        document.body.appendChild(script);
    }

    // 页面加载完成后加载非关键资源
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            // 这里可以添加需要延迟加载的脚本
        });
    } else {
        // 这里可以添加需要延迟加载的脚本
    }
})();

// 4. 优化字体显示
(function() {
    // 添加字体显示策略
    const style = document.createElement('style');
    style.textContent = `
        /* 优化字体显示 */
        @font-face {
            font-display: swap;
        }
        
        /* 优化页面渲染 */
        html {
            scroll-behavior: smooth;
        }
        
        /* 减少重排重绘 */
        img {
            max-width: 100%;
            height: auto;
        }
    `;
    document.head.appendChild(style);
})();

// 5. 优化CSS渲染
(function() {
    // 确保CSS优先加载
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    links.forEach(link => {
        if (link.getAttribute('media') === 'print' && link.getAttribute('onload')) {
            // 确保异步CSS在加载后应用
            link.addEventListener('load', function() {
                this.removeAttribute('media');
            });
        }
    });
})();