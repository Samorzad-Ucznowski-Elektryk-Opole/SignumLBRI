@echo off
echo =========================================
echo  SignumLBRI - Zatrzymywanie aplikacji
echo =========================================
echo.
echo Zatrzymywanie kontenerow...
docker-compose -f docker-compose.local.yml down

echo.
echo Usuwanie obrazow (opcjonalne)...
set /p choice="Czy chcesz usunac obrazy Docker? (y/n): "
if /i "%choice%"=="y" (
    docker-compose -f docker-compose.local.yml down --rmi all --volumes
    echo Obrazy usuniete.
) else (
    echo Obrazy pozostawione.
)

echo.
echo Aplikacja zatrzymana.
pause
