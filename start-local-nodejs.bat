@echo off
echo =========================================
echo  SignumLBRI - Lokalne uruchomienie bez Docker
echo =========================================
echo.

echo Sprawdzanie Node.js...
node --version
if %ERRORLEVEL% NEQ 0 (
    echo BLAD: Node.js nie jest zainstalowany
    echo Pobierz i zainstaluj Node.js z https://nodejs.org
    goto :end
)
echo.

echo Sprawdzanie npm...
npm --version
if %ERRORLEVEL% NEQ 0 (
    echo BLAD: npm nie jest dostepny
    goto :end
)
echo.

echo Sprawdzanie MongoDB (opcjonalne - mozna uzyc MongoDB Atlas)...
mongod --version 2>nul
if %ERRORLEVEL% EQU 0 (
    echo MongoDB jest zainstalowany lokalnie
) else (
    echo MongoDB nie jest zainstalowany lokalnie
    echo Mozesz uzyc MongoDB Atlas lub zainstalowac lokalnie
)
echo.

echo Sprawdzanie zaleznosci npm...
if exist package.json (
    echo Instalowanie zaleznosci...
    npm install
    if %ERRORLEVEL% NEQ 0 (
        echo BLAD: Nie udalo sie zainstalowac zaleznosci
        goto :end
    )
) else (
    echo BLAD: package.json nie istnieje
    goto :end
)
echo.

echo Budowanie aplikacji...
npm run build
if %ERRORLEVEL% NEQ 0 (
    echo BLAD: Nie udalo sie zbudowac aplikacji
    goto :end
)
echo.

echo =========================================
echo  Aplikacja gotowa do uruchomienia
echo =========================================
echo.

set /p choice="Czy chcesz uruchomic aplikacje teraz? (y/n): "
if /i "%choice%"=="y" (
    echo.
    echo Uruchamianie aplikacji...
    echo Aplikacja bedzie dostepna na http://localhost:3000
    echo Aby zatrzymac, nacisnij Ctrl+C
    echo.
    npm run watch
) else (
    echo Aplikacja nie zostala uruchomiona
    echo Aby uruchomic recznie, uzyj: npm run watch
)

:end
echo.
pause
