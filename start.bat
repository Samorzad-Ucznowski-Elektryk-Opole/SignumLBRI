@echo off
echo ========================================
echo    SignumLBRI 2025 - LAUNCHER 🚀
echo ========================================
echo.
echo Wybierz opcję:
echo.
echo 1. Quick Start (bazy danych + lokalna app)
echo 2. Zainstaluj Node.js
echo 3. Zainstaluj pakiety
echo 4. Uruchom development
echo 5. Uruchom production
echo 6. Docker only start
echo 0. Wyjście
echo.
set /p choice="Wybierz (0-6): "

if "%choice%"=="1" (
    call scripts\QUICK-START.bat
) else if "%choice%"=="2" (
    call scripts\1-install-nodejs.bat
) else if "%choice%"=="3" (
    call scripts\2-install-dependencies.bat
) else if "%choice%"=="4" (
    call scripts\3-dev-start.bat
) else if "%choice%"=="5" (
    call scripts\4-prod-start.bat
) else if "%choice%"=="6" (
    call scripts\DOCKER-ONLY-START.bat
) else if "%choice%"=="0" (
    exit /b 0
) else (
    echo Nieprawidłowy wybór!
    pause
    goto :eof
)

pause
