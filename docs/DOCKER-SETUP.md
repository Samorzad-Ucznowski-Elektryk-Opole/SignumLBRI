# 🐳 SignumLBRI Enhanced - Docker Setup Guide

Modern school book management system with **glassmorphism UI** - runs in Docker containers.

## ✨ Features

- 🎨 **Glassmorphism Design** - Modern transparent UI
- 🌙 **Dark/Light Mode** - Theme switching
- 📱 **Responsive Design** - Works on all devices  
- 🌍 **Multi-language** - Polish/English/Ukrainian
- 📚 **Book Management** - Advanced library system
- 👥 **User Management** - Students, teachers, admin
- 📊 **Analytics Dashboard** - Reports and statistics
- 🔒 **Security** - Password hashing, sessions, CSRF protection

## 🐳 Docker Setup

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

# Or use the start script (Windows)
.\scripts\start.bat

# Or use quick restart script
.\scripts\quick-restart.bat
```

### 🌐 Access Points

Once containers are running:

- **Main Application**: http://localhost:4000
- **Health Check**: http://localhost:4000/health  
- **Statistics**: http://localhost:4000/stats
- **MongoDB**: localhost:27017 (for database tools)

### 📊 Container Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Web App       │    │   MongoDB       │
│   Port: 4000    │◄──►│   Port: 27017   │
│   Node.js/Pug   │    │   Database      │
└─────────────────┘    └─────────────────┘
```

## 🛠️ Management Commands

### Basic Operations
```bash
# Start services
docker-compose up -d

# Stop services  
docker-compose down

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Rebuild containers
docker-compose up --build -d
```

### Container Status
```bash
# Check container status
docker-compose ps

# View detailed logs
docker-compose logs signumlbri-enhanced
docker-compose logs mongodb

# Access container shell
docker-compose exec signumlbri-enhanced bash
docker-compose exec mongodb mongosh
```

### Troubleshooting Commands
```bash
# Remove everything and start fresh
docker-compose down --volumes --remove-orphans
docker-compose up --build -d

# Remove unused Docker resources
docker system prune -f

# View resource usage
docker stats
```

## 🔧 Configuration

### Environment Variables

Key environment variables (set in `.env` file):

```bash
# Application
PORT=4000
NODE_ENV=production
SESSION_SECRET=your_session_secret

# Database
MONGODB_URI=mongodb://mongodb:27017/signumlbri

# Features
ENABLE_REGISTRATION=true
ENABLE_GUEST_MODE=false
```

### Volume Mounts

- **Application logs**: `./logs:/app/logs`
- **MongoDB data**: `./mongodb-data:/data/db`  
- **File uploads**: `./public/uploads:/app/public/uploads`

## 🐛 Debugging

### Health Check
The application includes comprehensive health monitoring:

```bash
# Quick health check
curl http://localhost:4000/health

# Detailed statistics
curl http://localhost:4000/stats
```

### Log Analysis
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f signumlbri-enhanced

# Filter logs by time
docker-compose logs --since=1h signumlbri-enhanced
```

### Database Access
```bash
# Access MongoDB shell
docker-compose exec mongodb mongosh signumlbri

# View collections
show collections

# Query users
db.users.find().pretty()
```

## 🚀 Production Deployment

### Docker Swarm (recommended)
```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml signumlbri

# Check services
docker service ls
```

### Alternative Configurations

- **Minimal Config**: Use `configs/docker-compose-complete.yml` for full setup
- **Development**: Set `NODE_ENV=development` for debug mode
- **Custom Ports**: Modify port mappings in docker-compose.yml

## 📈 Monitoring

### Built-in Monitoring

The application includes advanced monitoring:

- **Request Tracking**: Unique request IDs and timing
- **System Resources**: Memory, CPU, uptime monitoring  
- **Database Health**: Connection status and performance
- **Error Tracking**: Comprehensive error logging

### Log Locations

- **Application logs**: `./logs/`
- **MongoDB logs**: Container logs via `docker-compose logs mongodb`
- **Docker logs**: `docker-compose logs`

## 🔐 Security

### Default Security Features

- **CSRF Protection**: Built-in token validation
- **Session Management**: Secure session handling
- **Password Hashing**: bcrypt for password security
- **Rate Limiting**: API request limiting
- **Security Headers**: Helmet.js integration

### Best Practices

1. **Change default passwords**
2. **Use environment variables for secrets**
3. **Enable HTTPS in production**
4. **Regular security updates**
5. **Monitor access logs**

## 📞 Support

For issues and questions:

1. Check the [troubleshooting guide](TROUBLESHOOTING.md)
2. Review Docker logs for errors
3. Verify container health status
4. Open an issue on GitHub

---

🔧 **Maintained by**: ZSEL SignumLBRI Team  
📅 **Last Updated**: August 2025
