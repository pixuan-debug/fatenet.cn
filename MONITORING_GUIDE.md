# 生产环境监控指南

## 1. API服务器监控

### 1.1 进程监控

#### 1.1.1 使用PM2监控Node.js应用
```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm start

# 或直接使用PM2启动
pm2 start server.js

# 查看应用状态
pm2 status

# 查看应用日志
pm2 logs

# 查看应用性能
pm2 monit

# 查看应用详情
pm2 show [app-name]
```

#### 1.1.2 配置PM2自动重启
```bash
# 生成PM2配置文件
pm2 ecosystem

# 编辑配置文件
eco system.config.js

# 示例配置
module.exports = {
  apps : [{
    name: 'article-sync-api',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
};

# 使用配置文件启动
pm2 start ecosystem.config.js
```

### 1.2 端口监控

#### 1.2.1 使用netstat监控端口
```bash
# 查看端口使用情况
netstat -tlnp | grep 3000

# 或使用ss命令
ss -tlnp | grep 3000
```

#### 1.2.2 使用lsof监控端口
```bash
# 查看端口占用情况
lsof -i :3000
```

## 2. 数据库监控

### 2.1 SQLite数据库监控

#### 2.1.1 查看数据库文件大小
```bash
# 查看数据库文件大小
du -h /path/to/database.db

# 查看数据库表信息
sqlite3 /path/to/database.db ".tables"

# 查看表结构
sqlite3 /path/to/database.db ".schema articles"

# 查看表数据量
sqlite3 /path/to/database.db "SELECT COUNT(*) FROM articles;"

# 查看表索引
sqlite3 /path/to/database.db ".indexes articles"
```

#### 2.1.2 优化SQLite数据库
```bash
# 执行VACUUM命令优化数据库
sqlite3 /path/to/database.db "VACUUM;"

# 重建索引
sqlite3 /path/to/database.db "REINDEX;"
```

### 2.2 数据库连接监控

#### 2.2.1 监控连接数
```bash
# 使用SQLite命令行工具查看连接数
# SQLite默认只支持单连接，因此不需要监控连接数
```

## 3. 应用性能监控

### 3.1 API响应时间监控

#### 3.1.1 使用curl测试API响应时间
```bash
# 测试API响应时间
curl -w "%{time_total}\n" -o /dev/null -s http://localhost:3000/api/v1/articles

# 多次测试取平均值
for i in {1..10}; do curl -w "%{time_total}\n" -o /dev/null -s http://localhost:3000/api/v1/articles; done | awk '{sum+=$1} END {print "平均响应时间: " sum/NR "秒"}'
```

#### 3.1.2 使用ab测试API性能
```bash
# 安装ab工具
# CentOS/RHEL
yum install httpd-tools

# Ubuntu/Debian
apt-get install apache2-utils

# 测试API性能
ab -n 100 -c 10 http://localhost:3000/api/v1/articles
```

### 3.2 内存使用监控

#### 3.2.1 使用top监控内存使用
```bash
# 监控内存使用
top -p [pid]

# 或使用htop（更友好的界面）
htop -p [pid]
```

#### 3.2.2 使用ps监控内存使用
```bash
# 查看进程内存使用
ps aux --sort=-%mem | grep node
```

## 4. 错误日志监控

### 4.1 应用日志监控

#### 4.1.1 使用PM2查看日志
```bash
# 查看应用日志
pm2 logs

# 查看最近100行日志
pm2 logs --lines 100

# 实时监控日志
pm2 logs --follow
```

#### 4.1.2 配置日志轮换
```bash
# 安装pm2-logrotate插件
pm install -g pm2-logrotate
pm2 install pm2-logrotate

# 配置日志轮换
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:rotateInterval "0 0 * * *"
pm2 set pm2-logrotate:rotateModule true
```

### 4.2 访问日志监控

#### 4.2.1 Nginx访问日志
```bash
# 查看Nginx访问日志
tail -f /var/log/nginx/access.log

# 统计访问量
grep -c "GET /api/v1/articles" /var/log/nginx/access.log

# 统计IP访问量
grep "GET /api/v1/articles" /var/log/nginx/access.log | cut -d " " -f 1 | sort | uniq -c | sort -nr | head -10
```

## 5. 用户体验监控

### 5.1 前端性能监控

#### 5.1.1 使用浏览器开发者工具
1. 打开浏览器开发者工具（F12）
2. 选择"性能"选项卡
3. 点击"录制"按钮
4. 刷新页面
5. 分析性能报告

#### 5.1.2 使用Lighthouse进行性能审计
1. 打开浏览器开发者工具（F12）
2. 选择"Lighthouse"选项卡
3. 选择要审计的内容（性能、可访问性、最佳实践、SEO）
4. 点击"生成报告"按钮
5. 分析审计结果

### 5.2 错误监控

#### 5.2.1 前端错误监控
```javascript
// 在前端代码中添加错误监控
window.addEventListener('error', function(event) {
  console.error('前端错误:', event.error);
  console.error('错误位置:', event.filename, event.lineno, event.colno);
  
  // 可以将错误发送到后台
  fetch('http://localhost:3000/api/v1/errors', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: event.error.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error.stack,
      url: window.location.href,
      userAgent: navigator.userAgent
    })
  });
});

// 监控未捕获的Promise拒绝
window.addEventListener('unhandledrejection', function(event) {
  console.error('未捕获的Promise拒绝:', event.reason);
  
  // 可以将错误发送到后台
  fetch('http://localhost:3000/api/v1/errors', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: event.reason.message || 'Promise拒绝',
      stack: event.reason.stack || '',
      url: window.location.href,
      userAgent: navigator.userAgent,
      type: 'unhandledrejection'
    })
  });
});
```

## 6. 告警机制

### 6.1 进程告警

#### 6.1.1 使用PM2自带告警
```bash
# 安装PM2告警模块
pm install pm2-notify
pm2 install pm2-notify

# 配置告警
pm2 set pm2-notify:email your-email@example.com
```

#### 6.1.2 使用nodemailer发送告警
```javascript
// 示例：使用nodemailer发送告警
const nodemailer = require('nodemailer');

// 创建邮件传输器
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@example.com',
    pass: 'your-password'
  }
});

// 发送告警邮件
function sendAlert(subject, text) {
  const mailOptions = {
    from: 'your-email@example.com',
    to: 'admin@example.com',
    subject: subject,
    text: text
  };
  
  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      console.error('发送告警邮件失败:', error);
    } else {
      console.log('告警邮件已发送:', info.response);
    }
  });
}

// 示例：监控API响应时间
const startTime = Date.now();
// 执行API请求
const endTime = Date.now();
const responseTime = endTime - startTime;

// 如果响应时间超过1秒，发送告警
if (responseTime > 1000) {
  sendAlert('API响应时间告警', `API响应时间超过1秒: ${responseTime}ms`);
}
```

### 6.2 日志告警

#### 6.2.1 使用logwatch监控日志
```bash
# 安装logwatch
yum install logwatch

# 配置logwatch
vim /etc/logwatch/conf/logwatch.conf

# 示例配置
Output = mail
Format = html
MailTo = admin@example.com
MailFrom = logwatch@example.com
Detail = 5
Service = All
```

#### 6.2.2 使用fail2ban防止暴力攻击
```bash
# 安装fail2ban
yum install fail2ban

# 配置fail2ban
vim /etc/fail2ban/jail.conf

# 启动fail2ban
systemctl start fail2ban
systemctl enable fail2ban

# 查看fail2ban状态
fail2ban-client status
```

## 7. 监控工具

### 7.1 开源监控工具

#### 7.1.1 Prometheus + Grafana
1. 安装Prometheus
2. 安装Grafana
3. 配置Prometheus收集Node.js应用指标
4. 在Grafana中创建仪表盘

#### 7.1.2 ELK Stack
1. 安装Elasticsearch
2. 安装Logstash
3. 安装Kibana
4. 配置Logstash收集日志
5. 在Kibana中查看和分析日志

#### 7.1.3 Zabbix
1. 安装Zabbix服务器
2. 安装Zabbix代理
3. 配置Zabbix监控Node.js应用
4. 在Zabbix Web界面中查看监控数据

### 7.2 云监控服务

#### 7.2.1 阿里云云监控
1. 登录阿里云控制台
2. 选择"云监控"
3. 添加监控项
4. 配置告警规则

#### 7.2.2 腾讯云云监控
1. 登录腾讯云控制台
2. 选择"云监控"
3. 添加监控项
4. 配置告警规则

#### 7.2.3 AWS CloudWatch
1. 登录AWS控制台
2. 选择"CloudWatch"
3. 添加监控项
4. 配置告警规则

## 8. 自动化监控脚本

### 8.1 监控API可用性脚本
```bash
#!/bin/bash

# API URL
API_URL="http://localhost:3000/api/v1/health"

# 发送请求并获取状态码
STATUS_CODE=$(curl -o /dev/null -s -w "%{http_code}" $API_URL)

# 如果状态码不是200，发送告警
if [ $STATUS_CODE -ne 200 ]; then
    echo "$(date +"%Y-%m-%d %H:%M:%S") API不可用，状态码: $STATUS_CODE" >> /var/log/api_monitor.log
    # 可以在这里添加发送告警的代码
fi
```

### 8.2 监控数据库大小脚本
```bash
#!/bin/bash

# 数据库文件路径
DB_PATH="/path/to/database.db"

# 最大数据库大小（MB）
MAX_SIZE=100

# 获取数据库文件大小（MB）
DB_SIZE=$(du -m $DB_PATH | cut -f1)

# 如果数据库大小超过最大值，发送告警
if [ $DB_SIZE -gt $MAX_SIZE ]; then
    echo "$(date +"%Y-%m-%d %H:%M:%S") 数据库大小超过阈值，当前大小: ${DB_SIZE}MB，阈值: ${MAX_SIZE}MB" >> /var/log/db_monitor.log
    # 可以在这里添加发送告警的代码
fi
```

### 8.3 定时执行监控脚本
```bash
# 编辑crontab
crontab -e

# 示例：每5分钟执行一次API监控脚本
*/5 * * * * /path/to/api_monitor.sh

# 示例：每天执行一次数据库大小监控脚本
0 0 * * * /path/to/db_monitor.sh
```

## 9. 性能优化建议

### 9.1 前端性能优化
1. 压缩静态资源（JS、CSS、图片）
2. 使用CDN加速静态资源加载
3. 实现懒加载
4. 减少HTTP请求数
5. 优化图片大小和格式
6. 使用浏览器缓存

### 9.2 后端性能优化
1. 优化数据库查询
2. 实现API缓存
3. 使用连接池
4. 优化代码结构
5. 使用异步编程
6. 垂直扩容（增加服务器资源）
7. 水平扩容（增加服务器数量）

### 9.3 数据库性能优化
1. 优化表结构
2. 添加适当的索引
3. 定期清理无用数据
4. 优化SQL查询
5. 分库分表（如果数据量很大）

## 10. 紧急故障处理

### 10.1 常见故障及处理方法

#### 10.1.1 API服务器崩溃
1. 检查服务器日志
2. 重启API服务器
3. 分析崩溃原因
4. 修复问题
5. 部署修复后的代码

#### 10.1.2 数据库连接失败
1. 检查数据库文件是否存在
2. 检查数据库文件权限
3. 检查数据库文件大小
4. 尝试修复数据库
5. 恢复数据库备份

#### 10.1.3 高CPU使用率
1. 检查进程占用情况
2. 分析CPU使用率高的原因
3. 优化代码或配置
4. 考虑扩容服务器

#### 10.1.4 高内存使用率
1. 检查内存使用情况
2. 分析内存泄漏
3. 优化代码或配置
4. 增加服务器内存

### 10.2 故障恢复流程
1. 确认故障
2. 评估影响范围
3. 尝试恢复服务
4. 分析故障原因
5. 修复根本问题
6. 验证修复效果
7. 更新故障处理文档

## 11. 总结

生产环境监控是确保应用稳定运行的重要手段。通过监控API服务器、数据库、应用性能、错误日志和用户体验，可以及时发现并解决问题，提高应用的可用性和性能。

建议根据实际情况选择合适的监控工具和方法，并定期进行性能优化和故障演练，确保应用在各种情况下都能正常运行。

---

**监控是一个持续的过程，需要不断优化和完善。**
