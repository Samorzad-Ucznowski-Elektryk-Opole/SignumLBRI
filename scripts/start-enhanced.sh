#!/bin/bash
# SignumLBRI Enhanced - Start Script
# Uruchomienie aplikacji za pomocą Docker Compose

echo "🚀 Starting SignumLBRI Enhanced Application..."
echo "=============================================="

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not available. Please install Docker."
    echo ""
    echo "💡 Instructions:"
    echo "   1. Make sure Docker Desktop is installed"
    echo "   2. Start Docker Desktop"
    echo "   3. Wait for it to fully load"
    echo "   4. Try again"
    echo ""
    exit 1
fi

echo "✅ Docker is available"
echo ""

echo "🛠️  Stopping previous instances..."
docker-compose down --remove-orphans > /dev/null 2>&1

echo "🏗️  Building and starting containers..."
echo ""
docker-compose up --build -d

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Containers started successfully!"
    echo ""
    echo "📊 Container status:"
    docker-compose ps
    echo ""
    echo "🌐 Application available at: http://localhost:4000"
    echo "🏥 Health check: http://localhost:4000/health"
    echo "📈 Statistics: http://localhost:4000/stats"
    echo ""
else
    echo "❌ Error starting containers"
    echo ""
    exit 1
fi
