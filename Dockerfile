# Multi-stage Docker build for SignumLBRI Production

# Build stage
FROM node:18-alpine AS builder

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build TypeScript application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install system dependencies for production
RUN apk add --no-cache \
    wget \
    curl \
    && rm -rf /var/cache/apk/*

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S signumlbri -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && \
    npm cache clean --force && \
    rm -rf ~/.npm

# Copy built application from builder stage
COPY --from=builder --chown=signumlbri:nodejs /app/dist ./dist
COPY --from=builder --chown=signumlbri:nodejs /app/public ./public
COPY --from=builder --chown=signumlbri:nodejs /app/views ./views
COPY --from=builder --chown=signumlbri:nodejs /app/node_modules ./node_modules

# Create necessary directories with correct permissions
RUN mkdir -p logs public/uploads .cache && \
    chown -R signumlbri:nodejs logs public/uploads .cache

# Set user
USER signumlbri

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start application
CMD ["node", "dist/server.js"]
