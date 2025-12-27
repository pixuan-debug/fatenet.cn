# 上线部署指南

## 当前状态
- API服务器和静态文件服务器已在本地启动
- 所有前端文件已更新为使用IP地址`192.168.2.8:3000`访问API
- 目前只能在局域网内访问，无法通过公网访问

## 上线部署选项

### 选项1：局域网部署（无需公网）
如果只是在内部网络使用，当前配置已经生效，所有连接到同一局域网的设备都可以通过以下方式访问：

- 文章列表：http://192.168.2.8:8080/articles.html
- 文章详情：http://192.168.2.8:8080/article-detail.html?id=1&category=basic-theory
- 管理后台：http://192.168.2.8:8080/admin.html

### 选项2：公网部署（需要公网资源）
如果需要通过公网访问，需要以下资源：
1. 公网服务器（云服务器或VPS）
2. 域名（可选，但推荐）
3. SSL证书（用于HTTPS，可选但推荐）

## 公网部署步骤

### 1. 准备服务器
- 购买云服务器（推荐阿里云、腾讯云、AWS等）
- 安装Node.js和npm
- 开放服务器端口：8080（静态文件）和3000（API）

### 2. 部署代码
- 将项目文件上传到服务器
- 安装依赖：`npm install`
- 启动API服务器：`node api/server.js`
- 启动静态文件服务器：`node start-static-server.js`

### 3. 配置域名（可选）
- 将域名解析到服务器IP
- 配置Nginx或Apache作为反向代理
- 配置SSL证书启用HTTPS

### 4. 配置防火墙和安全组
- 开放必要的端口
- 配置IP白名单（如果需要）
- 启用防火墙规则

## 生产环境优化建议

1. **使用PM2管理进程**
   ```bash
   npm install -g pm2
   pm2 start api/server.js --name article-api
   pm2 start start-static-server.js --name static-server
   pm2 save
   ```

2. **使用Nginx作为反向代理**
   ```nginx
   server {
       listen 80;
       server_name example.com;
       
       location / {
           proxy_pass http://localhost:8080;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host