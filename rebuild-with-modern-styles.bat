@echo off
echo Starting Docker Compose Build and Style Compilation...
cd /d "g:\Mój dysk\01_ZSEL\SUE\repos\SignumLBRI"

echo.
echo Stopping any existing containers...
docker-compose down

echo.
echo Building and starting containers...
docker-compose up --build -d

echo.
echo Waiting for containers to initialize...
timeout /t 10

echo.
echo Compiling modern SCSS styles...
docker-compose exec -T signumlbri npm run build-sass

echo.
echo Checking container status...
docker-compose ps

echo.
echo Testing application endpoint...
curl -I http://localhost:800/library

echo.
echo Docker environment is ready!
echo Application available at: http://localhost:800
