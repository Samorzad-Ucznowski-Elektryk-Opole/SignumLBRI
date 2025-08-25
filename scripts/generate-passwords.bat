@echo off
REM ===============================================
REM  SignumLBRI 2025 - Security Password Generator  
REM ===============================================

echo ===============================================
echo    SignumLBRI 2025 - Password Generator
echo ===============================================
echo.
echo Generating secure passwords for production...
echo.

REM Generate secure random passwords
set REDIS_PWD=SignumRedis2025_%RANDOM%%RANDOM%
set SESSION_SECRET=SignumSession2025_%RANDOM%%RANDOM%%RANDOM%
set JWT_SECRET=SignumJWT2025_%RANDOM%%RANDOM%%RANDOM%

echo Generated secure passwords:
echo.
echo ⚠️  SECURITY: Save these passwords securely!
echo ⚠️  Add them to your .env file before deployment!
echo.
echo REDIS_PASSWORD=%REDIS_PWD%
echo SESSION_SECRET=%SESSION_SECRET%
echo JWT_SECRET=%JWT_SECRET%
echo.
echo ===============================================
echo Copy these to your .env file:
echo ===============================================
echo.
echo REDIS_PASSWORD=%REDIS_PWD%
echo REDIS_URI=redis://:%REDIS_PWD%@redis:6379/0
echo SESSION_SECRET=%SESSION_SECRET%
echo JWT_SECRET=%JWT_SECRET%
echo.
echo ===============================================
echo ⚡ IMPORTANT: Never commit .env to Git! ⚡
echo ===============================================
pause
