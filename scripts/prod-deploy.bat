@echo off
REM SignumLBRI Production Deployment Script - 2025 Edition
REM Deploy to production with all optimizations and security features

echo.
echo ==========================================
echo   SignumLBRI 2025 - Production Deployment
echo ==========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running! Please start Docker Desktop first.
    pause
    exit /b 1
)

echo ✅ Docker is running

REM Check environment variables
if "%SESSION_SECRET%"=="" (
    echo ⚠️  Warning: SESSION_SECRET not set in environment
    set /p SESSION_SECRET=Enter session secret: 
)

if "%JWT_SECRET%"=="" (
    echo ⚠️  Warning: JWT_SECRET not set in environment
    set /p JWT_SECRET=Enter JWT secret: 
)

REM Build and deploy
echo 🔨 Building production images...
docker-compose build --no-cache

echo 🚀 Starting production deployment...
docker-compose up -d

echo.
echo ✅ Deployment started! Services starting up...
echo.
echo 🌐 Production access points:
echo    http://localhost:8080   - Main application (HTTP)
echo    https://localhost:8443  - Main application (HTTPS)
echo.
echo 📊 Monitoring:
echo    docker-compose logs -f  - View all logs
echo    docker-compose ps       - Check service status
echo.
echo 🛑 To stop production:
echo    npm run prod:docker:down
echo.

REM Wait for services to be healthy
echo Waiting for services to be ready...
timeout /t 30 /nobreak > nul

REM Check health
curl -f http://localhost:8080/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Application is healthy and ready!
) else (
    echo ⚠️  Application may still be starting up
    echo    Check logs with: docker-compose logs -f
)

echo.
echo Production deployment complete!
pause
