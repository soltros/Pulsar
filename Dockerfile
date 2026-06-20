# Stage 1: Build Environment
FROM node:22-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and compile the Vite/React PWA
COPY . .
RUN npm run build

# Stage 2: Production Delivery
FROM nginx:alpine AS production
# Copy compiled assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration (handles PWA routing and caching)
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

# Add healthcheck for Compose orchestration
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
