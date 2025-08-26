#!/bin/bash
# Comprehensive SignumLBRI Enhanced Startup Script

set -e  # Exit on any error

echo "🚀 Starting SignumLBRI Enhanced Application Stack..."
echo "=============================================="

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check dependencies
echo "📋 Checking dependencies..."
if ! command_exists docker; then
    echo "❌ Docker is not installed or not in PATH"
    exit 1
fi

if ! command_exists docker-compose; then
    echo "❌ Docker Compose is not installed or not in PATH"
    exit 1
fi

echo "✅ Docker and Docker Compose are available"

# Clean up any existing containers
echo "🧹 Cleaning up existing containers..."
docker-compose down --remove-orphans || true

# Remove any dangling images
echo "🗑️  Removing dangling images..."
docker image prune -f || true

# Build with no cache to ensure fresh build
echo "🔨 Building application image (no cache)..."
docker-compose build --no-cache --pull signumlbri-enhanced

# Start MongoDB first
echo "🗄️  Starting MongoDB..."
docker-compose up -d mongodb

# Wait for MongoDB to be healthy
echo "⏳ Waiting for MongoDB to be healthy..."
timeout=60
elapsed=0
while [ $elapsed -lt $timeout ]; do
    if docker-compose ps mongodb | grep -q "healthy"; then
        echo "✅ MongoDB is healthy"
        break
    fi
    sleep 2
    elapsed=$((elapsed + 2))
done

if [ $elapsed -ge $timeout ]; then
    echo "❌ MongoDB failed to become healthy within $timeout seconds"
    docker-compose logs mongodb
    exit 1
fi

# Start the Enhanced application
echo "🚀 Starting Enhanced application..."
docker-compose up -d signumlbri-enhanced

# Wait for application to be healthy
echo "⏳ Waiting for application to be healthy..."
timeout=120
elapsed=0
while [ $elapsed -lt $timeout ]; do
    if curl -f http://localhost:4000/health >/dev/null 2>&1; then
        echo "✅ Application is healthy"
        break
    fi
    sleep 3
    elapsed=$((elapsed + 3))
done

if [ $elapsed -ge $timeout ]; then
    echo "❌ Application failed to become healthy within $timeout seconds"
    echo "📋 Application logs:"
    docker-compose logs signumlbri-enhanced
    exit 1
fi

# Show status
echo ""
echo "🎉 SignumLBRI Enhanced started successfully!"
echo "=============================================="
echo "📍 Application URL: http://localhost:4000/enhanced"
echo "🏥 Health Check: http://localhost:4000/health"
echo ""
echo "📋 Available endpoints:"
echo "   🏠 Dashboard: http://localhost:4000/enhanced"
echo "   📚 Library: http://localhost:4000/enhanced/library"
echo "   📖 Books: http://localhost:4000/enhanced/books"
echo "   ⚙️  Admin: http://localhost:4000/enhanced/admin"
echo ""
echo "📊 Container status:"
docker-compose ps

echo ""
echo "📋 To view logs: docker-compose logs -f signumlbri-enhanced"
echo "🛑 To stop: docker-compose down"
