// 测试mock-api.js功能

// 模拟localStorage
const localStorageMock = (function() {
  let store = {};

  return {
    getItem: function(key) {
      return store[key] || null;
    },
    setItem: function(key, value) {
      store[key] = value.toString();
    },
    removeItem: function(key) {
      delete store[key];
    },
    clear: function() {
      store = {};
    }
  };
})();

// 替换全局localStorage
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// 模拟fetch函数
const mockFetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({})
  })
);
Object.defineProperty(window, 'fetch', {
  value: mockFetch,
  writable: true
});

// 加载mock-api.js
const fs = require('fs');
const path = require('path');

// 读取并评估mock-api.js
const mockApiContent = fs.readFileSync(path.join(__dirname, 'mock-api.js'), 'utf8');
eval(mockApiContent);

// 测试mockApi对象是否存在
console.log('测试mockApi对象是否存在:', typeof mockApi !== 'undefined');

// 测试mockApi方法是否存在
const methods = ['login', 'getArticles', 'getArticle', 'syncArticle', 'getAllArticles', 'getSyncEvents', 'healthCheck'];
methods.forEach(method => {
  console.log(`测试${method}方法是否存在:`, typeof mockApi[method] === 'function');
});

// 测试healthCheck方法
mockApi.healthCheck().then(result => {
  console.log('测试healthCheck方法:', result);
});

console.log('测试完成');
