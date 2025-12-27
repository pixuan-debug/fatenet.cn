// 文章数据同步脚本
// 功能：每半小时从线上获取文章数据，生成JSON文件并导入系统

const fs = require('fs');
const path = require('path');

// 配置参数
const config = {
    // 线上API地址
    apiUrl: 'http://localhost:3000/api/v1/articles?useCache=false',
    // 同步周期（毫秒）
    syncInterval: 30 * 60 * 1000, // 30分钟
    // 输出JSON文件目录
    outputDir: path.join(__dirname, 'sync-output'),
    // 日志文件路径
    logPath: path.join(__dirname, 'sync-log.txt'),
    // 最大重试次数
    maxRetries: 3,
    // 重试间隔（毫秒）
    retryInterval: 5000
};

// 日志记录函数
function log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    
    // 输出到控制台
    console.log(logMessage);
    
    // 写入日志文件
    fs.appendFileSync(config.logPath, logMessage + '\n', 'utf8');
}

// 获取文章数据
async function fetchArticlesData(retryCount = 0) {
    try {
        log(`正在从API获取文章数据... (尝试 ${retryCount + 1}/${config.maxRetries})`);
        
        const response = await fetch(config.apiUrl);
        
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.code !== 200) {
            throw new Error(`API返回错误: ${result.message || '未知错误'}`);
        }
        
        if (!result.data) {
            throw new Error('API返回数据为空');
        }
        
        log('成功获取文章数据');
        return result.data;
        
    } catch (error) {
        log(`获取文章数据失败: ${error.message}`, 'ERROR');
        
        // 重试逻辑
        if (retryCount < config.maxRetries - 1) {
            log(`将在 ${config.retryInterval / 1000} 秒后重试...`);
            await new Promise(resolve => setTimeout(resolve, config.retryInterval));
            return fetchArticlesData(retryCount + 1);
        } else {
            log('达到最大重试次数，同步失败', 'ERROR');
            throw error;
        }
    }
}

// 生成JSON文件
function generateJsonFile(data) {
    try {
        log('正在生成JSON文件...');
        
        // 获取当前时间，用于文件名和文件标记
        const now = new Date();
        const timeStamp = now.toISOString().replace(/:/g, '-').slice(0, 19); // 格式：YYYY-MM-DDTHH-MM-SS
        const humanReadableTime = now.toLocaleString('zh-CN', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }); // 格式：YYYY-MM-DD HH:MM:SS
        
        // 确保输出目录存在
        if (!fs.existsSync(config.outputDir)) {
            fs.mkdirSync(config.outputDir, { recursive: true });
        }
        
        // 生成带有时间戳的文件名
        const fileName = `articles-sync-${timeStamp}.json`;
        const outputPath = path.join(config.outputDir, fileName);
        
        // 为数据添加来源和时间标记
        const dataWithMetadata = {
            ...data,
            metadata: {
                source: 'online-api',
                fetchTime: now.toISOString(),
                fetchTimeHuman: humanReadableTime,
                fileGenerated: now.toISOString(),
                version: '1.0',
                generatedBy: 'sync-script.js'
            }
        };
        
        // 写入JSON文件
        fs.writeFileSync(outputPath, JSON.stringify(dataWithMetadata, null, 2), 'utf8');
        
        // 同时生成一个不带时间戳的最新版本文件，方便使用
        const latestPath = path.join(config.outputDir, 'articles-sync-latest.json');
        fs.writeFileSync(latestPath, JSON.stringify(dataWithMetadata, null, 2), 'utf8');
        
        // 统计数据
        const articlesData = data.articles || data;
        const categories = Object.keys(articlesData);
        const totalArticles = categories.reduce((sum, category) => {
            const categoryArticles = articlesData[category] || [];
            return sum + categoryArticles.length;
        }, 0);
        
        log(`成功生成JSON文件: ${outputPath}`);
        log(`成功生成最新版本文件: ${latestPath}`);
        log(`数据统计: 分类数=${categories.length}, 文章总数=${totalArticles}`);
        log(`文件来源: online-api, 获取时间: ${humanReadableTime}`);
        
        return {
            categories,
            totalArticles,
            filePath: outputPath,
            latestFilePath: latestPath,
            fetchTime: humanReadableTime,
            source: 'online-api'
        };
        
    } catch (error) {
        log(`生成JSON文件失败: ${error.message}`, 'ERROR');
        throw error;
    }
}

// 导入数据到系统
async function importDataToSystem(jsonFilePath) {
    try {
        log('正在导入数据到系统...');
        
        // 这里可以调用系统的导入API或直接操作数据库
        // 目前系统已支持从JSON文件导入，管理员可以在后台手动导入
        // 后续可以扩展为自动导入
        
        log('数据导入完成（当前为手动导入模式，管理员可在后台操作）');
        log('导入文件路径: ' + jsonFilePath);
        
        return true;
        
    } catch (error) {
        log(`数据导入失败: ${error.message}`, 'ERROR');
        throw error;
    }
}

// 执行一次同步
async function performSync() {
    log('=== 开始执行数据同步 ===');
    
    try {
        // 1. 获取文章数据
        const articlesData = await fetchArticlesData();
        
        // 2. 生成JSON文件
        const generateResult = generateJsonFile(articlesData);
        
        // 3. 导入数据到系统
        await importDataToSystem(generateResult.filePath);
        
        log('=== 数据同步完成 ===');
        return true;
        
    } catch (error) {
        log('=== 数据同步失败 ===', 'ERROR');
        return false;
    }
}

// 启动定时同步
function startScheduledSync() {
    log('启动定时数据同步服务...');
    log(`同步周期: ${config.syncInterval / 1000 / 60} 分钟`);
    log(`API地址: ${config.apiUrl}`);
    log(`输出文件: ${config.outputPath}`);
    
    // 立即执行一次同步
    performSync();
    
    // 设置定时任务
    setInterval(() => {
        performSync();
    }, config.syncInterval);
}

// 命令行参数处理
const args = process.argv.slice(2);

if (args.includes('--once')) {
    // 仅执行一次同步
    log('执行单次数据同步...');
    performSync();
} else {
    // 启动定时同步
    startScheduledSync();
}
