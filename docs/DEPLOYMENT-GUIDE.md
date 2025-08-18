# 🚀 Production Deployment Guide - SignumLBRI

## 📋 Pre-Deployment Checklist

### 1. Security Configuration ✅
- [x] Email addresses updated to samorzad@elektryk.opole.pl
- [x] MongoDB authentication and validation schemas
- [x] Redis password protection
- [x] Nginx security headers and rate limiting
- [x] Comprehensive input validation system
- [x] CSRF protection implementation
- [x] File upload security
- [x] SQL injection prevention
- [x] XSS protection

### 2. Infrastructure Components ✅
- [x] **Multi-stage Docker build** with security-hardened Alpine Linux
- [x] **MongoDB 7.0** with authentication and validation rules
- [x] **Redis 7.2** for secure session management
- [x] **Nginx 1.25** as reverse proxy with SSL termination
- [x] **Filebeat 8.11** for centralized logging
- [x] **Custom network isolation** for container security

### 3. Environment Configuration ✅
- [x] Comprehensive `.env.example` with 50+ security variables
- [x] Encryption keys and session secrets
- [x] Database connection strings
- [x] SSL/TLS configuration variables
- [x] Rate limiting and security thresholds

## 🔧 Quick Start Deployment

### Step 1: Environment Setup
```bash
# Copy and configure environment file
cp .env.example .env

# Edit .env with your production values
nano .env
```

### Step 2: SSL Certificate Setup
```bash
# Create SSL directory
mkdir -p nginx/ssl

# Generate self-signed certificate (for testing)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/private.key \
  -out nginx/ssl/certificate.crt \
  -subj "/C=PL/ST=Opole/L=Opole/O=ZSEL/CN=samorzad.elektryk.opole.pl"

# Set secure permissions
chmod 600 nginx/ssl/private.key
chmod 644 nginx/ssl/certificate.crt
```

### Step 3: Deploy Infrastructure
```bash
# Build and start all services
docker-compose -f docker-compose-new.yml up -d --build

# Check service status
docker-compose -f docker-compose-new.yml ps
```

### Step 4: Verify Deployment
```bash
# Run comprehensive tests
bash test-docker-infrastructure.sh

# Quick health check
bash test-docker-infrastructure.sh --quick
```

## 🛡️ Security Features Implemented

### Application-Level Security

#### Input Validation & Sanitization
- ✅ **Email validation** with RFC 5322 compliance
- ✅ **Password strength** requirements (8+ chars, mixed case, numbers, symbols)
- ✅ **Polish name support** with diacritic characters
- ✅ **Phone number** international format validation
- ✅ **MongoDB ObjectId** format validation
- ✅ **Price validation** with range and precision limits
- ✅ **Search query** sanitization against XSS
- ✅ **File upload** type, size, and content validation

#### Security Middleware Stack
```typescript
// Applied in order:
1. Suspicious Activity Detection
2. Bot Detection  
3. Rate Limiting (100 req/15min)
4. Security Headers
5. Input Sanitization
6. SQL Injection Protection
7. CSRF Protection
8. File Upload Security
```

### Network-Level Security

#### Nginx Security Configuration
```nginx
# Security headers applied:
add_header X-Content-Type-Options nosniff;
add_header X-Frame-Options DENY;
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'";
add_header Referrer-Policy strict-origin-when-cross-origin;

# Rate limiting:
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;
```

#### Network Isolation
```yaml
networks:
  signum_network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

### Database Security

#### MongoDB Protection
```javascript
// Authentication enabled
db.createUser({
  user: "signum_user",
  pwd: "signum_password", // Use strong password in production
  roles: [{ role: "readWrite", db: "signum_db" }]
});

// Validation schemas for all collections
db.createCollection("publicusers", {
  validator: {
    $jsonSchema: {
      required: ["email", "passwordHash", "firstName", "lastName"],
      properties: {
        email: { 
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
        },
        passwordHash: { 
          bsonType: "string",
          minLength: 60 // bcrypt hash length
        }
      }
    }
  }
});
```

#### Redis Security
```yaml
redis:
  command: redis-server --requirepass redis_secure_password
  environment:
    - REDIS_PASSWORD=redis_secure_password
```

### Container Security

#### Multi-Stage Docker Build
```dockerfile
# Security-hardened build
FROM node:18-alpine as builder
# ... build steps

FROM node:18-alpine as production
RUN addgroup -g 1001 -S nodejs && adduser -S nonroot -u 1001
USER nonroot
COPY --from=builder --chown=nonroot:nonroot /app/dist ./dist
```

#### Security Best Practices
- ✅ **Non-root user** in all containers
- ✅ **Minimal base images** (Alpine Linux)
- ✅ **Read-only file systems** where possible
- ✅ **Resource limits** to prevent DoS
- ✅ **Health checks** for reliability
- ✅ **Network isolation** between services

## 📊 Monitoring & Logging

### Security Event Monitoring
```typescript
// Automatic logging of security events:
- Rate limit violations
- SQL injection attempts  
- XSS attack attempts
- Malicious file uploads
- Suspicious activity patterns
- Authentication failures
```

### Performance Monitoring
```yaml
# Container health checks
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Centralized Logging
```yaml
filebeat:
  volumes:
    - ./logs:/usr/share/filebeat/logs
    - ./nginx/logs:/var/log/nginx
  # Collects logs from all services
```

## 🔄 Production Maintenance

### Daily Tasks
- Monitor security logs for threats
- Check application health endpoints
- Review rate limiting effectiveness

### Weekly Tasks
- Analyze security event trends
- Update suspicious IP blacklists
- Review file upload attempts
- Check SSL certificate expiry

### Monthly Tasks
- Update security dependencies
- Review and test security configurations
- Analyze performance metrics
- Update validation rules if needed

### Quarterly Tasks
- Complete security audit
- Penetration testing
- Disaster recovery testing
- Update security documentation

## 🚨 Incident Response

### Security Incident Levels

#### Level 1 - Low (Monitoring)
- Single rate limit violation
- Bot detection trigger
- Invalid input attempts

#### Level 2 - Medium (Alert)
- Multiple failed authentication attempts
- Suspicious file upload patterns
- Repeated validation failures

#### Level 3 - High (Action Required)
- SQL injection attempts detected
- XSS attack patterns found
- IP showing persistent attack behavior

#### Level 4 - Critical (Immediate Response)
- Successful breach indicators
- Multiple attack vectors simultaneously
- System performance degradation from attacks

### Response Actions
```bash
# Block suspicious IP immediately
docker-compose exec nginx nginx -s reload

# Review recent security logs
docker-compose logs --tail=100 app | grep "SECURITY"

# Check MongoDB for unusual activity
docker-compose exec mongodb mongosh -u signum_user -p signum_password

# Monitor system resources
docker stats
```

## 📈 Performance Optimization

### Production Tuning
```yaml
# Nginx worker processes
worker_processes auto;
worker_connections 1024;

# MongoDB connection pooling
MONGODB_MAX_POOL_SIZE=50
MONGODB_MIN_POOL_SIZE=5

# Redis connection optimization  
REDIS_MAX_RETRIES_PER_REQUEST=3
REDIS_CONNECT_TIMEOUT=10000
```

### Caching Strategy
```typescript
// Static asset caching (Nginx)
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

// API response caching (Redis)
app.use('/api/books', cache('5 minutes'));
```

## 🔐 Security Certificate Management

### Let's Encrypt Setup (Production)
```bash
# Install certbot
apt-get update && apt-get install certbot python3-certbot-nginx

# Generate SSL certificate
certbot --nginx -d samorzad.elektryk.opole.pl

# Auto-renewal cron job
0 12 * * * /usr/bin/certbot renew --quiet
```

### Manual Certificate Update
```bash
# Copy new certificates
cp /etc/letsencrypt/live/samorzad.elektryk.opole.pl/fullchain.pem nginx/ssl/certificate.crt
cp /etc/letsencrypt/live/samorzad.elektryk.opole.pl/privkey.pem nginx/ssl/private.key

# Reload Nginx
docker-compose exec nginx nginx -s reload
```

## 📞 Support & Contact

### Production Contact
- **Email**: samorzad@elektryk.opole.pl
- **Emergency**: [Your emergency contact]
- **Documentation**: `/src/validators/README.md`

### Logging Locations
- **Application logs**: `./logs/app.log`
- **Nginx logs**: `./nginx/logs/access.log`, `./nginx/logs/error.log`
- **Security logs**: `./logs/security.log`
- **MongoDB logs**: `docker-compose logs mongodb`
- **Redis logs**: `docker-compose logs redis`

---

## 🏆 Deployment Achievements

✅ **Enterprise Security** - OWASP Top 10 protection  
✅ **Scalable Architecture** - Microservices with Docker  
✅ **Production Ready** - SSL, authentication, monitoring  
✅ **High Availability** - Health checks and auto-restart  
✅ **Performance Optimized** - Caching and connection pooling  
✅ **Maintainable** - Comprehensive logging and monitoring  
✅ **Compliant** - Data protection and security standards  

**Your SignumLBRI application is now ready for production deployment with maximum security protection! 🎉**
