# 服务器缓存清理指南

## 1. 静态资源缓存清理

### 1.1 Nginx服务器

#### 1.1.1 重新加载Nginx配置
```bash
# 检查配置文件语法
nginx -t

# 重新加载配置
nginx -s reload
```

#### 1.1.2 清理Nginx缓存目录
如果Nginx配置了缓存，需要清理缓存目录：
```bash
# 查看Nginx配置中的缓存目录
grep -r "proxy_cache_path" /etc/nginx/

# 清理缓存目录
rm -rf /path/to/cache/directory/*

# 重新加载Nginx
nginx -s reload
```

### 1.2 Apache服务器

#### 1.2.1 重启Apache
```bash
# 重启Apache（CentOS/RHEL）
systemctl restart httpd

# 重启Apache（Ubuntu/Debian）
systemctl restart apache2
```

#### 1.2.2 清理Apache缓存模块
如果使用了mod_cache模块，需要清理缓存：
```bash
# 查看缓存目录配置
grep -r "CacheRoot" /etc/httpd/

# 清理缓存目录
rm -rf /path/to/cache/directory/*

# 重启Apache
systemctl restart httpd
```

### 1.3 IIS服务器

#### 1.3.1 清理IIS输出缓存
1. 打开IIS管理器
2. 选择要清理缓存的网站
3. 双击"输出缓存"图标
4. 在右侧操作面板中点击"清除缓存"

#### 1.3.2 重启IIS服务
```powershell
# 重启IIS服务
iisreset /restart
```

## 2. CDN缓存清理

### 2.1 阿里云CDN
1. 登录阿里云CDN控制台
2. 选择"域名管理"
3. 找到要清理的域名，点击"管理"
4. 在左侧导航中选择"缓存管理"
5. 点击"刷新缓存"
6. 输入要刷新的URL或目录，点击"提交"

### 2.2 腾讯云CDN
1. 登录腾讯云CDN控制台
2. 选择"域名管理"
3. 找到要清理的域名，点击"管理"
4. 在左侧导航中选择"缓存刷新"
5. 输入要刷新的URL或目录，点击"提交刷新"

### 2.3 Cloudflare CDN
1. 登录Cloudflare控制台
2. 选择要清理缓存的网站
3. 在左侧导航中选择"缓存"
4. 点击"清除缓存"
5. 选择要清除的内容范围，点击"清除缓存"

## 3. 浏览器缓存处理

### 3.1 修改文件名或添加版本号
为了确保用户浏览器能获取最新的静态资源，建议在文件名中添加版本号或哈希值：

```html
<!-- 旧方式 -->
<script src="articles.js"></script>

<!-- 新方式：添加版本号 -->
<script src="articles.js?v=1.0.0"></script>

<!-- 新方式：添加哈希值 -->
<script src="articles.1a2b3c.js"></script>
```

### 3.2 设置HTTP缓存头
在服务器配置中设置适当的HTTP缓存头，控制浏览器缓存行为：

#### Nginx配置示例
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico)$ {
    expires 1d;
    add_header Cache-Control "public, must-revalidate, proxy-revalidate";
    add_header ETag "";
    etag off;
}
```

#### Apache配置示例
```apache
<FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico)$">
    Header set Cache-Control "max-age=86400, public, must-revalidate, proxy-revalidate"
    Header set ETag ""
</FilesMatch>
```

## 4. 数据库缓存清理

### 4.1 SQLite数据库
SQLite没有内置的缓存机制，但可以执行VACUUM命令优化数据库：
```bash
# 执行VACUUM命令
sqlite3 /path/to/database.db "VACUUM;"
```

### 4.2 MySQL数据库
```bash
# 清理查询缓存
FLUSH QUERY CACHE;

# 重新加载权限表
FLUSH PRIVILEGES;

# 清理所有缓存
FLUSH ALL;
```

### 4.3 PostgreSQL数据库
```bash
# 清理共享缓冲区
VACUUM;

# 清理表碎片
VACUUM ANALYZE;

# 清理整个数据库
VACUUM FULL;
```

## 5. 应用程序缓存清理

### 5.1 Node.js应用
```bash
# 重启Node.js应用
pm run restart

# 或使用PM2重启
pm2 restart all
```

### 5.2 Redis缓存（如果使用）
```bash
# 连接Redis
redis-cli

# 清理所有键
FLUSHALL

# 或清理当前数据库
FLUSHDB
```

## 6. 缓存清理验证

### 6.1 使用curl验证
```bash
# 检查HTTP响应头
curl -I http://yourdomain.com/articles.js

# 强制刷新获取最新内容
curl -H "Cache-Control: no-cache" http://yourdomain.com/articles.js
```

### 6.2 使用浏览器开发者工具验证
1. 打开浏览器开发者工具（F12）
2. 选择"网络"选项卡
3. 勾选"禁用缓存"选项
4. 刷新页面
5. 检查资源的状态码，确认是否从服务器获取最新内容（状态码200）

## 7. 自动化缓存清理

为了简化缓存清理流程，建议设置自动化脚本：

### 7.1 部署脚本示例
```bash
#!/bin/bash

# 部署新代码
echo "正在部署新代码..."
cp -r /path/to/new/code /path/to/server/project

# 清理Nginx缓存
echo "正在清理Nginx缓存..."
nginx -s reload

# 清理CDN缓存
echo "正在清理CDN缓存..."
# 调用CDN API清理缓存

# 重启应用
echo "正在重启应用..."
pm2 restart all

echo "部署完成！"
```

### 7.2 CI/CD集成
将缓存清理步骤集成到CI/CD流程中，实现自动化部署和缓存清理。

## 8. 注意事项

1. **清理缓存的时机**：建议在每次部署新代码后清理缓存
2. **清理范围**：根据实际情况选择清理范围，避免影响正常业务
3. **备份数据**：在清理数据库缓存前，建议先备份数据
4. **监控系统**：清理缓存后，监控系统性能和用户体验，确保没有异常
5. **测试验证**：在生产环境清理缓存前，建议先在测试环境验证

---

**清理缓存后，请按照部署验证步骤进行测试，确保功能正常工作。**
