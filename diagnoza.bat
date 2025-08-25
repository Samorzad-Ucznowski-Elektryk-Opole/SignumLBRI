@echo off
chcp 65001 >nul
title SignumLBRI - Diagnoza Problemów
color 0E

echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║                 SIGNUMLBRI DIAGNOZA                  ║
echo ╚══════════════════════════════════════════════════════╝
echo.

echo [1/8] Sprawdzanie podstawowych narzędzi...
echo.

rem Sprawdź Docker
docker --version >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Docker: 
    docker --version
) else (
    echo ❌ Docker: Nie znaleziono lub nie działa
    echo    Rozwiązanie: Zainstaluj Docker Desktop
)

echo.

rem Sprawdź Docker Compose
docker-compose --version >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Docker Compose: 
    docker-compose --version
) else (
    echo ❌ Docker Compose: Nie znaleziono
)

echo.

rem Sprawdź Node.js
node --version >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Node.js: 
    node --version
) else (
    echo ❌ Node.js: Nie zainstalowany
    echo    Rozwiązanie: Zainstaluj Node.js z https://nodejs.org
)

echo.

rem Sprawdź npm
npm --version >nul 2>&1
if %errorlevel%==0 (
    echo ✅ npm: 
    npm --version
) else (
    echo ❌ npm: Nie dostępny
)

echo.
echo [2/8] Sprawdzanie plików konfiguracyjnych...
echo.

rem Sprawdź pliki
if exist "package.json" (
    echo ✅ package.json istnieje
) else (
    echo ❌ package.json nie istnieje
)

if exist "docker-compose.local.yml" (
    echo ✅ docker-compose.local.yml istnieje
) else (
    echo ❌ docker-compose.local.yml nie istnieje
)

if exist ".env.local" (
    echo ✅ .env.local istnieje
) else (
    echo ❌ .env.local nie istnieje
)

if exist "Dockerfile.debug" (
    echo ✅ Dockerfile.debug istnieje
) else (
    echo ❌ Dockerfile.debug nie istnieje
)

echo.
echo [3/8] Sprawdzanie zajętych portów...
echo.

netstat -an | findstr ":3000" >nul
if %errorlevel%==0 (
    echo ⚠️  Port 3000: ZAJĘTY
    echo    Rozwiązanie: Zamknij aplikację używającą tego portu
) else (
    echo ✅ Port 3000: Wolny
)

netstat -an | findstr ":27017" >nul
if %errorlevel%==0 (
    echo ⚠️  Port 27017: ZAJĘTY (prawdopodobnie MongoDB)
    echo    To może być OK jeśli MongoDB już działa
) else (
    echo ✅ Port 27017: Wolny
)

echo.
echo [4/8] Sprawdzanie Docker...
echo.

docker ps >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Docker daemon działa
    echo.
    echo Aktywne kontenery:
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
) else (
    echo ❌ Docker daemon nie działa
    echo    Rozwiązanie: Uruchom Docker Desktop
)

echo.
echo [5/8] Test połączenia MongoDB...
echo.

rem Sprawdź czy MongoDB jest dostępny
ping -n 1 127.0.0.1 >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Localhost dostępny
) else (
    echo ❌ Problem z localhost
)

echo.
echo [6/8] Sprawdzanie zależności Node.js...
echo.

if exist "node_modules" (
    echo ✅ Katalog node_modules istnieje
) else (
    echo ❌ Katalog node_modules nie istnieje
    echo    Rozwiązanie: Uruchom 'npm install'
)

echo.
echo [7/8] Próba kompilacji TypeScript...
echo.

if exist "node_modules" (
    npm run build >nul 2>&1
    if %errorlevel%==0 (
        echo ✅ TypeScript kompiluje się poprawnie
    ) else (
        echo ⚠️  Problemy z kompilacją TypeScript
        echo    Uruchom 'npm run build' żeby zobaczyć błędy
    )
) else (
    echo ⏭️  Pominięto - brak node_modules
)

echo.
echo [8/8] Podsumowanie i rekomendacje...
echo.

echo ╔══════════════════════════════════════════════════════╗
echo ║                     REKOMENDACJE                     ║
echo ╚══════════════════════════════════════════════════════╝
echo.

rem Rekomendacje na podstawie testów
docker --version >nul 2>&1
if %errorlevel%==0 (
    echo 🎯 ZALECANA ŚCIEŻKA: Docker
    echo    1. Uruchom: docker-compose -f docker-compose.local.yml up
    echo    2. Otwórz: http://localhost:3000
) else (
    echo 🎯 ZALECANA ŚCIEŻKA: Node.js (bez Docker)
    echo    1. Uruchom: npm install
    echo    2. Uruchom: npm run dev
    echo    3. Otwórz: http://localhost:3000
)

echo.
echo 📋 NASTĘPNE KROKI:
echo.
echo A) Jeśli Docker działa:
echo    • start-local.bat
echo.
echo B) Jeśli Docker nie działa:
echo    • start-local-nodejs.bat
echo.
echo C) Jeśli nic nie działa:
echo    • npm install
echo    • npm run dev
echo.

echo.
pause
