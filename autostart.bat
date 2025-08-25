@echo off
chcp 65001 >nul
title SignumLBRI - AUTO START
color 0A

echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║              SIGNUMLBRI AUTO START                   ║
echo ╚══════════════════════════════════════════════════════╝
echo.

echo 🔍 Automatyczne wykrywanie najlepszej opcji...
echo.

rem Test Docker
docker --version >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Docker znaleziony
    docker ps >nul 2>&1
    if %errorlevel%==0 (
        echo ✅ Docker daemon działa
        goto :docker_start
    ) else (
        echo ❌ Docker daemon nie działa
        goto :node_start
    )
) else (
    echo ❌ Docker nie znaleziony
    goto :node_start
)

:docker_start
echo.
echo 🐳 Uruchamiam z Docker...
echo.
echo Sprawdzanie czy porty są wolne...

netstat -an | findstr ":3000" >nul
if %errorlevel%==0 (
    echo ⚠️  Port 3000 zajęty! Zatrzymuję istniejące procesy...
    taskkill /f /im node.exe >nul 2>&1
    timeout 2 >nul
)

echo.
echo Czyżczenie starych kontenerów...
docker-compose -f docker-compose.local.yml down >nul 2>&1

echo.
echo Budowanie i uruchamianie...
docker-compose -f docker-compose.local.yml up --build -d

if %errorlevel%==0 (
    echo.
    echo 🎉 SUCCESS! Aplikacja powinna być dostępna na:
    echo    👉 http://localhost:3000
    echo.
    echo Otwieranie przeglądarki...
    timeout 3 >nul
    start http://localhost:3000
) else (
    echo.
    echo ❌ Błąd Docker! Próbuję Node.js...
    goto :node_start
)
goto :end

:node_start
echo.
echo 📦 Uruchamiam z Node.js...
echo.

rem Sprawdź Node.js
node --version >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Node.js dostępny
) else (
    echo ❌ Node.js nie znaleziony!
    echo    Pobierz i zainstaluj z: https://nodejs.org
    pause
    goto :end
)

rem Sprawdź npm
npm --version >nul 2>&1
if %errorlevel%==0 (
    echo ✅ npm dostępny
) else (
    echo ❌ npm nie znaleziony!
    pause
    goto :end
)

rem Sprawdź node_modules
if not exist "node_modules" (
    echo.
    echo 📦 Instaluję zależności...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Błąd instalacji npm!
        pause
        goto :end
    )
)

echo.
echo 🔨 Buduję aplikację...
npm run build
if %errorlevel% neq 0 (
    echo ⚠️  Problemy z budowaniem, ale kontynuuję...
)

echo.
echo 🚀 Uruchamiam serwer...

rem Zatrzymaj istniejące procesy
taskkill /f /im node.exe >nul 2>&1

rem Ustaw zmienne środowiskowe
set NODE_ENV=development
set PORT=3000

rem Uruchom z pliku .env.local
start "SignumLBRI Server" cmd /k "echo Serwer SignumLBRI działa na http://localhost:3000 && echo. && echo Aby zatrzymać naciśnij Ctrl+C && echo. && node dist/server.js"

echo.
echo 🎉 Serwer uruchamiany...
echo.
echo Czekam 5 sekund na uruchomienie...
timeout 5 >nul

echo Otwieranie przeglądarki...
start http://localhost:3000

goto :end

:end
echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║                       GOTOWE                         ║
echo ╚══════════════════════════════════════════════════════╝
echo.
echo 📊 Status aplikacji:
echo    URL: http://localhost:3000
echo    Logi: Sprawdź okno terminala "SignumLBRI Server"
echo.
echo 🛠️  Jeśli coś nie działa:
echo    • Uruchom diagnoza.bat dla szczegółów
echo    • Sprawdź http://localhost:3000 w przeglądarce
echo.
pause
