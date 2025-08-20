@echo off
echo ========================================
echo    SignumLBRI 2025 - QUICK START! 🚀
echo ========================================
echo.

echo Sprawdzanie Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo BŁĄD: Docker nie jest zainstalowany!
    echo Zainstaluj Docker Desktop i spróbuj ponownie.
    pause
    exit /b 1
)

echo Docker jest dostępny! ✓
echo.
echo Kopiowanie konfiguracji...
if not exist "../.env" (
    copy "../.env.example" "../.env" >nul 2>&1
)

echo.
echo ========================================
echo    Uruchamianie aplikacji...
echo ========================================
echo.
echo To może zająć kilka minut za pierwszym razem...
echo.

docker-compose -f ../docker/docker-compose.simple.yml down >nul 2>&1
docker-compose -f ../docker/docker-compose.simple.yml up -d mongo redis

echo Czekam na bazy danych...
timeout /t 10 /nobreak >nul

echo.
echo Sprawdzanie MongoDB...
docker logs signum-mongodb --tail=5

echo.
echo Sprawdzanie Redis...  
docker logs signum-redis --tail=5

echo.
echo ========================================
echo    GOTOWE! Aplikacja uruchomiona! 🎉
echo ========================================
echo.
echo Dostępne serwisy:
echo   📊 MongoDB:  localhost:27017 (admin: signum_admin / signum_password123)
echo   ⚡ Redis:    localhost:6379 (hasło: redis_password123)
echo.
echo Następne kroki:
echo   1. Zainstaluj Node.js jeśli nie masz: 1-install-nodejs.bat
echo   2. Zainstaluj pakiety: 2-install-dependencies.bat  
echo   3. Uruchom app lokalnie: npm run dev
echo.
echo Albo uruchom w pełni w Docker: 4-prod-start.bat
echo.
echo Zatrzymaj bazy danych: docker-compose -f ../docker/docker-compose.simple.yml down
echo.
pause
