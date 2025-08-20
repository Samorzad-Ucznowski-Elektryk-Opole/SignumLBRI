# 🚀 SignumLBRI 2025 Ultra Edition - Księgarnia Szkolna Nowej Generacji

**Najnowocześniejsza platforma sprzedaży podręczników szkolnych w Polsce** 🇵🇱

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![Docker](https://img.shields.io/badge/docker-ready-blue)]()
[![Node.js](https://img.shields.io/badge/node.js-20+-green)]()
[![TypeScript](https://img.shields.io/badge/typescript-5.0+-blue)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()

## ⚡ Features That Make You Go WOW!

### 🎯 Core Features
- **Real-time Book Trading** - Live updates, notifications, chat
- **Advanced Search** - AI-powered book discovery with Elasticsearch
- **Multi-school Support** - Dedicated spaces for different schools
- **Smart Recommendations** - ML-based book suggestions
- **Mobile-First Design** - Perfect experience on all devices
- **Multi-language Support** - Polish, English, Ukrainian

### 🔥 Ultra-Modern Tech Stack
- **Backend**: Node.js 20 + Express + TypeScript
- **Database**: MongoDB 7 + Redis Cache + Elasticsearch
- **Frontend**: Modern JavaScript + Bootstrap 5 + HTMX
- **Real-time**: WebSockets + Socket.IO
- **Infrastructure**: Docker + Nginx + SSL/HTTPS
- **Security**: Helmet + CORS + Rate Limiting + JWT

### 🌟 WOW Factor Features
- **Instant Search** - Find books as you type
- **Live Notifications** - Real-time updates when books are added/sold
- **Smart Cache** - Multi-tier caching for lightning speed
- **Auto-scaling** - Handles thousands of concurrent users
- **Health Monitoring** - Built-in health checks and metrics
- **Developer Tools** - Hot-reload, debugging, monitoring

## 🚀 Quick Start (1 Command Setup!)

### For Development (Recommended)
```bash
# 1. Clone and setup everything with one command
git clone https://github.com/Samorzad-Ucznowski-Elektryk-Opole/SignumLBRI.git
cd SignumLBRI
dev-setup.bat

# That's it! 🎉
```

### For Production
```bash
# 1. Deploy to production
prod-deploy.bat
```

## 📡 Access Points

After starting the development environment:

| Service | URL | Description |
|---------|-----|-------------|
| 🌐 **Main App (HTTP)** | http://localhost:8080 | Primary application access |
| 🔒 **Main App (HTTPS)** | https://localhost:8443 | Secure application access |
| 🛠️ **Direct App** | http://localhost:3000 | Direct development access |
| 📧 **Email Testing** | http://localhost:8025 | MailHog email testing |
| 🗄️ **Database Admin** | http://localhost:8081 | Adminer database management |
| 📊 **Redis Admin** | http://localhost:8082 | Redis Commander |
| 🔍 **Elasticsearch** | http://localhost:9200 | Search engine API |

## 🎮 Development Commands

```bash
# Development (Full Stack)
npm run dev:docker         # Start full development environment
npm run dev                 # Local development (requires local DB)

# Building & Production  
npm run build              # Build optimized production version
npm run prod:docker        # Deploy production environment

# Testing & Quality
npm test                   # Run all tests
npm run test:watch         # Watch mode testing
npm run test:coverage      # Test coverage report
npm run lint:fix           # Fix code style issues

# Database Operations
npm run database:seed      # Seed database with sample data
npm run database:migrate   # Run database migrations
npm run backup:db          # Backup database

# Monitoring & Debugging
npm run logs:app           # View application logs
npm run logs:nginx         # View Nginx logs
npm run health:check       # Check application health

# SSL & Security
npm run ssl:generate       # Generate SSL certificates
npm run security:audit     # Security vulnerability audit
```

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx Proxy   │────│  SignumLBRI App │────│   MongoDB 7     │
│  (8080/8443)    │    │   (Node.js 20)  │    │   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐    ┌─────────────────┐
         │              │   Redis Cache   │    │ Elasticsearch   │
         │              │   (Sessions)    │    │ (Search Engine) │
         │              └─────────────────┘    └─────────────────┘
         │
    ┌─────────────────┐
    │   Static Files  │
    │   (CSS/JS/IMG)  │
    └─────────────────┘
```

## 🔧 Environment Configuration

### Development (.env.development)
```bash
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://signum_dev:dev_password_2025@localhost:27017/signumlbri_dev
REDIS_URI=redis://:dev_redis_2025@localhost:6379/0
SESSION_SECRET=development-session-secret-2025
JWT_SECRET=development-jwt-secret-2025
ENABLE_DEBUG=true
ENABLE_HOT_RELOAD=true
```

### Production (.env.production)
```bash
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://signum_admin:SECURE_PASSWORD@mongo:27017/signumlbri?authSource=admin
REDIS_URI=redis://:SECURE_REDIS_PASSWORD@redis:6379/0
SESSION_SECRET=ULTRA_SECURE_SESSION_SECRET_256_CHARS
JWT_SECRET=ULTRA_SECURE_JWT_SECRET_256_CHARS
ENABLE_ANALYTICS=true
ENABLE_MONITORING=true
```

## 📊 Performance Features

### ⚡ Speed Optimizations
- **Multi-tier Caching**: Local + Redis + CDN
- **Compression**: Gzip + Brotli compression
- **Image Optimization**: Automatic image resizing and WebP conversion
- **Bundle Optimization**: Webpack code splitting and minification
- **Database Indexing**: Optimized MongoDB indexes

### 📈 Scalability Features
- **Horizontal Scaling**: Container orchestration ready
- **Load Balancing**: Nginx upstream configuration
- **Session Clustering**: Redis-based session store
- **Background Jobs**: Queue-based task processing
- **CDN Ready**: Static asset optimization

### 🔒 Security Features
- **HTTPS Everywhere**: SSL/TLS encryption
- **Security Headers**: Comprehensive security headers
- **Rate Limiting**: API and route protection
- **Input Validation**: Comprehensive data validation
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Content Security Policy

## 🧪 Testing Strategy

### Unit Tests
```bash
npm test                    # Run all unit tests
npm run test:watch          # Watch mode for development
npm run test:coverage       # Generate coverage report
```

### Integration Tests
```bash
npm run test:e2e           # End-to-end testing
```

### Performance Tests
```bash
npm run performance:analyze # Bundle size analysis
```

## 🚀 Deployment Options

### 1. Docker Compose (Recommended)
```bash
docker-compose up --build
```

### 2. Kubernetes
```bash
kubectl apply -f k8s/
```

### 3. Traditional Server
```bash
npm run build
npm run start:prod
```

## 📱 Mobile Support

- **Progressive Web App** (PWA) ready
- **Responsive Design** for all screen sizes
- **Touch Optimized** interface
- **Offline Support** for basic features
- **Push Notifications** for mobile devices

## 🌍 Internationalization

Supported languages:
- 🇵🇱 **Polish** (primary)
- 🇬🇧 **English**
- 🇺🇦 **Ukrainian**
- 🏴‍☠️ **Anime** (easter egg language)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **ZSEL Opole** - Development Team
- **Samorząd Uczniowski** - Project Management
- **Community Contributors** - Various improvements

## 🆘 Support

- 📧 **Email**: support@zsel.opole.pl
- 💬 **Discord**: [Join our server](https://discord.gg/zsel)
- 🐛 **Issues**: [GitHub Issues](https://github.com/Samorzad-Ucznowski-Elektryk-Opole/SignumLBRI/issues)

## 🎉 Acknowledgments

- MongoDB for awesome database technology
- Redis for blazing fast caching
- Docker for containerization
- All open-source contributors

---

**Made with ❤️ by ZSEL Opole Students | 2025 Edition**

*"The future of school book trading is here!"* 🚀
