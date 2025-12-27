const puppeteer = require('puppeteer');
const path = require('path');

async function testArticleDisappearance() {
    console.log('=== 测试文章点赞后消失问题 ===');
    console.log('测试时间:', new Date().toISOString());
    
    let browser;
    
    try {
        // 启动浏览器
        browser = await puppeteer.launch({
            headless: false, // 非无头模式，方便查看测试过程
            slowMo: 500, // 放慢操作速度，方便观察
            args: ['--start-maximized'] // 最大化窗口
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        
        console.log('1. 访问首页...');
        await page.goto('http://localhost:8081/index.html', { waitUntil: 'networkidle2' });
        
        // 等待页面加载完成
        await page.waitForSelector('.article-card', { timeout: 10000 });
        
        // 统计初始文章数量
        let initialArticles = await page.$$('.article-card');
        console.log(`   初始文章数量: ${initialArticles.length}`);
        
        if (initialArticles.length === 0) {
            throw new Error('首页没有加载到任何文章');
        }
        
        console.log('\n2. 点击第一篇文章...');
        // 点击第一篇文章
        await initialArticles[0].click();
        
        // 等待文章详情页加载完成
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        await page.waitForSelector('.article-detail', { timeout: 10000 });
        
        console.log('\n3. 点赞文章...');
        // 点击点赞按钮
        await page.click('.like-btn');
        
        // 等待点赞完成
        await page.waitForTimeout(2000);
        
        console.log('\n4. 返回首页...');
        // 返回首页
        await page.goBack();
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        await page.waitForSelector('.article-card', { timeout: 10000 });
        
        // 统计返回首页后的文章数量
        let afterLikeArticles = await page.$$('.article-card');
        console.log(`   返回首页后文章数量: ${afterLikeArticles.length}`);
        
        if (afterLikeArticles.length === 0) {
            console.error('❌ 测试失败：点赞后返回首页，所有文章消失');
        } else if (afterLikeArticles.length < initialArticles.length) {
            console.error(`❌ 测试失败：点赞后返回首页，文章数量减少（从${initialArticles.length}减少到${afterLikeArticles.length}）`);
        } else {
            console.log('✅ 测试通过：点赞后返回首页，所有文章正常显示');
        }
        
        console.log('\n5. 清除浏览器缓存（localStorage）...');
        // 清除localStorage，模拟清除浏览器缓存
        await page.evaluate(() => {
            localStorage.clear();
            console.log('localStorage已清除');
        });
        
        console.log('\n6. 刷新页面...');
        // 刷新页面
        await page.reload({ waitUntil: 'networkidle2' });
        await page.waitForSelector('.article-card', { timeout: 10000 });
        
        // 统计刷新后的文章数量
        let afterRefreshArticles = await page.$$('.article-card');
        console.log(`   刷新后文章数量: ${afterRefreshArticles.length}`);
        
        if (afterRefreshArticles.length === 0) {
            console.error('❌ 测试失败：清除缓存后刷新页面，所有文章消失');
        } else {
            console.log('✅ 测试通过：清除缓存后刷新页面，文章正常显示');
        }
        
        console.log('\n7. 验证数据是否从articles.json重新加载...');
        // 检查是否有从articles.json加载数据的日志
        const logs = await page.evaluate(() => {
            return window.performance.getEntries()
                .filter(entry => entry.name.includes('articles.json'))
                .map(entry => entry.name);
        });
        
        if (logs.length > 0) {
            console.log('✅ 测试通过：清除缓存后，页面从articles.json重新加载了数据');
        } else {
            console.log('⚠️  注意：未检测到从articles.json加载数据的请求');
        }
        
        console.log('\n=== 测试完成 ===');
        
    } catch (error) {
        console.error('测试过程中发生错误:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// 检查是否安装了puppeteer
async function checkPuppeteer() {
    try {
        require('puppeteer');
        return true;
    } catch (error) {
        return false;
    }
}

// 主函数
async function main() {
    const isPuppeteerInstalled = await checkPuppeteer();
    
    if (!isPuppeteerInstalled) {
        console.log('未安装puppeteer，正在安装...');
        const { execSync } = require('child_process');
        execSync('npm install puppeteer', { stdio: 'inherit' });
    }
    
    await testArticleDisappearance();
}

main();