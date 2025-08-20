@echo off
echo Generating SSL certificates for SignumLBRI...
echo.
echo If you have Docker installed, you can generate certificates using:
echo docker run --rm -v "%cd%":/certs alpine/openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /certs/cert.key -out /certs/cert.crt -subj "/C=PL/ST=Opolskie/L=Opole/O=ZSEL/OU=SignumLBRI/CN=localhost"
echo.
echo Or install OpenSSL for Windows and run:
echo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout cert.key -out cert.crt -subj "/C=PL/ST=Opolskie/L=Opole/O=ZSEL/OU=SignumLBRI/CN=localhost"
pause
