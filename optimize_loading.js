// 网站加载优化脚本
// 这个脚本可以帮助优化网站的加载速度

// 1. 预加载关键资源
(function() {
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

// 2. 延迟加载非关键资源
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

// 3. 优化字体显示
(function() {
    // 添加字体显示策略
    const style = document.createElement('style');
    style.textContent = `
        /* 优化字体显示 */
        @font-face {
            font-display: swap;
        }
    `;
    document.head.appendChild(style);
})();
