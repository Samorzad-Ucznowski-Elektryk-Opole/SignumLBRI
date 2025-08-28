#!/bin/bash
# SignumLBRI Docker-Native Production Server

set -e

echo "🐳 SignumLBRI Production Deployment"
echo "=================================="

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose not found. Please install Docker Compose."
    exit 1
fi

echo "✅ Docker environment ready"

# Deploy services
echo "🚀 Starting production deployment..."
docker-compose up -d

echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "🔍 Health Checks:"
sleep 10
docker-compose logs --tail=5 app

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Application URL: http://$(hostname -I | awk '{print $1}')"
echo "📊 System Status: docker-compose ps"
echo "📋 View Logs: docker-compose logs -f"
echo "🛑 Stop Services: docker-compose down"
echo ""
echo "📞 Support: docker-compose logs > system-logs.txt"
