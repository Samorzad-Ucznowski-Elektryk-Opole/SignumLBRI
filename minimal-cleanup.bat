@echo off
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║              🧹 SignumLBRI - Czyszczenie MINIMALNE 🧹                      ║
echo ╚══════════════════════════════════════════════════════════════════════════════╝
echo.
echo 🚀 Czyszczenie do absolutnego minimum...
echo.

REM Usuń wszystko poza Enhanced
echo 🗑️ Usuwanie nieużywanych plików...
if exist ".aavscode" rmdir /s /q ".aavscode" && echo ✅ Usunięto .aavscode
if exist ".eslintignore" del ".eslintignore" && echo ✅ Usunięto .eslintignore
if exist ".eslintrc" del ".eslintrc" && echo ✅ Usunięto .eslintrc
if exist ".travis.yml" del ".travis.yml" && echo ✅ Usunięto .travis.yml
if exist "copyStaticAssets.ts" del "copyStaticAssets.ts" && echo ✅ Usunięto copyStaticAssets.ts
if exist "tsconfig.json" del "tsconfig.json" && echo ✅ Usunięto tsconfig.json
if exist "webpack.config.js" del "webpack.config.js" && echo ✅ Usunięto webpack.config.js
if exist "example_books.csv" del "example_books.csv" && echo ✅ Usunięto example_books.csv
if exist "jest.config.js" del "jest.config.js" && echo ✅ Usunięto jest.config.js

echo.
echo 🗑️ Usuwanie nieużywanych folderów...
if exist "test_data" rmdir /s /q "test_data" && echo ✅ Usunięto test_data
if exist "mongo-init" rmdir /s /q "mongo-init" && echo ✅ Usunięto mongo-init
if exist "logs" rmdir /s /q "logs" && echo ✅ Usunięto logs
if exist "redis-data" rmdir /s /q "redis-data" && echo ✅ Usunięto redis-data
if exist "elasticsearch-data" rmdir /s /q "elasticsearch-data" && echo ✅ Usunięto elasticsearch-data
if exist "data" rmdir /s /q "data" && echo ✅ Usunięto data
if exist "certs" rmdir /s /q "certs" && echo ✅ Usunięto certs
if exist "tests" rmdir /s /q "tests" && echo ✅ Usunięto tests

echo.
echo 🗑️ Usuwanie starych plików Docker...
if exist "Dockerfile.debug" del "Dockerfile.debug" && echo ✅ Usunięto Dockerfile.debug
if exist "docker-compose.debug.yml" del "docker-compose.debug.yml" && echo ✅ Usunięto docker-compose.debug.yml
if exist "docker-compose-minimal.yml" del "docker-compose-minimal.yml" && echo ✅ Usunięto docker-compose-minimal.yml
if exist "docker-compose.local.yml" del "docker-compose.local.yml" && echo ✅ Usunięto docker-compose.local.yml

echo.
echo 🗑️ Usuwanie duplikatów skryptów...
if exist "start-local.bat" del "start-local.bat" && echo ✅ Usunięto start-local.bat
if exist "stop-local.bat" del "stop-local.bat" && echo ✅ Usunięto stop-local.bat
if exist "auto-cleanup.bat" del "auto-cleanup.bat" && echo ✅ Usunięto auto-cleanup.bat
if exist "final-cleanup.bat" del "final-cleanup.bat" && echo ✅ Usunięto final-cleanup.bat

echo.
echo 🗑️ Czyszczenie niepotrzebnych plików env...
if exist ".env.example" del ".env.example" && echo ✅ Usunięto .env.example

echo.
echo ✅ MINIMALNE CZYSZCZENIE ZAKOŃCZONE!
echo.
echo 📋 POZOSTAŁE PLIKI (TYLKO NIEZBĘDNE):
echo   📁 .git/ - repozytorium Git
echo   📁 .github/ - GitHub Actions
echo   📁 .vscode/ - konfiguracja VS Code  
echo   📁 src/ - źródła aplikacji
echo   📁 views/ - szablony Pug
echo   📁 public/ - assety (CSS/JS/images)
echo   📄 .dockerignore - Docker ignore
echo   📄 .gitignore - Git ignore
echo   📄 .env - zmienne środowiskowe
echo   📄 Dockerfile - główny Docker (Enhanced)
echo   📄 README.md - dokumentacja
echo   📄 docker-compose.yml - Docker Compose (Enhanced)
echo   📄 package.json - zależności (Enhanced)
echo   🚀 enhanced-app.js - APLIKACJA ENHANCED
echo   🐳 Dockerfile.enhanced - Enhanced Docker
echo   🔧 docker-quick-start.bat - Docker launcher
echo   🚀 launch-enhanced.bat - Enhanced launcher
echo   📖 INSTRUKCJA-URUCHOMIENIA.md - instrukcje
echo.
echo 🎯 Repozytorium MINIMALNE i gotowe!
pause
