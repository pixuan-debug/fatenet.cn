# 云端部署指南

## 准备工作

### 1. 安装依赖

在项目根目录执行：
```bash
npm install
```

在API目录执行：
```bash
cd api
npm install
```

## 本地测试

### 1. 启动API服务器
```bash
cd api
node server.js
```

### 2. 启动静态文件服务器
```bash
node start-static-server.js
```

### 3. 访问本地站点
- 首页：http://localhost:8080
- 文章列表：http://localhost:8080/articles.html
- 后台管理：http://localhost:8080/admin.html

## 云端部署

### 选项1：使用Vercel部署（推荐）

1. **安装Vercel CLI**
```bash
npm i -g vercel
```

2. **登录Vercel**
```bash
vercel login
```

3. **部署项目**
```bash
vercel --prod
```

### 选项2：使用Docker部署

1. **创建Dockerfile**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制项目文件
COPY . .

# 安装依赖
RUN npm install
RUN cd api && npm install

# 暴露端口
EXPOSE 3000 8080

# 启动命令
CMD ["sh", "-c", "cd api && node server.js & node start-static-server.js"]
```

2. **构建和运行Docker容器**
```bash
docker build -t article-app .
docker run -p 3000:3000 -p 8080:8080 article-app
```

### 选项3：手动部署到云服务器

1. **创建云服务器实例**
   - 推荐使用：阿里云ECS、腾讯云CVM、AWS EC2
   - 操作系统：Ubuntu 20.04或CentOS 7

2. **安装Node.js**
```bash
# Ubuntu
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS
sudo yum install -y nodejs
```

3. **上传项目文件**
```bash
scp -r ./* user@your-server-ip:/path/to/app
```

4. **启动服务**
```bash
cd /path/to/app
cd api && node server.js &
node start-static-server.js &
```

5. **配置Nginx反向代理**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 环境变量配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| NODE_ENV | 运行环境 | development |
| PORT | API服务器端口 | 3000 |
| STATIC_PORT | 静态文件服务器端口 | 8080 |

## 验证部署

部署完成后，访问以下URL验证：

1. **健康检查**
   - GET: `/api/v1/health`
   - 预期返回：`{"code":200,"message":"API服务运行正常"}`

2. **获取文章列表**
   - GET: `/api/v1/articles`
   - 预期返回：文章列表JSON数据

3. **访问前端页面**
   - 首页：`/`
   - 文章列表：`/articles.html`
   - 后台管理：`/admin.html`

## 常见问题排查

1. **API无法访问**
   - 检查服务器防火墙设置
   - 确认API服务器正在运行
   - 验证端口是否正确暴露

2. **数据库连接失败**
   - 检查SQLite数据库文件权限
   - 确认数据库文件路径正确

3. **跨域问题**
   - 检查CORS配置是否正确
   - 确认API服务器允许所有来源访问

## 监控和维护

- 定期备份SQLite数据库文件
- 监控服务器资源使用情况
- 定期更新依赖包
- 配置日志收集系统
