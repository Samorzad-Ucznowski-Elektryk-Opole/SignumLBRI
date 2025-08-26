# 🚀 SignumLBRI Enhanced

Modern school book management system with **glassmorphism UI** and advanced features.

## ✨ Features

- 🎨 **Glassmorphism Design** - Modern transparent UI
- 🌙 **Dark/Light Mode** - Theme switching
- 📱 **Responsive Design** - Works on all devices  
- 🌍 **Multi-language** - Polish/English/Ukrainian
- 📚 **Book Management** - Advanced library system
- 👥 **User Management** - Students, teachers, admin
- 📊 **Analytics Dashboard** - Reports and statistics
- 🔒 **Security** - Password hashing, sessions, CSRF protection

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** (download from [nodejs.org](https://nodejs.org/))

### Installation & Run

```bash
# Clone repository
git clone https://github.com/Samorzad-Ucznowski-Elektryk-Opole/SignumLBRI.git
cd SignumLBRI

# Install dependencies  
npm install

# Run Enhanced application
npm start
```

**Enhanced application will be available at:** 🌐 **http://localhost:4000/enhanced**

### Alternative Launch Options

#### 🔧 Windows Setup Script
```bash
# Double-click to run:
launch-enhanced.bat
```

#### 🐳 Docker
```bash
# Quick Docker start:
docker-quick-start.bat

# Or manually:
docker build -f Dockerfile.enhanced -t signumlbri-enhanced .
docker run -p 4000:4000 signumlbri-enhanced
```

## 📋 Available Scripts

- `npm start` - Start Enhanced application
- `npm run dev` - Development mode with auto-reload
- `npm run docker:build` - Build Docker image
- `npm run docker:run` - Run Docker container  
- `npm run docker:compose` - Start with Docker Compose

## 🌐 Application Routes

- **Enhanced UI**: http://localhost:4000/enhanced
- **Admin Panel**: http://localhost:4000/enhanced/admin
- **API**: http://localhost:4000/api/
- **Health Check**: http://localhost:4000/health

## 🏗️ Architecture

- **Backend**: Node.js + Express
- **Database**: MongoDB (with in-memory fallback)
- **Templates**: Pug
- **Styling**: SCSS with glassmorphism effects
- **Security**: Helmet, bcrypt, rate limiting
- **Session**: Express-session with secure cookies

## 📁 Project Structure

```
SignumLBRI/
├── enhanced-app.js          # Main Enhanced application
├── src/                     # Source code
│   ├── controllers/         # Route controllers
│   ├── models/             # Database models
│   ├── util/               # Utilities
│   └── lang/               # Language files
├── views/                  # Pug templates
├── public/                 # Static assets (CSS, JS, images)
├── Dockerfile.enhanced     # Docker configuration
└── docker-compose.yml      # Docker Compose setup
```

## 🔧 Configuration

Environment variables in `.env`:

```bash
NODE_ENV=production
PORT=4000
SESSION_SECRET=your-secret-key
DEFAULT_LANGUAGE=pl
DEFAULT_THEME=light
USE_MEMORY_DB=true
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

**ZSEL SignumLBRI Team**
- Repository: https://github.com/Samorzad-Ucznowski-Elektryk-Opole/SignumLBRI

---

**Enhanced with ❤️ by GitHub Copilot** 🤖
