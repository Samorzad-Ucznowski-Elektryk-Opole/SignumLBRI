@echo off
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║              🐳 SignumLBRI Enhanced - Docker Launch 🐳                     ║
echo ╚══════════════════════════════════════════════════════════════════════════════╝
echo.

REM Sprawdź Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker nie jest dostępny!
    echo.
    echo 🔄 Próbuję uruchomić bez Docker...
    call run-enhanced.bat
    exit /b %errorlevel%
)

echo ✅ Docker dostępny
echo.

REM Sprawdź pliki
if not exist "enhanced-app.js" (
    echo ❌ Brak enhanced-app.js
    pause
    exit /b 1
)

if not exist "Dockerfile.enhanced" (
    echo ❌ Brak Dockerfile.enhanced
    pause
    exit /b 1
)

if not exist "docker-compose-minimal.yml" (
    echo ❌ Brak docker-compose-minimal.yml
    pause
    exit /b 1
)

echo 🛑 Zatrzymywanie starych kontenerów...
docker stop signumlbri-enhanced 2>nul
docker rm signumlbri-enhanced 2>nul

echo.
echo 🏗️ Budowanie obrazu Enhanced...
docker build -f Dockerfile.enhanced -t signumlbri-enhanced .

if %errorlevel% neq 0 (
    echo ❌ Błąd budowania obrazu
    echo.
    echo 🔄 Próbuję uruchomić bez Docker...
    call run-enhanced.bat
    exit /b %errorlevel%
)

echo.
echo 🚀 Uruchamianie kontenera...
docker run -d -p 4000:4000 --name signumlbri-enhanced signumlbri-enhanced

if %errorlevel% neq 0 (
    echo ❌ Błąd uruchamiania kontenera
    echo.
    echo 🔄 Próbuję uruchomić bez Docker...
    call run-enhanced.bat
    exit /b %errorlevel%
)

echo.
echo ⏰ Czekam na uruchomienie...
timeout /t 10 >nul

echo.
echo ✅ Enhanced działa w Docker!
echo 🌐 Aplikacja: http://localhost:4000/enhanced
echo.

set /p open="🌐 Otworzyć Enhanced? (T/N): "
if /i "%open%"=="T" start http://localhost:4000/enhanced

echo.
echo 🎯 Enhanced działa w kontenerze!
echo 📜 Logi: docker logs signumlbri-enhanced -f
echo 🛑 Stop: docker stop signumlbri-enhanced
pause
