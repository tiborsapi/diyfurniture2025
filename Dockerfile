FROM node:18-alpine AS builder
WORKDIR /app

# copy package manifests first to leverage layer cache
COPY package*.json ./
RUN npm ci --silent

# copy rest of the source and build
COPY . .
# build production bundle (adjust flags if your project uses different build target)
RUN npm run build -- --configuration production \
  && mkdir -p /app/dist_out \
  && cp -a /app/dist/* /app/dist_out/

FROM nginx:alpine
# copy built app into nginx html root
COPY --from=builder /app/dist_out/ /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]