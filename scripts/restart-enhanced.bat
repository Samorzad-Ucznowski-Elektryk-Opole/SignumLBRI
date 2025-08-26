@echo off
REM SignumLBRI Enhanced - Restart Script
REM Szybki restart aplikacji z pełnym przebudowaniem kontenerów

echo 🔄 Restarting SignumLBRI Enhanced Application...
echo ===============================================

REM Stop existing containers
echo 🛑 Stopping containers...
docker-compose down 2>nul

REM Remove specific application container and image to force rebuild
echo 🗑️ Removing application container and image...
docker rm -f signumlbri-enhanced 2>nul
docker rmi signumlbri_signumlbri-enhanced 2>nul
docker rmi signumlbri-enhanced 2>nul

REM Build and start
echo 🔨 Building and starting application...
docker-compose up --build -d

REM Wait a moment for startup
echo ⏳ Waiting for application startup...
timeout /t 3 /nobreak > nul

REM Check container status
echo 📊 Container Status:
docker-compose ps

REM Check logs briefly
echo 📋 Recent logs:
docker-compose logs --tail=10

echo.
echo ✅ Quick restart completed!
echo 🌐 Application: http://localhost:4000
echo 🏥 Health: http://localhost:4000/health
echo 📊 Stats: http://localhost:4000/stats
echo.
echo 💡 To see live logs run: docker-compose logs -f
echo 💡 To stop everything run: docker-compose down
echo.

REM Show continuous logs
echo.
echo 📺 Showing live logs (Ctrl+C to exit)...
docker-compose logs -f
