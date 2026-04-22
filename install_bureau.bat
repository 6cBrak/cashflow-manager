@echo off
setlocal enabledelayedexpansion
title CashFlow Manager — Installation PC Bureau
color 0B

echo.
echo  =====================================================
echo   CashFlow Manager EPA_OUAGA
echo   Script d'installation automatique — PC Bureau
echo  =====================================================
echo.
echo  Ce script va :
echo    1. Verifier les prerequis
echo    2. Telecharger le projet depuis GitHub
echo    3. Creer la base de donnees MySQL
echo    4. Installer les dependances Python
echo    5. Installer les dependances Node.js
echo    6. Configurer et builder le projet
echo    7. Lancer l'application
echo.
pause

:: =====================================================
:: CONFIGURATION — modifier si necessaire
:: =====================================================
set INSTALL_DIR=D:\projetCaisse
set GITHUB_URL=https://github.com/6cBrak/cashflow-manager.git
set MYSQL_BIN=C:\xampp\mysql\bin
set DB_NAME=cashflow_db
set DB_USER=root
set DB_PASSWORD=

:: Le fichier SQL doit etre dans le meme dossier que ce script
:: (copie depuis le PC actuel via cle USB)
set SQL_DUMP=%~dp0cashflow_db.sql

:: =====================================================
:: ETAPE 1 — Verification des prerequis
:: =====================================================
echo.
echo  [1/7] Verification des prerequis...
echo  ------------------------------------------------------

:: Python
python --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo  [ERREUR] Python n'est pas installe ou pas dans le PATH.
    echo  Installez Python 3.11+ depuis https://python.org
    echo  IMPORTANT : cocher "Add Python to PATH" a l'installation.
    echo.
    pause & exit /b 1
)
for /f "tokens=*" %%v in ('python --version 2^>^&1') do echo         %%v ... OK

:: Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo  [ERREUR] Node.js n'est pas installe ou pas dans le PATH.
    echo  Installez Node.js LTS depuis https://nodejs.org
    echo.
    pause & exit /b 1
)
for /f "tokens=*" %%v in ('node --version 2^>^&1') do echo         Node.js %%v ... OK

:: Git
git --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo  [ERREUR] Git n'est pas installe ou pas dans le PATH.
    echo  Installez Git depuis https://git-scm.com
    echo.
    pause & exit /b 1
)
for /f "tokens=*" %%v in ('git --version 2^>^&1') do echo         %%v ... OK

:: XAMPP MySQL
if not exist "%MYSQL_BIN%\mysql.exe" (
    echo.
    echo  [ERREUR] XAMPP MySQL introuvable dans %MYSQL_BIN%
    echo  Installez XAMPP depuis https://www.apachefriends.org
    echo  et demarrez MySQL avant de relancer ce script.
    echo.
    pause & exit /b 1
)
echo         XAMPP MySQL ... OK

echo.
echo  Tous les prerequis sont satisfaits.

:: =====================================================
:: ETAPE 2 — Telecharger le projet depuis GitHub
:: =====================================================
echo.
echo  [2/7] Telechargement du projet...
echo  ------------------------------------------------------

if exist "%INSTALL_DIR%\.git" (
    echo  Projet deja present — mise a jour depuis GitHub...
    cd /d "%INSTALL_DIR%"
    git pull origin master
    if errorlevel 1 (
        echo  [AVERTISSEMENT] Echec du git pull. Le projet existant sera utilise.
    )
) else (
    if exist "%INSTALL_DIR%" (
        echo  Le dossier %INSTALL_DIR% existe deja sans depot Git.
        echo  Suppression et re-telechargement...
        rmdir /S /Q "%INSTALL_DIR%"
    )
    git clone "%GITHUB_URL%" "%INSTALL_DIR%"
    if errorlevel 1 (
        echo.
        echo  [ERREUR] Impossible de cloner le depot GitHub.
        echo  Verifiez votre connexion internet.
        echo.
        pause & exit /b 1
    )
)
echo         Projet telecharge dans %INSTALL_DIR%

:: =====================================================
:: ETAPE 3 — Base de donnees MySQL
:: =====================================================
echo.
echo  [3/7] Configuration de la base de donnees...
echo  ------------------------------------------------------

:: Demarrer MySQL si pas actif
"%MYSQL_BIN%\mysql.exe" -u %DB_USER% -e "SELECT 1;" >nul 2>&1
if errorlevel 1 (
    echo  Demarrage de MySQL...
    net start mysql >nul 2>&1
    timeout /t 3 /nobreak >nul
    "%MYSQL_BIN%\mysql.exe" -u %DB_USER% -e "SELECT 1;" >nul 2>&1
    if errorlevel 1 (
        echo.
        echo  [ERREUR] MySQL ne repond pas.
        echo  Demarrez MySQL depuis XAMPP Control Panel et relancez ce script.
        echo.
        pause & exit /b 1
    )
)
echo         MySQL en cours d'execution ... OK

:: Creer la base de donnees
"%MYSQL_BIN%\mysql.exe" -u %DB_USER% -e "CREATE DATABASE IF NOT EXISTS %DB_NAME% CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>nul
echo         Base '%DB_NAME%' creee ou deja existante ... OK

:: Importer le dump SQL si present
if exist "%SQL_DUMP%" (
    echo  Importation des donnees depuis cashflow_db.sql...
    "%MYSQL_BIN%\mysql.exe" -u %DB_USER% %DB_NAME% < "%SQL_DUMP%"
    if errorlevel 1 (
        echo  [AVERTISSEMENT] L'importation SQL a rencontre des erreurs.
        echo  L'application fonctionnera mais les donnees peuvent etre incompletes.
    ) else (
        echo         Donnees importees avec succes ... OK
    )
) else (
    echo  [INFO] Fichier cashflow_db.sql absent — base vide (migrations seules).
    echo         Placez cashflow_db.sql a cote de ce script pour restaurer les donnees.
)

:: =====================================================
:: ETAPE 4 — Environnement Python
:: =====================================================
echo.
echo  [4/7] Installation des dependances Python...
echo  ------------------------------------------------------

cd /d "%INSTALL_DIR%"

:: Creer le virtualenv
if not exist ".venv\Scripts\python.exe" (
    echo  Creation du virtualenv...
    python -m venv .venv
    if errorlevel 1 (
        echo  [ERREUR] Impossible de creer le virtualenv Python.
        pause & exit /b 1
    )
)
echo         Virtualenv ... OK

:: Installer mysqlclient (necessite les headers XAMPP MySQL)
set MYSQLCLIENT_LDFLAGS=-L%MYSQL_BIN%
set MYSQLCLIENT_CFLAGS=-I%MYSQL_BIN%\..\include

echo  Installation des paquets Python (peut prendre quelques minutes)...
.venv\Scripts\pip.exe install --upgrade pip --quiet
.venv\Scripts\pip.exe install -r backend\requirements.txt --quiet

if errorlevel 1 (
    echo.
    echo  [AVERTISSEMENT] Certains paquets n'ont pas installe correctement.
    echo  Tentative avec mysqlclient pre-compile...
    .venv\Scripts\pip.exe install mysqlclient --only-binary=:all: --quiet
    .venv\Scripts\pip.exe install -r backend\requirements.txt --quiet
)
echo         Paquets Python ... OK

:: =====================================================
:: ETAPE 5 — Fichier de configuration .env
:: =====================================================
echo.
echo  [5/7] Configuration de l'environnement...
echo  ------------------------------------------------------

if not exist "%INSTALL_DIR%\backend\.env" (
    echo  Creation du fichier .env...
    (
        echo SECRET_KEY=django-secret-key-cashflow-epa-ouaga-2024-change-in-prod
        echo DEBUG=False
        echo ALLOWED_HOSTS=localhost,127.0.0.1
        echo.
        echo DB_NAME=cashflow_db
        echo DB_USER=root
        echo DB_PASSWORD=
        echo DB_HOST=localhost
        echo DB_PORT=3306
        echo.
        echo JWT_ACCESS_TOKEN_LIFETIME_MINUTES=60
        echo JWT_REFRESH_TOKEN_LIFETIME_DAYS=7
        echo.
        echo CORS_ALLOWED_ORIGINS=http://localhost:8000,http://127.0.0.1:8000
        echo.
        echo MEDIA_URL=/media/
        echo MEDIA_ROOT=media/
    ) > "%INSTALL_DIR%\backend\.env"
    echo         Fichier .env cree ... OK
) else (
    echo         Fichier .env deja present — conserve ... OK
)

:: =====================================================
:: ETAPE 6 — Django : migrations + statiques
:: =====================================================
echo.
echo  [6/7] Configuration Django...
echo  ------------------------------------------------------

cd /d "%INSTALL_DIR%\backend"

:: Creer le dossier media si absent
if not exist "media" mkdir media
if not exist "static" mkdir static

:: Migrations
echo  Application des migrations...
..\venv\Scripts\python.exe manage.py migrate --noinput
if errorlevel 1 (
    echo  [ERREUR] Les migrations ont echoue. Verifiez la connexion MySQL.
    pause & exit /b 1
)
echo         Migrations ... OK

:: Superuser (seulement si la base est vide = pas de dump importe)
if not exist "%SQL_DUMP%" (
    echo  Creation du superuser admin...
    ..\venv\Scripts\python.exe create_superuser.py
)

:: Collecter les statiques Django
echo  Collecte des fichiers statiques...
..\venv\Scripts\python.exe manage.py collectstatic --noinput --clear
if errorlevel 1 (
    echo  [AVERTISSEMENT] collectstatic a rencontre des erreurs.
)
echo         Statiques Django ... OK

:: =====================================================
:: ETAPE 7 — Frontend React
:: =====================================================
echo.
echo  [7/7] Build du frontend React...
echo  ------------------------------------------------------

cd /d "%INSTALL_DIR%\frontend"

echo  Installation des paquets Node.js...
call npm install --silent
if errorlevel 1 (
    echo  [ERREUR] npm install a echoue.
    pause & exit /b 1
)

echo  Build React (production)...
call npm run build
if errorlevel 1 (
    echo  [ERREUR] npm run build a echoue.
    pause & exit /b 1
)
echo         Frontend React ... OK

:: =====================================================
:: TERMINE — Lancement de l'application
:: =====================================================
echo.
echo  =====================================================
echo   Installation terminee avec succes !
echo  =====================================================
echo.
echo   Application : http://localhost:8000
echo   Admin Django : http://localhost:8000/admin
echo   Identifiants : admin@cashflow.local / Admin@2024!
echo.
echo   IMPORTANT : Changez le mot de passe admin apres
echo   votre premiere connexion.
echo.
echo  =====================================================
echo.

set /p LAUNCH="Lancer l'application maintenant ? (O/N) : "
if /i "%LAUNCH%"=="O" (
    start "Django CashFlow" cmd /k "cd /d %INSTALL_DIR%\backend && %INSTALL_DIR%\.venv\Scripts\python.exe waitress_server.py"
    timeout /t 3 /nobreak >nul
    start "" "http://localhost:8000"
)

echo.
echo  Pour demarrer l'application la prochaine fois :
echo  Double-cliquez sur %INSTALL_DIR%\start.bat
echo.
pause
