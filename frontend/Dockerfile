# 多阶段构建 - 第一阶段:构建
FROM node:20-alpine AS builder

WORKDIR /app

# 设置 npm 镜像源为淘宝镜像
RUN npm config set registry https://registry.npmmirror.com

# 复制依赖配置
COPY package.json ./

# 安装依赖（包括 devDependencies）
RUN npm install

# 复制源代码
COPY . .

# 构建生产版本
RUN npm run build
# 第二阶段:运行 - 使用 Nginx 提供静态文件服务
FROM nginx:alpine

# 复制构建产物到 Nginx 目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
