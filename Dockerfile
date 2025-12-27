FROM node:18-alpine

WORKDIR /app

# 复制项目文件
COPY . .

# 安装依赖
RUN npm install && cd api && npm install

# 暴露端口
EXPOSE 3000 8080

# 启动命令
CMD ["sh", "-c", "cd api && node server.js & node ../start-static-server.js"]
