@echo off
echo ========================================
echo    Installing Dependencies...
echo ========================================
echo.

echo Sprawdzanie Node.js...
node --version
if %errorlevel% neq 0 (
    echo BŁĄD: Node.js nie jest zainstalowany!
    echo Uruchom najpierw: 1-install-nodejs.bat
    pause
    exit /b 1
)

npm --version
if %errorlevel% neq 0 (
    echo BŁĄD: npm nie jest zainstalowany!
    echo Uruchom najpierw: 1-install-nodejs.bat
    pause
    exit /b 1
)

echo.
echo Node.js i npm są zainstalowane! ✓
echo.
echo Instalowanie zależności...
npm install

if %errorlevel% neq 0 (
    echo.
    echo BŁĄD: Instalacja nie powiodła się!
    echo Sprawdź połączenie internetowe i spróbuj ponownie.
    pause
    exit /b 1
)

echo.
echo ========================================
echo    Instalacja zakończona pomyślnie! ✓
echo ========================================
echo.
echo Teraz możesz uruchomić:
echo   3-dev-start.bat       (rozwój)
echo   4-prod-start.bat      (produkcja)
echo.
pause
