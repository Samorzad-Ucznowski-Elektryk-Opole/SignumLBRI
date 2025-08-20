@echo off
REM SignumLBRI Ultimate Development Setup - 2025 Edition
REM Quick setup script for Windows development environment

echo.
echo ========================================
echo   SignumLBRI 2025 - Development Setup
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running! Please start Docker Desktop first.
    pause
    exit /b 1
)

echo ✅ Docker is running

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed! Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo ✅ Node.js is available

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
) else (
    echo ✅ Dependencies already installed
)

REM Generate SSL certificates if needed
if not exist "ssl\cert.crt" (
    echo 🔐 Generating SSL certificates...
    mkdir ssl 2>nul
    docker run --rm -v "%cd%\ssl":/certs alpine/openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /certs/cert.key -out /certs/cert.crt -subj "/C=PL/ST=Opolskie/L=Opole/O=ZSEL/OU=SignumLBRI/CN=localhost"
    if %errorlevel% neq 0 (
        echo ⚠️  Could not generate SSL certificates automatically
        echo    You can generate them manually later using: npm run ssl:generate
    ) else (
        echo ✅ SSL certificates generated
    )
) else (
    echo ✅ SSL certificates exist
)

REM Create required directories
mkdir data-dev 2>nul
mkdir logs-dev 2>nul
mkdir redis-data-dev 2>nul
mkdir elasticsearch-data-dev 2>nul
echo ✅ Created required directories

echo.
echo 🚀 Setup complete! You can now start development with:
echo.
echo    npm run dev:docker     - Start full development environment
echo    npm run dev            - Start local development (requires local DB)
echo.
echo 🌐 Access points after startup:
echo    http://localhost:8080   - Main application (HTTP)
echo    https://localhost:8443  - Main application (HTTPS)
echo    http://localhost:3000   - Direct app access
echo    http://localhost:8025   - Email testing (MailHog)
echo    http://localhost:8081   - Database admin (Adminer)
echo    http://localhost:8082   - Redis admin
echo    http://localhost:9200   - Elasticsearch
echo.
echo Press any key to start development environment...
pause

REM Start development environment
echo Starting development environment...
npm run dev:docker
