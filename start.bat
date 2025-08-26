@echo off
chcp 65001 >nul
cls
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                    🚀 SignumLBRI Enhanced START 🚀                         ║
echo ╚══════════════════════════════════════════════════════════════════════════════╝
echo.
echo 🎯 MINIMALNE REPOZYTORIUM - tylko Enhanced!
echo.

REM Sprawdź Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js NIE JEST zainstalowany!
    echo.
    echo 📥 Pobierz Node.js z: https://nodejs.org/
    echo 🔄 Uruchom ponownie po instalacji
    start https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js dostępny
echo.

REM Sprawdź zależności
if not exist "node_modules" (
    echo 📦 Instalowanie zależności...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Błąd instalacji
        pause
        exit /b 1
    )
)

echo ✅ Zależności gotowe
echo.
echo 🚀 Uruchamianie Enhanced...
echo.
echo ┌─────────────────────────────────────────────────────┐
echo │  🌐 Enhanced: http://localhost:4000/enhanced       │
echo │  🛑 Stop: Ctrl+C                                   │
echo └─────────────────────────────────────────────────────┘
echo.

timeout /t 2 >nul
node enhanced-app.js
