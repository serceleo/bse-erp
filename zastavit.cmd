@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo  Zastavuji BSE ERP (data zustavaji ulozena)...
docker compose stop
timeout /t 3 >nul
