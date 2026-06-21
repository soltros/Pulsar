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
FROM node:22-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

# Copy package files and install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy backend files
COPY server/ ./server/

# Copy compiled assets from builder
COPY --from=builder /app/dist ./dist

# Add healthcheck for Compose orchestration
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

EXPOSE 80
CMD ["node", "server/index.js"]
