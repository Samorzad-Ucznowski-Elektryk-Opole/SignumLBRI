@echo off
REM Quick Docker Restart for SignumLBRI Enhanced

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

REM Wait and check health
echo ⏳ Waiting for application to start...
timeout /t 15 /nobreak >nul

echo 📊 Checking application status...
docker-compose ps

echo 🏥 Testing health endpoint...
for /l %%i in (1,1,10) do (
    curl -f http://localhost:4000/health >nul 2>&1
    if not errorlevel 1 (
        echo ✅ Application is healthy!
        goto success
    )
    echo Attempt %%i/10...
    timeout /t 3 /nobreak >nul
)

echo ❌ Application health check failed
echo 📋 Recent logs:
docker-compose logs --tail=20 signumlbri-enhanced
pause
exit /b 1

:success
echo.
echo 🎉 Application restarted successfully!
echo 🌐 Available at: http://localhost:4000/enhanced
echo.
echo Opening application in browser...
start http://localhost:4000/enhanced
