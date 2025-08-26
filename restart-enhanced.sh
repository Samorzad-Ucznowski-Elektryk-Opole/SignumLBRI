#!/bin/bash
# Force Docker rebuild and restart script
echo "🔄 Rebuilding SignumLBRI Enhanced container..."
docker-compose build --no-cache signumlbri-enhanced
echo "🔄 Restarting container..."
docker-compose up -d signumlbri-enhanced
echo "📋 Checking container logs..."
docker-compose logs -f signumlbri-enhanced
