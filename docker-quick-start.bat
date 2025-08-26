@echo off
chcp 65001 >nul
cls

echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║            🐳 SignumLBRI Enhanced - Quick Docker Start 🐳                  ║
echo ╚══════════════════════════════════════════════════════════════════════════════╝
echo.

echo 🔍 Sprawdzanie Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker nie jest zainstalowany!
    echo 📥 Zainstaluj Docker Desktop: https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)

echo ✅ Docker dostępny:
docker --version
echo.

echo 🔧 Sprawdzanie plików...
if not exist "enhanced-app.js" (
    echo ❌ Brak pliku enhanced-app.js
    pause
    exit /b 1
)

if not exist "Dockerfile.enhanced" (
    echo ❌ Brak pliku Dockerfile.enhanced
    pause
    exit /b 1
)

echo ✅ Wszystkie pliki dostępne
echo.

echo 🛑 Zatrzymywanie starych kontenerów...
docker-compose -f docker-compose-minimal.yml down 2>nul
docker stop signumlbri-enhanced 2>nul
docker rm signumlbri-enhanced 2>nul
echo.

echo 🏗️  Budowanie Enhanced obrazu...
docker-compose -f docker-compose-minimal.yml build

if %errorlevel% neq 0 (
    echo ❌ Błąd podczas budowania
    pause
    exit /b 1
)

echo.
echo ✅ Obraz zbudowany!
echo.

echo 🚀 Uruchamianie Enhanced...
docker-compose -f docker-compose-minimal.yml up -d

if %errorlevel% neq 0 (
    echo ❌ Błąd podczas uruchamiania
    pause
    exit /b 1
)

echo.
echo ⏰ Czekam na uruchomienie...
timeout /t 10 >nul

echo.
echo 🔍 Status kontenera:
docker ps | findstr signumlbri-enhanced

echo.
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                   🎉 ENHANCED DZIAŁA W DOCKER! 🎉                         ║
echo ╚══════════════════════════════════════════════════════════════════════════════╝
echo.
echo 🌐 Aplikacja dostępna:
echo    👉 http://localhost:4000/enhanced
echo.
echo 🛠️  Przydatne komendy:
echo    📜 Logi: docker logs signumlbri-enhanced -f
echo    🛑 Stop: docker-compose -f docker-compose-minimal.yml down
echo    🔄 Restart: docker restart signumlbri-enhanced
echo.

set /p open="🌐 Otworzyć Enhanced? (T/N): "
if /i "%open%"=="T" (
    start http://localhost:4000/enhanced
) else if /i "%open%"=="t" (
    start http://localhost:4000/enhanced
)

echo.
echo 🎯 Enhanced działa w Docker!
pause
