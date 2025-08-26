#!/bin/bash
# SignumLBRI Enhanced System Verification Script

echo "🔍 SignumLBRI Enhanced System Verification"
echo "=========================================="

# Check Docker
if command -v docker >/dev/null 2>&1; then
    echo "✅ Docker: $(docker --version)"
else
    echo "❌ Docker not found"
    exit 1
fi

# Check Docker Compose
if command -v docker-compose >/dev/null 2>&1; then
    echo "✅ Docker Compose: $(docker-compose --version)"
else
    echo "❌ Docker Compose not found"
    exit 1
fi

# Check if application is running
if curl -f http://localhost:4000/health >/dev/null 2>&1; then
    echo "✅ Application is running and healthy"
    echo "📊 Health Status:"
    curl -s http://localhost:4000/health | jq . 2>/dev/null || curl -s http://localhost:4000/health
else
    echo "❌ Application is not responding"
fi

# Check containers
echo ""
echo "📦 Container Status:"
docker-compose ps 2>/dev/null || echo "No containers running"

# Check recent logs
echo ""
echo "📋 Recent Application Logs:"
docker-compose logs --tail=10 signumlbri-enhanced 2>/dev/null || echo "Cannot access logs"

echo ""
echo "🎯 Test Endpoints:"
endpoints=(
    "http://localhost:4000/health"
    "http://localhost:4000/enhanced"
    "http://localhost:4000/enhanced/library"
    "http://localhost:4000/enhanced/books"
    "http://localhost:4000/enhanced/admin"
)

for endpoint in "${endpoints[@]}"; do
    if curl -f -s "$endpoint" >/dev/null; then
        echo "✅ $endpoint"
    else
        echo "❌ $endpoint"
    fi
done

echo ""
echo "📝 To start the application:"
echo "   ./start-enhanced.sh (Linux/Mac)"
echo "   start-enhanced.bat (Windows)"
echo ""
echo "📝 To view logs:"
echo "   docker-compose logs -f signumlbri-enhanced"
