@echo off
chcp 65001 >nul
cls
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                    🚀 SignumLBRI Enhanced START 🚀                         ║
echo ╚══════════════════════════════════════════════════════════════════════════════╝
echo.
echo 🎯 MINIMALNE REPOZYTORIUM - tylko Enhanced!
echo.

REM Ustawia kolor konsolki Windows na ciemnoniebiesko-szary
color 17

echo.
echo 🔍 Sprawdzanie statusu Docker Desktop...
echo.

REM Sprawdź czy Docker Desktop działa
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker nie jest dostępny. Uruchom Docker Desktop.
    echo.
    echo 💡 Wskazówki:
    echo    1. Upewnij się, że Docker Desktop jest zainstalowany
    echo    2. Uruchom Docker Desktop
    echo    3. Zaczekaj aż całkowicie się załaduje
    echo    4. Spróbuj ponownie
    echo.
    pause
    exit /b 1
)

echo ✅ Docker jest dostępny
echo.

echo 🛠️  Zatrzymywanie poprzednich instancji...
docker-compose down --remove-orphans >nul 2>&1

echo 🏗️  Budowanie i uruchamianie kontenerów...
echo.
docker-compose up --build -d

if errorlevel 1 (
    echo ❌ Błąd podczas uruchamiania kontenerów
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Kontenery uruchomione pomyślnie!
echo.
echo 📊 Status kontenerów:
docker-compose ps
echo.
echo 🌐 Aplikacja dostępna pod adresem: http://localhost:4000
echo 🏥 Health check: http://localhost:4000/health
echo 📈 Statystyki: http://localhost:4000/stats
echo.
pause
