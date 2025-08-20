@echo off
echo ========================================
echo    SignumLBRI 2025 - Docker Only Start
echo ========================================
echo.
echo UWAGA: Ta opcja uruchamia aplikację BEZ instalacji Node.js
echo Aplikacja zostanie uruchomiona w kontenerach Docker
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

echo Sprawdzanie pliku .env...
if not exist ".env" (
    echo Kopiowanie przykładowej konfiguracji...
    copy ".env.example" ".env"
    echo.
    echo Plik .env został utworzony z domyślnymi ustawieniami.
)

echo.
echo Budowanie i uruchamianie aplikacji...
echo.
echo Porty aplikacji:
echo   HTTP:  http://localhost:8080  (Twój wymagany port!)
echo   HTTPS: https://localhost:8443 (Twój wymagany port!)
echo.
echo Dodatkowe usługi:
echo   Email:     http://localhost:8025 (MailHog)
echo   Database:  http://localhost:8081 (Adminer)
echo   Redis:     http://localhost:8082 (Redis Commander)
echo.

docker-compose up --build -d

if %errorlevel% neq 0 (
    echo.
    echo BŁĄD: Nie udało się uruchomić aplikacji!
    echo Sprawdź logi: docker-compose logs
    pause
    exit /b 1
)

echo.
echo ========================================
echo    Aplikacja uruchomiona pomyślnie! 🚀
echo ========================================
echo.
echo Sprawdź aplikację: http://localhost:8080
echo Bezpieczna wersja:  https://localhost:8443
echo.
echo Użyteczne komendy:
echo   docker-compose logs -f     (zobacz logi)
echo   docker-compose down        (zatrzymaj)
echo   docker-compose ps          (status)
echo.
pause
