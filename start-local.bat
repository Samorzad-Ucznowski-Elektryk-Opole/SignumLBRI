@echo off
echo =========================================
echo  SignumLBRI - Lokalne srodowisko testowe
echo =========================================
echo.
echo Uruchamianie aplikacji lokalnie...
echo.

echo Zatrzymywanie istniejacych kontenerow...
docker-compose -f docker-compose.local.yml down

echo.
echo Budowanie i uruchamianie kontenerow...
docker-compose -f docker-compose.local.yml up --build

echo.
echo Aplikacja uruchomiona!
echo Adres: http://localhost:3000
echo MongoDB: localhost:27017
echo Debug port: 9229
echo.
echo Aby zatrzymac aplikacje, nacisnij Ctrl+C
pause
