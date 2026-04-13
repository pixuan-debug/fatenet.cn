// 网站加载优化脚本
(function() {
    // 延迟加载非关键资源
    function lazyLoadResources() {
        // 这里可以添加延迟加载图片、脚本等资源的逻辑
        console.log('网站加载优化脚本执行');
    }
    
    // 页面加载完成后执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', lazyLoadResources);
    } else {
        lazyLoadResources();
    }
})();