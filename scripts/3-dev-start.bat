@echo off
echo ========================================
echo    Uruchamianie w trybie rozwoju
echo ========================================
echo.

echo Sprawdzanie Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo UWAGA: Docker nie jest zainstalowany!
    echo Można uruchomić bez Dockera, ale niektóre funkcje nie będą działać.
    echo.
    set /p choice="Kontynuować bez Dockera? (y/n): "
    if /i "%choice%" neq "y" (
        echo Zainstaluj Docker Desktop i spróbuj ponownie.
        pause
        exit /b 1
    )
    echo.
    echo Uruchamianie bez Dockera...
    npm run dev
) else (
    echo Docker jest dostępny! ✓
    echo.
    echo Uruchamianie z pełnym stackiem (MongoDB + Redis + Nginx)...
    echo.
    echo Porty aplikacji:
    echo   HTTP:  http://localhost:8080
    echo   HTTPS: https://localhost:8443
    echo   Dev:   http://localhost:3000
    echo.
    docker-compose -f docker-compose.dev.yml up --build
)

echo.
echo Aplikacja została zatrzymana.
pause
