// 数据一致性测试脚本
// 用于验证当前数据统计逻辑是否符合地址去重要求

console.log('=== 数据一致性测试 ===');
console.log('测试时间:', new Date().toISOString());
console.log('');

// 模拟当前的数据收集和统计逻辑
class MockDataCollector {
    constructor() {
        this.pendingSyncData = [];
    }
    
    // 模拟当前的记录点赞方法（无地址跟踪）
    recordLike(articleId, category) {
        const event = {
            eventId: Date.now(),
            type: 'like',
            articleId: articleId,
            category: category,
            timestamp: Date.now()
        };
        this.pendingSyncData.push(event);
    }
    
    // 模拟当前的记录浏览方法（无地址跟踪）
    recordView(articleId, category) {
        const event = {
            eventId: Date.now(),
            type: 'view',
            articleId: articleId,
            category: category,
            timestamp: Date.now()
        };
        this.pendingSyncData.push(event);
    }
    
    // 模拟当前的聚合数据方法
    aggregateData() {
        const articleDataMap = new Map();
        
        this.pendingSyncData.forEach(event => {
            const key = `${event.articleId}-${event.category}`;
            
            if (!articleDataMap.has(key)) {
                articleDataMap.set(key, {
                    articleId: event.articleId,
                    category: event.category,
                    likes: 0,
                    views: 0
                });
            }
            
            const data = articleDataMap.get(key);
            if (event.type === 'like') {
                data.likes++;
            } else if (event.type === 'view') {
                data.views++;
            }
        });
        
        return Array.from(articleDataMap.values());
    }
}

// 测试场景1：同一用户多次访问和点赞
console.log('1. 测试场景：同一用户多次访问和点赞');
console.log('   预期：每个唯一地址应仅计为一个数据单位');
console.log('   当前实现：每次操作都计为一个数据单位');
console.log('');

const collector = new MockDataCollector();

// 模拟同一用户（相同IP/设备）的多次操作
for (let i = 0; i < 5; i++) {
    collector.recordView(1, 'basic-theory'); // 同一用户浏览同一篇文章5次
    collector.recordLike(1, 'basic-theory'); // 同一用户点赞同一篇文章5次
}

const aggregatedData = collector.aggregateData();
console.log('   测试结果：');
aggregatedData.forEach(data => {
    console.log(`   文章ID: ${data.articleId}, 分类: ${data.category}`);
    console.log(`   - 浏览数: ${data.views} (预期: 1, 实际: ${data.views})`);
    console.log(`   - 点赞数: ${data.likes} (预期: 1, 实际: ${data.likes})`);
    console.log(`   - 问题: ${data.views > 1 ? '浏览未去重' : ''} ${data.likes > 1 ? '点赞未去重' : ''}`);
});

console.log('');
console.log('2. 当前实现分析：');
console.log('   - 客户端：每次操作都会生成新事件，没有记录用户唯一标识');
console.log('   - 服务器端：直接使用客户端发送的数值覆盖数据库，没有验证唯一性');
console.log('   - 数据统计：基于事件次数，而非唯一用户数');

console.log('');
console.log('3. 数据不一致的根本原因：');
console.log('   - 缺少唯一地址跟踪机制');
console.log('   - 没有实现地址去重逻辑');
console.log('   - 数据更新机制为覆盖式，而非增量验证式');

console.log('');
console.log('4. 改进建议：');
console.log('   - 客户端：添加唯一标识符（如设备ID或浏览器指纹）');
console.log('   - 服务器端：记录每个用户的操作，实现地址去重');
console.log('   - 数据统计：基于唯一用户数，而非事件次数');
console.log('   - 数据库设计：添加用户操作记录表，记录每个用户对每篇文章的操作');

console.log('');
console.log('=== 测试完成 ===');
