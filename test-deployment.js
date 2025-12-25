// 部署测试脚本：验证数据同步功能的完整性和准确性

// 测试结果记录
const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
};

// 测试用例1：验证mockApi对象存在
function testMockApiExists() {
    const testName = '验证mockApi对象存在';
    testResults.total++;
    
    try {
        if (typeof mockApi !== 'undefined') {
            testResults.passed++;
            testResults.tests.push({ name: testName, status: 'passed' });
            console.log(`✅ ${testName}`);
            return true;
        } else {
            testResults.failed++;
            testResults.tests.push({ name: testName, status: 'failed', error: 'mockApi对象不存在' });
            console.log(`❌ ${testName}: mockApi对象不存在`);
            return false;
        }
    } catch (error) {
        testResults.failed++;
        testResults.tests.push({ name: testName, status: 'failed', error: error.message });
        console.log(`❌ ${testName}: ${error.message}`);
        return false;
    }
}

// 测试用例2：测试健康检查
async function testHealthCheck() {
    const testName = '测试健康检查';
    testResults.total++;
    
    try {
        const result = await mockApi.healthCheck();
        if (result.code === 200) {
            testResults.passed++;
            testResults.tests.push({ name: testName, status: 'passed', result: result });
            console.log(`✅ ${testName}: ${result.message}`);
            return true;
        } else {
            testResults.failed++;
            testResults.tests.push({ name: testName, status: 'failed', error: `返回错误代码: ${result.code}` });
            console.log(`❌ ${testName}: 返回错误代码: ${result.code}`);
            return false;
        }
    } catch (error) {
        testResults.failed++;
        testResults.tests.push({ name: testName, status: 'failed', error: error.message });
        console.log(`❌ ${testName}: ${error.message}`);
        return false;
    }
}

// 测试用例3：测试点赞同步功能
async function testLikeSync() {
    const testName = '测试点赞同步功能';
    testResults.total++;
    
    try {
        // 准备测试数据
        const testData = {
            type: 'like',
            articleId: 1,
            category: 'basic-theory',
            likes: 10,
            views: 100,
            timestamp: Date.now(),
            eventId: `test_like_${Date.now()}`
        };
        
        const result = await mockApi.syncArticle(testData);
        if (result.code === 200 || result.code === 201) {
            testResults.passed++;
            testResults.tests.push({ name: testName, status: 'passed', result: result });
            console.log(`✅ ${testName}: 点赞同步成功`);
            return true;
        } else {
            testResults.failed++;
            testResults.tests.push({ name: testName, status: 'failed', error: `返回错误代码: ${result.code}` });
            console.log(`❌ ${testName}: 返回错误代码: ${result.code}`);
            return false;
        }
    } catch (error) {
        testResults.failed++;
        testResults.tests.push({ name: testName, status: 'failed', error: error.message });
        console.log(`❌ ${testName}: ${error.message}`);
        return false;
    }
}

// 测试用例4：测试浏览量同步功能
async function testViewSync() {
    const testName = '测试浏览量同步功能';
    testResults.total++;
    
    try {
        // 准备测试数据
        const testData = {
            type: 'view',
            articleId: 2,
            category: 'basic-theory',
            likes: 5,
            views: 200,
            timestamp: Date.now(),
            eventId: `test_view_${Date.now()}`
        };
        
        const result = await mockApi.syncArticle(testData);
        if (result.code === 200 || result.code === 201) {
            testResults.passed++;
            testResults.tests.push({ name: testName, status: 'passed', result: result });
            console.log(`✅ ${testName}: 浏览量同步成功`);
            return true;
        } else {
            testResults.failed++;
            testResults.tests.push({ name: testName, status: 'failed', error: `返回错误代码: ${result.code}` });
            console.log(`❌ ${testName}: 返回错误代码: ${result.code}`);
            return false;
        }
    } catch (error) {
        testResults.failed++;
        testResults.tests.push({ name: testName, status: 'failed', error: error.message });
        console.log(`❌ ${testName}: ${error.message}`);
        return false;
    }
}

// 测试用例5：测试获取文章列表功能
async function testGetArticles() {
    const testName = '测试获取文章列表功能';
    testResults.total++;
    
    try {
        const result = await mockApi.getArticles();
        if (result.code === 200 && Array.isArray(result.data.articles)) {
            testResults.passed++;
            testResults.tests.push({ name: testName, status: 'passed', result: result });
            console.log(`✅ ${testName}: 获取文章列表成功，共 ${result.data.articles.length} 篇文章`);
            return true;
        } else {
            testResults.failed++;
            testResults.tests.push({ name: testName, status: 'failed', error: '返回数据格式不正确' });
            console.log(`❌ ${testName}: 返回数据格式不正确`);
            return false;
        }
    } catch (error) {
        testResults.failed++;
        testResults.tests.push({ name: testName, status: 'failed', error: error.message });
        console.log(`❌ ${testName}: ${error.message}`);
        return false;
    }
}

// 测试用例6：测试数据一致性验证
async function testDataConsistency() {
    const testName = '测试数据一致性验证';
    testResults.total++;
    
    try {
        // 先同步一条数据
        const testData = {
            type: 'like',
            articleId: 3,
            category: 'celebrity-views',
            likes: 15,
            views: 300,
            timestamp: Date.now(),
            eventId: `test_consistency_${Date.now()}`
        };
        
        await mockApi.syncArticle(testData);
        
        // 然后获取文章列表，检查数据一致性
        const result = await mockApi.getArticles();
        const article = result.data.articles.find(a => a.id === testData.articleId && a.category === testData.category);
        
        if (article && article.likes === testData.likes && article.views === testData.views) {
            testResults.passed++;
            testResults.tests.push({ name: testName, status: 'passed', result: result });
            console.log(`✅ ${testName}: 数据一致性验证成功`);
            return true;
        } else {
            testResults.failed++;
            testResults.tests.push({ name: testName, status: 'failed', error: '数据不一致' });
            console.log(`❌ ${testName}: 数据不一致`);
            return false;
        }
    } catch (error) {
        testResults.failed++;
        testResults.tests.push({ name: testName, status: 'failed', error: error.message });
        console.log(`❌ ${testName}: ${error.message}`);
        return false;
    }
}

// 测试用例7：测试错误处理机制
async function testErrorHandling() {
    const testName = '测试错误处理机制';
    testResults.total++;
    
    try {
        // 准备缺少必填参数的数据
        const testData = {
            type: 'like',
            // 缺少articleId和category
            likes: 10,
            views: 100,
            timestamp: Date.now(),
            eventId: `test_error_${Date.now()}`
        };
        
        const result = await mockApi.syncArticle(testData);
        if (result.code === 400) {
            testResults.passed++;
            testResults.tests.push({ name: testName, status: 'passed', result: result });
            console.log(`✅ ${testName}: 错误处理机制正常工作`);
            return true;
        } else {
            testResults.failed++;
            testResults.tests.push({ name: testName, status: 'failed', error: `预期返回400错误，但返回了${result.code}` });
            console.log(`❌ ${testName}: 预期返回400错误，但返回了${result.code}`);
            return false;
        }
    } catch (error) {
        testResults.failed++;
        testResults.tests.push({ name: testName, status: 'failed', error: error.message });
        console.log(`❌ ${testName}: ${error.message}`);
        return false;
    }
}

// 运行所有测试
async function runAllTests() {
    console.log('=== 开始部署测试 ===\n');
    
    // 测试1：验证mockApi对象存在
    testMockApiExists();
    
    // 测试2：测试健康检查
    await testHealthCheck();
    
    // 测试3：测试点赞同步功能
    await testLikeSync();
    
    // 测试4：测试浏览量同步功能
    await testViewSync();
    
    // 测试5：测试获取文章列表功能
    await testGetArticles();
    
    // 测试6：测试数据一致性验证
    await testDataConsistency();
    
    // 测试7：测试错误处理机制
    await testErrorHandling();
    
    // 输出测试结果
    console.log('\n=== 测试结果汇总 ===');
    console.log(`总测试数: ${testResults.total}`);
    console.log(`通过数: ${testResults.passed}`);
    console.log(`失败数: ${testResults.failed}`);
    console.log(`通过率: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);
    
    // 输出详细测试结果
    console.log('\n=== 详细测试结果 ===');
    testResults.tests.forEach(test => {
        if (test.status === 'passed') {
            console.log(`✅ ${test.name}`);
        } else {
            console.log(`❌ ${test.name}: ${test.error}`);
        }
    });
    
    // 返回测试结果
    return testResults;
}

// 生成测试报告
function generateTestReport(results) {
    const report = {
        testTime: new Date().toISOString(),
        totalTests: results.total,
        passedTests: results.passed,
        failedTests: results.failed,
        passRate: ((results.passed / results.total) * 100).toFixed(2) + '%',
        detailedResults: results.tests,
        conclusion: results.failed === 0 ? '所有测试通过，可以部署' : '存在测试失败，需要修复后再部署'
    };
    
    return report;
}

// 页面加载时运行测试
if (typeof window !== 'undefined') {
    window.addEventListener('load', async () => {
        const results = await runAllTests();
        const report = generateTestReport(results);
        
        // 将测试报告保存到localStorage
        localStorage.setItem('syncTestReport', JSON.stringify(report, null, 2));
        
        console.log('\n=== 部署建议 ===');
        console.log(report.conclusion);
    });
} else {
    // 用于Node.js环境
    module.exports = {
        runAllTests,
        generateTestReport
    };
}
