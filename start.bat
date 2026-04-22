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
start "Django CashFlow" cmd /k "cd /d D:\projetCaisse\backend && D:\projetCaisse\.venv\Scripts\python.exe waitress_server.py"
timeout /t 4 /nobreak >nul
echo        Django OK

echo.
echo  ========================================
echo   Application disponible sur :
echo   http://localhost:8000
echo   http://localhost:8000/admin
echo  ========================================
echo.
start "" "http://localhost:8000"
pause
