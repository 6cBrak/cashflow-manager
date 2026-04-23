@echo off
title CashFlow Manager — Demarrage
color 0A
echo.
echo  ========================================
echo   CashFlow Manager EPA_OUAGA
echo   Demarrage des services...
echo  ========================================
echo.

:: Demarrer MySQL XAMPP
echo [1/2] Demarrage MySQL...
net start mysql 2>nul
if errorlevel 1 (
    "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone >nul 2>&1
)
timeout /t 3 /nobreak >nul
echo        MySQL OK

:: Demarrer Django + Waitress (sert API + frontend React)
echo [2/2] Demarrage Django Waitress (port 8000)...
set ROOT=%~dp0
set ROOT=%ROOT:~0,-1%
start "Django CashFlow" cmd /k "cd /d "%ROOT%\backend" && "%ROOT%\.venv\Scripts\python.exe" waitress_server.py"
timeout /t 4 /nobreak >nul
echo        Django OK

:: Afficher l'IP locale pour les autres PC du reseau
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /R "IPv4"') do (
    set LAN_IP=%%a
    goto :ip_found
)
:ip_found
set LAN_IP=%LAN_IP: =%

echo.
echo  ========================================
echo   Application disponible sur :
echo   Ce PC     : http://localhost:8000
echo   Reseau    : http://%LAN_IP%:8000
echo  ========================================
echo.
start "" "http://localhost:8000"
pause
