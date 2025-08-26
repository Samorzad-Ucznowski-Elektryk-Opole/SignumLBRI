# 🐳 SignumLBRI Enhanced - Docker Only

Modern school book management system with **glassmorphism UI** - runs exclusively in Docker.

## ✨ Features

- 🎨 **Glassmorphism Design** - Modern transparent UI
- 🌙 **Dark/Light Mode** - Theme switching
- 📱 **Responsive Design** - Works on all devices  
- 🌍 **Multi-language** - Polish/English/Ukrainian
- 📚 **Book Management** - Advanced library system
- 👥 **User Management** - Students, teachers, admin
- 📊 **Analytics Dashboard** - Reports and statistics
- 🔒 **Security** - Password hashing, sessions, CSRF protection

## 🐳 Docker Setup (ONLY WAY)

### Prerequisites
- **Docker** (download from [docker.com](https://www.docker.com/))
- **Docker Compose** (included with Docker Desktop)

### Quick Start

```bash
# Clone repository
git clone https://github.com/Samorzad-Ucznowski-Elektryk-Opole/SignumLBRI.git
cd SignumLBRI

# Start with Docker Compose (recommended)
docker-compose up -d

# Or build and run manually
docker build -t signumlbri-enhanced .
docker run -p 4000:4000 signumlbri-enhanced
```

**Application will be available at:** 🌐 **http://localhost:4000/enhanced**

## 📋 Docker Commands

### Main Commands
```bash
# Start application
docker-compose up -d

# Stop application  
docker-compose down

# View logs
docker-compose logs -f

# Restart application
docker-compose restart

# Rebuild and start
docker-compose up --build -d
```

### NPM Docker Scripts
```bash
npm run docker:up      # Start with docker-compose
npm run docker:down    # Stop docker-compose
npm run docker:logs    # View logs
npm run docker:restart # Restart containers
npm run docker:build  # Build Docker image
npm run docker:run     # Run single container
```

## 🌐 Application Routes

- **Enhanced UI**: http://localhost:4000/enhanced
- **Admin Panel**: http://localhost:4000/enhanced/admin
- **API**: http://localhost:4000/api/
- **Health Check**: http://localhost:4000/health

## 🏗️ Docker Architecture

- **Base**: Alpine Linux (lightweight)
- **Runtime**: Node.js 18+
- **Port**: 4000
- **Database**: MongoDB (in-memory fallback)
- **Security**: Non-root user, security headers
- **Health**: Built-in health checks

## 📁 Project Structure

```
SignumLBRI/
├── Dockerfile                  # Docker configuration
├── docker-compose.yml         # Docker Compose setup
├── enhanced-app.js            # Main Enhanced application
├── package.json               # Dependencies and Docker scripts
├── src/                       # Source code
│   ├── controllers/           # Route controllers
│   ├── models/               # Database models
│   ├── util/                 # Utilities
│   └── lang/                 # Language files
├── views/                    # Pug templates
└── public/                   # Static assets (CSS, JS, images)
```

## 🔧 Environment Configuration

Default environment variables in docker-compose.yml:

```yaml
environment:
  - NODE_ENV=production
  - PORT=4000
  - USE_MEMORY_DB=true
  - SESSION_SECRET=enhanced-secret-key-production-change-this
  - DEFAULT_LANGUAGE=pl
  - DEFAULT_THEME=light
  - ENABLE_ANALYTICS=true
  - ENABLE_NOTIFICATIONS=true
```

## 🚀 Development

For development with auto-reload:

```bash
# Build development image
docker build -t signumlbri-enhanced:dev .

# Run with volume mount for development
docker run -p 4000:4000 -v $(pwd):/app signumlbri-enhanced:dev npm run dev
```

## 📊 Health Monitoring

The application includes health checks:

```bash
# Check container health
docker ps

# View health check logs
docker inspect signumlbri-enhanced --format='{{.State.Health.Status}}'

# Manual health check
curl http://localhost:4000/health
```

## 🛡️ Security

- Non-root user execution
- Security headers (Helmet.js)
- Rate limiting
- CSRF protection  
- Secure session cookies
- Input validation

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Make changes and test with Docker
4. Commit changes (`git commit -m 'Add amazing feature'`)
5. Push to branch (`git push origin feature/amazing-feature`)
6. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

**ZSEL SignumLBRI Team**
- Repository: https://github.com/Samorzad-Ucznowski-Elektryk-Opole/SignumLBRI

---

**🐳 Docker-first Enhanced with ❤️ by GitHub Copilot** 🤖
