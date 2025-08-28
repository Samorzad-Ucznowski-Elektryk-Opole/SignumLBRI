# 🐳 SignumLBRI Enhanced - Docker Makefile

.PHONY: help build up down logs restart clean

# Default target
help:
	@echo "🐳 SignumLBRI Enhanced - Docker Commands"
	@echo ""
	@echo "Usage:"
	@echo "  make up       - Start application with docker-compose"
	@echo "  make down     - Stop application"
	@echo "  make logs     - View application logs"
	@echo "  make restart  - Restart application"
	@echo "  make build    - Build Docker image"
	@echo "  make clean    - Stop and remove containers + images"
	@echo "  make rebuild  - Clean build and start"
	@echo ""
	@echo "🌐 Application: http://localhost:4000/enhanced"

# Start application
up:
	@echo "🚀 Starting SignumLBRI Enhanced..."
	docker-compose up -d
	@echo "✅ Application started at http://localhost:4000/enhanced"

# Stop application
down:
	@echo "🛑 Stopping SignumLBRI Enhanced..."
	docker-compose down
	@echo "✅ Application stopped"

# View logs
logs:
	@echo "📊 Viewing application logs..."
	docker-compose logs -f

# Restart application
restart:
	@echo "🔄 Restarting SignumLBRI Enhanced..."
	docker-compose restart
	@echo "✅ Application restarted"

# Build Docker image
build:
	@echo "🏗️ Building Docker image..."
	docker build -t signumlbri-enhanced .
	@echo "✅ Docker image built"

# Clean everything
clean:
	@echo "🧹 Cleaning Docker containers and images..."
	docker-compose down --rmi all --volumes --remove-orphans
	@echo "✅ Cleanup completed"

# Rebuild everything
rebuild: clean build up
	@echo "🎯 Rebuild completed - application ready at http://localhost:4000/enhanced"
