@echo off
REM Quick restart script for SignumLBRI TypeScript version

echo 🔄 Restarting SignumLBRI Application...
echo ===============================================

REM Stop existing containers
echo 🛑 Stopping containers...
docker compose down

REM Rebuild and start
echo 🔨 Building and starting application...
docker compose up --build -d

echo 📋 Checking container status...
docker compose ps

echo 📊 Checking logs...
docker compose logs app --tail 10

echo ✅ Application should now be available at http://localhost/
echo 🏥 Health check: http://localhost/health
pause
