# 第一阶段：编译构建
FROM node:20-alpine AS builder

WORKDIR /app

# 使用镜像加速
RUN npm config set registry https://registry.npmmirror.com 

# 先拷贝 package.json 充分利用 Docker 缓存层
COPY package*.json ./
RUN npm install

# 拷贝全量源码并打包
COPY . .
RUN npm run build

# 第二阶段：运行阶段 (Nginx)
FROM nginx:alpine

# 移除默认配置
RUN rm /etc/nginx/conf.d/default.conf

# 1. 拷贝构建好的静态资源 
# (注意：如果你是用 Vite 创建的项目，输出目录是 dist；如果是 Create React App，通常是 build。请确保这里和你的项目一致)
COPY --from=builder /app/dist /usr/share/nginx/html

# 2. 拷贝刚才写的 nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露 80 端口给 Azure Ingress
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]