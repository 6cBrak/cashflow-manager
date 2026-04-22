@echo off
title CashFlow Manager — Arret
color 0C
echo.
echo  ========================================
echo   Arret de CashFlow Manager...
echo  ========================================
echo.

echo [1/2] Arret Django (Waitress)...
taskkill /F /FI "WINDOWTITLE eq Django CashFlow*" 2>nul
taskkill /F /IM python.exe /FI "WINDOWTITLE eq Django CashFlow*" 2>nul

echo [2/2] Arret MySQL...
"C:\xampp\mysql\bin\mysqladmin.exe" -u root shutdown 2>nul
net stop mysql 2>nul

echo.
echo  Services arretes.
pause
