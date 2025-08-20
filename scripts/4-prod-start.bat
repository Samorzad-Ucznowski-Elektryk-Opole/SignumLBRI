@echo off
echo ========================================
echo    Uruchamianie w trybie produkcyjnym
echo ========================================
echo.

echo Sprawdzanie Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo BŁĄD: Docker jest wymagany do uruchomienia produkcyjnego!
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
    echo UWAGA: Musisz edytować plik .env i ustawić właściwe hasła!
    echo Otwórz plik .env i zmień wszystkie hasła.
    echo.
    set /p choice="Kontynuować z domyślnymi ustawieniami? (NIEZALECANE) (y/n): "
    if /i "%choice%" neq "y" (
        echo Edytuj plik .env i uruchom ponownie.
        pause
        exit /b 1
    )
)

echo.
echo Generowanie certyfikatów SSL...
if not exist "ssl\server.crt" (
    call npm run ssl:generate
)

echo.
echo Uruchamianie aplikacji produkcyjnej...
echo.
echo Porty aplikacji:
echo   HTTP:  http://localhost:8080
echo   HTTPS: https://localhost:8443
echo.
echo Dodatkowe usługi:
echo   Email:     http://localhost:8025 (MailHog)
echo   Database:  http://localhost:8081 (Adminer)
echo   Redis:     http://localhost:8082 (Redis Commander)
echo.
docker-compose up --build -d

echo.
echo ========================================
echo    Aplikacja została uruchomiona! 🚀
echo ========================================
echo.
echo Sprawdź logi: npm run logs:all
echo Zatrzymaj:    docker-compose down
echo.
pause
