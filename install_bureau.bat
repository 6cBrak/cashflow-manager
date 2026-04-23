@echo off
setlocal enabledelayedexpansion
title CashFlow Manager — Installation PC Bureau
color 0B

:: Garder la fenetre ouverte meme en cas d'erreur
:: (Lancer avec : cmd /k install_bureau.bat)

echo.
echo  =====================================================
echo   CashFlow Manager EPA_OUAGA
echo   Script d'installation automatique - PC Bureau
echo  =====================================================
echo.

:: =====================================================
:: CONFIGURATION
:: =====================================================
set INSTALL_DIR=C:\projetCaisse
set GITHUB_URL=https://github.com/6cBrak/cashflow-manager.git
set MYSQL_BIN=C:\xampp\mysql\bin
set DB_NAME=cashflow_db
set DB_USER=root
set DB_PASSWORD=
set PYTHON=%INSTALL_DIR%\.venv\Scripts\python.exe
set PIP=%INSTALL_DIR%\.venv\Scripts\pip.exe

:: Fichier SQL a placer dans le meme dossier que ce script
set SQL_DUMP=%~dp0cashflow_db.sql

echo  Dossier d'installation : %INSTALL_DIR%
echo  Fichier SQL recherche  : %SQL_DUMP%
echo.
echo  Appuyez sur une touche pour demarrer...
pause >nul

:: =====================================================
:: ETAPE 1 - Prerequis
:: =====================================================
echo.
echo ======================================================
echo  [1/7] Verification des prerequis
echo ======================================================

:: Python
echo  - Python...
python --version >nul 2>&1
if errorlevel 1 goto :erreur_python
for /f "tokens=*" %%v in ('python --version 2^>^&1') do echo    OK : %%v

:: Node.js
echo  - Node.js...
node --version >nul 2>&1
if errorlevel 1 goto :erreur_node
for /f "tokens=*" %%v in ('node --version 2^>^&1') do echo    OK : Node.js %%v

:: Git
echo  - Git...
git --version >nul 2>&1
if errorlevel 1 goto :erreur_git
for /f "tokens=*" %%v in ('git --version 2^>^&1') do echo    OK : %%v

:: XAMPP MySQL
echo  - XAMPP MySQL...
if not exist "%MYSQL_BIN%\mysql.exe" goto :erreur_mysql
echo    OK : mysql.exe trouve dans %MYSQL_BIN%

:: =====================================================
:: ETAPE 2 - Telechargement depuis GitHub
:: =====================================================
echo.
echo ======================================================
echo  [2/7] Telechargement du projet depuis GitHub
echo ======================================================

if exist "%INSTALL_DIR%\.git" (
    echo  Projet deja present - mise a jour...
    cd /d "%INSTALL_DIR%"
    git pull origin master
    if errorlevel 1 (
        echo  Mise a jour echouee - utilisation de la version existante.
    )
    goto :git_ok
)

if exist "%INSTALL_DIR%" (
    echo  Dossier existant sans Git detecte - suppression...
    rmdir /S /Q "%INSTALL_DIR%"
)

echo  Telechargement en cours...
echo  ^(cela peut prendre 1-2 minutes selon votre connexion^)
echo.
git clone "%GITHUB_URL%" "%INSTALL_DIR%"
if errorlevel 1 goto :erreur_git_clone

:git_ok
echo.
echo  OK : Projet disponible dans %INSTALL_DIR%

:: =====================================================
:: ETAPE 3 - Base de donnees MySQL
:: =====================================================
echo.
echo ======================================================
echo  [3/7] Configuration de la base de donnees MySQL
echo ======================================================

echo  Verification de MySQL...
"%MYSQL_BIN%\mysql.exe" -u %DB_USER% -e "SELECT 1;" >nul 2>&1
if errorlevel 1 (
    echo  MySQL ne repond pas - tentative de demarrage...
    net start mysql >nul 2>&1
    timeout /t 4 /nobreak >nul
    "%MYSQL_BIN%\mysql.exe" -u %DB_USER% -e "SELECT 1;" >nul 2>&1
    if errorlevel 1 goto :erreur_mysql_start
)
echo  OK : MySQL repond

echo  Creation de la base de donnees...
"%MYSQL_BIN%\mysql.exe" -u %DB_USER% -e "CREATE DATABASE IF NOT EXISTS %DB_NAME% CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
echo  OK : Base '%DB_NAME%' prete

if exist "%SQL_DUMP%" (
    echo  Import des donnees depuis cashflow_db.sql...
    "%MYSQL_BIN%\mysql.exe" -u %DB_USER% %DB_NAME% < "%SQL_DUMP%"
    if errorlevel 1 (
        echo  ATTENTION : Import partiel - verifiez les donnees apres demarrage
    ) else (
        echo  OK : Donnees importees
    )
) else (
    echo  INFO : cashflow_db.sql absent - base demarrera vide
    echo         ^(copiez le fichier SQL a cote de ce script et relancez pour importer^)
)

:: =====================================================
:: ETAPE 4 - Virtualenv Python
:: =====================================================
echo.
echo ======================================================
echo  [4/7] Environnement Python
echo ======================================================

cd /d "%INSTALL_DIR%"

if not exist "%PYTHON%" (
    echo  Creation du virtualenv...
    python -m venv .venv
    if errorlevel 1 goto :erreur_venv
    echo  OK : Virtualenv cree
) else (
    echo  OK : Virtualenv existant conserve
)

echo  Mise a jour de pip, setuptools et wheel...
"%PIP%" install --upgrade pip setuptools wheel --quiet

echo  Installation de Pillow (binaire pre-compile)...
"%PIP%" install "Pillow==10.4.0" --only-binary=:all: --quiet
if errorlevel 1 (
    echo  ATTENTION : Pillow binaire echoue - tentative source...
)

echo  Installation des dependances Python...
echo  ^(cela peut prendre 3-5 minutes^)
"%PIP%" install -r "%INSTALL_DIR%\backend\requirements.txt"
if errorlevel 1 (
    echo.
    echo  Echec standard - tentative avec binaires pre-compiles...
    "%PIP%" install mysqlclient --only-binary=:all: --quiet
    "%PIP%" install Pillow --only-binary=:all: --quiet
    "%PIP%" install -r "%INSTALL_DIR%\backend\requirements.txt"
    if errorlevel 1 goto :erreur_pip
)
echo  OK : Dependances Python installees

:: =====================================================
:: ETAPE 5 - Fichier .env
:: =====================================================
echo.
echo ======================================================
echo  [5/7] Fichier de configuration .env
echo ======================================================

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
    echo  OK : .env cree
) else (
    echo  OK : .env existant conserve
)

:: =====================================================
:: ETAPE 6 - Django migrations + statiques
:: =====================================================
echo.
echo ======================================================
echo  [6/7] Configuration Django
echo ======================================================

cd /d "%INSTALL_DIR%\backend"

if not exist "media" mkdir media
if not exist "static" mkdir static

echo  Application des migrations...
"%PYTHON%" "%INSTALL_DIR%\backend\manage.py" migrate --noinput
if errorlevel 1 goto :erreur_migrate
echo  OK : Migrations appliquees

if not exist "%SQL_DUMP%" (
    echo  Creation du compte administrateur...
    "%PYTHON%" "%INSTALL_DIR%\backend\create_superuser.py"
)

echo  Collecte des fichiers statiques...
"%PYTHON%" "%INSTALL_DIR%\backend\manage.py" collectstatic --noinput --clear
if errorlevel 1 (
    echo  ATTENTION : collectstatic incomplet - peut affecter le style de l'admin
) else (
    echo  OK : Statiques collectes
)

:: =====================================================
:: ETAPE 7 - Frontend React
:: =====================================================
echo.
echo ======================================================
echo  [7/7] Build du frontend React
echo ======================================================

cd /d "%INSTALL_DIR%\frontend"

echo  Installation des paquets Node.js...
echo  ^(cela peut prendre 2-4 minutes^)
call npm install
if errorlevel 1 goto :erreur_npm

echo  Build React production...
call npm run build
if errorlevel 1 goto :erreur_build
echo  OK : Frontend compile

:: =====================================================
:: SUCCES
:: =====================================================
echo.
echo ======================================================
echo   INSTALLATION TERMINEE AVEC SUCCES !
echo ======================================================
echo.
echo   Acces a l'application : http://localhost:8000
echo   Admin Django          : http://localhost:8000/admin
echo   Identifiants          : admin@cashflow.local
echo   Mot de passe          : Admin@2024!
echo.
echo   Changez le mot de passe a la premiere connexion !
echo.
echo   Pour demarrer l'application : double-cliquez start.bat
echo ======================================================
echo.
set /p LAUNCH="Lancer l'application maintenant ? (O/N) : "
if /i "!LAUNCH!"=="O" (
    start "Django CashFlow" cmd /k "%PYTHON% %INSTALL_DIR%\backend\waitress_server.py"
    timeout /t 4 /nobreak >nul
    start "" "http://localhost:8000"
)
echo.
goto :fin

:: =====================================================
:: MESSAGES D'ERREUR
:: =====================================================

:erreur_python
echo.
echo  *** ERREUR : Python non detecte ***
echo.
echo  Solution :
echo    1. Allez sur https://python.org/downloads
echo    2. Telechargez Python 3.11 ou superieur
echo    3. Lors de l'installation, COCHEZ "Add Python to PATH"
echo    4. Redemarrez ce script
echo.
goto :fin

:erreur_node
echo.
echo  *** ERREUR : Node.js non detecte ***
echo.
echo  Solution :
echo    1. Allez sur https://nodejs.org
echo    2. Telechargez la version LTS
echo    3. Installez avec les options par defaut
echo    4. Redemarrez ce script
echo.
goto :fin

:erreur_git
echo.
echo  *** ERREUR : Git non detecte ***
echo.
echo  Solution :
echo    1. Allez sur https://git-scm.com
echo    2. Telechargez et installez Git
echo    3. Redemarrez ce script
echo.
goto :fin

:erreur_mysql
echo.
echo  *** ERREUR : XAMPP MySQL introuvable ***
echo.
echo  Solution :
echo    1. Installez XAMPP depuis https://www.apachefriends.org
echo    2. Demarrez le XAMPP Control Panel
echo    3. Cliquez Start sur la ligne MySQL
echo    4. Redemarrez ce script
echo.
goto :fin

:erreur_git_clone
echo.
echo  *** ERREUR : Impossible de telecharger depuis GitHub ***
echo.
echo  Causes possibles :
echo    - Pas de connexion internet
echo    - Depot prive (authentification requise)
echo.
echo  Solutions :
echo    A) Connectez-vous a internet et relancez
echo    B) Telechargez le ZIP depuis GitHub :
echo       https://github.com/6cBrak/cashflow-manager/archive/refs/heads/master.zip
echo       Decompressez dans D:\projetCaisse et relancez ce script
echo.
goto :fin

:erreur_mysql_start
echo.
echo  *** ERREUR : MySQL ne demarre pas ***
echo.
echo  Solution :
echo    1. Ouvrez XAMPP Control Panel
echo    2. Cliquez Start sur la ligne MySQL
echo    3. Attendez que le statut devienne vert
echo    4. Redemarrez ce script
echo.
goto :fin

:erreur_venv
echo.
echo  *** ERREUR : Creation du virtualenv Python echouee ***
echo.
echo  Essayez : python -m pip install --upgrade pip
echo  Puis relancez ce script.
echo.
goto :fin

:erreur_pip
echo.
echo  *** ERREUR : Installation des paquets Python echouee ***
echo.
echo  Verifiez que XAMPP est bien installe dans C:\xampp
echo  Le paquet mysqlclient necessite les fichiers XAMPP.
echo.
goto :fin

:erreur_migrate
echo.
echo  *** ERREUR : Migrations Django echouees ***
echo.
echo  Verifiez que :
echo    - MySQL est demarre
echo    - La base cashflow_db existe
echo    - Le fichier .env est correct
echo.
goto :fin

:erreur_npm
echo.
echo  *** ERREUR : npm install echoue ***
echo.
echo  Essayez de relancer le script.
echo  Si le probleme persiste, ouvrez un terminal et tapez :
echo    cd %INSTALL_DIR%\frontend
echo    npm install
echo.
goto :fin

:erreur_build
echo.
echo  *** ERREUR : Build React echoue ***
echo.
echo  Ouvrez un terminal et tapez :
echo    cd %INSTALL_DIR%\frontend
echo    npm run build
echo  pour voir le detail de l'erreur.
echo.
goto :fin

:fin
echo.
echo  Appuyez sur une touche pour fermer...
pause >nul
