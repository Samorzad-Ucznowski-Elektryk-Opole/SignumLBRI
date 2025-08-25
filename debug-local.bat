@echo off
echo =========================================
echo  SignumLBRI - Debug lokalnego srodowiska
echo =========================================
echo.

echo [1/8] Sprawdzanie obecnego katalogu...
cd
echo.

echo [2/8] Sprawdzanie czy Docker Desktop jest uruchomiony...
docker --version
if %ERRORLEVEL% NEQ 0 (
    echo BLAD: Docker Desktop nie jest uruchomiony lub nie jest zainstalowany
    echo Uruchom Docker Desktop i sprobuj ponownie
    goto :end
)
echo Docker jest dostepny
echo.

echo [3/8] Sprawdzanie obecnych kontenerow...
docker ps -a
echo.

echo [4/8] Sprawdzanie obrazow Docker...
docker images | findstr signumlbri
echo.

echo [5/8] Sprawdzanie plikow konfiguracyjnych...
if exist docker-compose.local.yml (
    echo OK: docker-compose.local.yml istnieje
) else (
    echo BLAD: docker-compose.local.yml nie istnieje
)

if exist Dockerfile.debug (
    echo OK: Dockerfile.debug istnieje
) else (
    echo BLAD: Dockerfile.debug nie istnieje
)

if exist .env (
    echo OK: .env istnieje
) else (
    echo OSTRZEZENIE: .env nie istnieje
)
echo.

echo [6/8] Sprawdzanie portow...
netstat -an | findstr :3000 || echo Port 3000 jest wolny
netstat -an | findstr :27017 || echo Port 27017 jest wolny
echo.

echo [7/8] Sprawdzanie katalogu data...
if exist data (
    echo Katalog data istnieje - usuwam stare dane MongoDB...
    rmdir /s /q data
    echo Stare dane usuniete
) else (
    echo Katalog data nie istnieje - to jest OK dla czystego startu
)
echo.

echo [8/8] Testowe uruchomienie docker-compose...
docker-compose -f docker-compose.local.yml config
if %ERRORLEVEL% NEQ 0 (
    echo BLAD: Problem z konfiguracja docker-compose.local.yml
    goto :end
)
echo Konfiguracja docker-compose jest poprawna
echo.

echo =========================================
echo  Diagnostyka zakonczona
echo =========================================
echo.

:ask_start
set /p choice="Czy chcesz uruchomic aplikacje teraz? (y/n): "
if /i "%choice%"=="y" (
    echo.
    echo Uruchamianie aplikacji...
    docker-compose -f docker-compose.local.yml up --build
) else if /i "%choice%"=="n" (
    echo Aplikacja nie zostala uruchomiona
) else (
    echo Nieprawidlowa opcja. Wprowadz 'y' lub 'n'
    goto :ask_start
)

:end
echo.
pause
