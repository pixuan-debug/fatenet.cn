# 冗余文件清理清单

## 一、清理评估

### 清理范围
1. 测试文件
2. 调试文件
3. 多余的部署指南
4. 日志文件
5. 其他冗余文件

### 保留文件
1. 所有图片文件（.png, .jpg, .svg等）
2. 备份文件
3. 核心功能文件
4. 配置文件

## 二、待清理文件清单

### 1. 测试文件
| 文件路径 | 大小 | 用途 |
|---------|------|------|
| ./test-address-deduplication.js | 未知 | 地址去重测试脚本 |
| ./test-admin-data.js | 未知 | 管理员数据测试脚本 |
| ./test-api.js | 未知 | API测试脚本 |
| ./test-api.ps1 | 未知 | PowerShell API测试脚本 |
| ./test-article-data-save-load.js | 未知 | 文章数据保存加载测试 |
| ./test-article-detail.js | 未知 | 文章详情页测试脚本 |
| ./test-articles-data.js | 未知 | 文章数据测试脚本 |
| ./test-current-implementation.js | 未知 | 当前实现测试脚本 |
| ./test-dashboard.js | 未知 | 仪表盘测试脚本 |
| ./test-data-consistency.js | 未知 | 数据一致性测试脚本 |
| ./test-database-insert.js | 未知 | 数据库插入测试脚本 |
| ./test-database.js | 未知 | 数据库测试脚本 |
| ./test-deduplication-core.js | 未知 | 去重核心测试脚本 |
| ./test-index-data.js | 未知 | 首页数据测试脚本 |
| ./test-local-storage.html | 未知 | 本地存储测试页面 |
| ./test-page.js | 未知 | 页面测试脚本 |
| ./test-simple-db-insert.js | 未知 | 简单数据库插入测试 |
| ./test-simple-deduplication.js | 未知 | 简单去重测试 |
| ./test-simple.ps1 | 未知 | 简单PowerShell测试 |
| ./test-sync-real-time.js | 未知 | 实时同步测试脚本 |
| ./test-sync.js | 未知 | 同步测试脚本 |
| ./TEST_FLOW.md | 未知 | 测试流程文档 |
| ./TEST_REPORT.md | 未知 | 测试报告文档 |

### 2. 调试文件
| 文件路径 | 大小 | 用途 |
|---------|------|------|
| ./articles_debug.json | 未知 | 文章调试数据文件 |
| ./check-db.js | 未知 | 数据库检查脚本 |
| ./check-user-actions.js | 未知 | 用户操作检查脚本 |
| ./fixed-articles.js | 未知 | 修复后的文章脚本 |
| ./sync-log.txt | 未知 | 同步日志文件 |

### 3. 多余的部署指南
| 文件路径 | 大小 | 用途 |
|---------|------|------|
| ./CACHE_CLEARING_GUIDE.md | 未知 | 缓存清理指南 |
| ./CLOUD_DEPLOYMENT_GUIDE.md | 未知 | 云部署指南 |
| ./DEPLOYMENT_GUIDE.md | 未知 | 部署指南 |
| ./DEPLOY_GUIDE.md | 未知 | 重复的部署指南 |
| ./MONITORING_GUIDE.md | 未知 | 监控指南 |

### 4. 其他冗余文件
| 文件路径 | 大小 | 用途 |
|---------|------|------|
| ./CNAME | 未知 | GitHub Pages自定义域名配置 |
| ./data3000.json | 未知 | 测试数据文件 |
| ./data8080.json | 未知 | 测试数据文件 |
| ./deploy.bat | 未知 | 部署批处理脚本 |
| ./deploy.ps1 | 未知 | 部署PowerShell脚本 |
| ./deploy_simple.bat | 未知 | 简单部署批处理脚本 |
| ./start-server-modified.ps1 | 未知 | 修改后的服务器启动脚本 |
| ./start-server.ps1 | 未知 | 服务器启动PowerShell脚本 |
| ./sync-script.js | 未知 | 同步脚本 |
| ./articles-sync.json | 未知 | 文章同步数据文件 |
| ./sync-output/articles-sync-2025-12-26T11-47-28.json | 未知 | 历史同步数据 |
| ./sync-output/articles-sync-latest.json | 未知 | 最新同步数据 |

## 三、清理步骤

1. 备份所有待清理文件到指定位置
2. 执行清理操作
3. 验证系统功能正常
4. 记录清理结果

## 四、清理后验证项目

1. 首页能否正常访问
2. 文章列表能否正常显示
3. 文章详情能否正常访问
4. 点赞功能是否正常
5. 浏览量统计是否正常
6. 后台管理页面是否正常
7. API服务是否正常

## 五、风险评估

### 低风险
- 测试文件清理：不影响核心功能
- 调试文件清理：不影响核心功能
- 多余文档清理：不影响核心功能

### 中风险
- 部署脚本清理：如果需要重新部署，可能需要重新创建
- 数据文件清理：如果有历史数据依赖，可能需要保留

### 高风险
- 配置文件清理：可能导致系统无法正常运行

## 六、清理结果记录

| 清理时间 | 清理文件数 | 释放空间 | 清理状态 | 验证结果 |
|---------|-----------|---------|---------|---------|
| 2025-12-27 | 待执行 | 待执行 | 待执行 | 待执行 |
