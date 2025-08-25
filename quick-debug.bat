@echo off
title SignumLBRI - Quick Debug
color 0A

echo.
echo   ███████╗██╗ ██████╗ ███╗   ███╗██╗   ██╗███╗   ███╗
echo   ██╔════╝██║██╔════╝ ████╗ ████║██║   ██║████╗ ████║
echo   ███████╗██║██║  ███╗██╔████╔██║██║   ██║██╔████╔██║
echo   ╚════██║██║██║   ██║██║╚██╔╝██║██║   ██║██║╚██╔╝██║
echo   ███████║██║╚██████╔╝██║ ╚═╝ ██║╚██████╔╝██║ ╚═╝ ██║
echo   ╚══════╝╚═╝ ╚═════╝ ╚═╝     ╚═╝ ╚═════╝ ╚═╝     ╚═╝
echo.
echo                LBRI - Quick Debug Menu
echo   ================================================
echo.
echo   1. Debuguj z Docker (zalecane)
echo   2. Debuguj z Node.js (bez Dockera)
echo   3. Sprawdz tylko konfiguracje
echo   4. Wyjscie
echo.
set /p choice="Wybierz opcje (1-4): "

if "%choice%"=="1" goto docker_debug
if "%choice%"=="2" goto nodejs_debug  
if "%choice%"=="3" goto config_check
if "%choice%"=="4" goto end

echo Nieprawidlowa opcja. Sprobuj ponownie.
timeout 2 > nul
cls
goto start

:docker_debug
echo.
echo Uruchamianie debugowania Docker...
call debug-local.bat
goto end

:nodejs_debug
echo.
echo Uruchamianie debugowania Node.js...
call start-local-nodejs.bat
goto end

:config_check
echo.
echo Sprawdzanie konfiguracji...
echo.
echo [Pliki konfiguracyjne:]
dir *.yml *.json .env* 2>nul
echo.
echo [Porty:]
netstat -an | findstr ":3000\|:27017" || echo Porty 3000 i 27017 sa wolne
echo.
echo [Docker status:]
docker --version 2>nul || echo Docker nie jest dostepny
echo.
echo [Node.js status:]
node --version 2>nul || echo Node.js nie jest dostepny
npm --version 2>nul || echo npm nie jest dostepny
echo.
pause
goto end

:start
cls
goto menu

:menu
echo.
echo   ███████╗██╗ ██████╗ ███╗   ███╗██╗   ██╗███╗   ███╗
echo   ██╔════╝██║██╔════╝ ████╗ ████║██║   ██║████╗ ████║
echo   ███████╗██║██║  ███╗██╔████╔██║██║   ██║██╔████╔██║
echo   ╚════██║██║██║   ██║██║╚██╔╝██║██║   ██║██║╚██╔╝██║
echo   ███████║██║╚██████╔╝██║ ╚═╝ ██║╚██████╔╝██║ ╚═╝ ██║
echo   ╚══════╝╚═╝ ╚═════╝ ╚═╝     ╚═╝ ╚═════╝ ╚═╝     ╚═╝
echo.
echo                LBRI - Quick Debug Menu
echo   ================================================
echo.
echo   1. Debuguj z Docker (zalecane)
echo   2. Debuguj z Node.js (bez Dockera)
echo   3. Sprawdz tylko konfiguracje
echo   4. Wyjscie
echo.
set /p choice="Wybierz opcje (1-4): "

if "%choice%"=="1" goto docker_debug
if "%choice%"=="2" goto nodejs_debug  
if "%choice%"=="3" goto config_check
if "%choice%"=="4" goto end

echo Nieprawidlowa opcja. Sprobuj ponownie.
timeout 2 > nul
cls
goto menu

:end
echo.
echo Dziekuje za korzystanie z SignumLBRI Debug!
timeout 2 > nul
