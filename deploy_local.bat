@echo off
title CashFlow — Mise a jour du deploiement
color 0B
echo.
echo  ========================================
echo   Mise a jour CashFlow Manager
echo  ========================================
echo.

:: Rebuild frontend
echo [1/3] Build du frontend React...
cd /d D:\projetCaisse\frontend
call npm run build
if errorlevel 1 (echo ERREUR build React & pause & exit)

:: Copier le build dans XAMPP
echo [2/3] Deploiement du frontend...
xcopy /E /Y /Q "D:\projetCaisse\frontend\dist\*" "C:\xampp\htdocs\cashflow\"
if errorlevel 1 (echo ERREUR copie des fichiers & pause & exit)

:: Collecter les statiques Django
echo [3/3] Collecte des fichiers statiques Django...
cd /d D:\projetCaisse\backend
call D:\projetCaisse\.venv\Scripts\activate.bat
python manage.py collectstatic --noinput

echo.
echo  ========================================
echo   Mise a jour terminee !
echo   Redemarrez Django si necessaire.
echo  ========================================
pause
