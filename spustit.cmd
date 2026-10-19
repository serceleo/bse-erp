@echo off
chcp 65001 >nul
cd /d "%~dp0"
title BSE ERP

docker info >nul 2>&1
if errorlevel 1 (
  echo.
  echo  Docker Desktop nebezi. Spustte ho, pockejte, az velryba v liste prestane blikat, a zkuste to znovu.
  echo.
  pause
  exit /b 1
)

if not exist .env (
  echo.
  echo  Chybi soubor .env - zkopirujte .env.example na .env a doplnte PAYLOAD_SECRET.
  echo.
  pause
  exit /b 1
)

echo.
echo  Spoustim BSE ERP... Poprve to trva nekolik minut (stahuje a sestavuje se vse potrebne).
echo.
docker compose up -d --build
if errorlevel 1 (
  echo.
  echo  Spusteni selhalo - vypis vyse prosim poslete Claudovi.
  echo.
  pause
  exit /b 1
)

echo.
echo  Cekam, az aplikace nabehne...
set /a pokus=0
:cekej
set /a pokus+=1
if %pokus% gtr 60 (
  echo  Aplikace nenabehla do 3 minut. Vypis vam ukaze: docker compose logs app
  pause
  exit /b 1
)
timeout /t 3 /nobreak >nul
curl -s -o nul http://localhost:3001/admin
if errorlevel 1 goto cekej

start "" http://localhost:3001/admin
echo  Hotovo - administrace bezi na http://localhost:3001/admin
timeout /t 5 >nul
