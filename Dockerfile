# 🐳 SignumLBRI - Production Docker Image
# System zarządzania książkami szkolnymi z TypeScript i glassmorphism UI

# Multi-stage build for TypeScript
FROM node:18-alpine AS builder

# Metadane
LABEL maintainer="ZSEL SignumLBRI Team"
LABEL version="2.0.0"
LABEL description="Modern school book management system with glassmorphism UI"

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files first (for better layer caching)
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm install

# Copy source code
COPY src/ ./src/

# Build TypeScript to JavaScript
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache dumb-init wget curl

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S signumlbri -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production --ignore-scripts && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy runtime assets
COPY views/ ./views/
COPY public/ ./public/
COPY mongo-init/ ./mongo-init/

# Copy debug files to temp (for troubleshooting)
RUN mkdir -p temp
COPY temp/ ./temp/

# Create necessary directories with proper permissions
RUN mkdir -p public/uploads logs /app/node_modules/.cache

# Set proper ownership before switching users
RUN chown -R signumlbri:nodejs /app
RUN chmod -R 755 /app
RUN chmod -R 777 public/uploads logs

# Switch to non-root user for security
USER signumlbri

# Expose port
EXPOSE 4000

# Environment variables
ENV NODE_ENV=production
ENV PORT=4000

# Health check with enhanced monitoring
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:4000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the TypeScript compiled application
CMD ["node", "dist/server.js"]
