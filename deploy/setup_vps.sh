#!/bin/bash
set -e

# ── Couleurs ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "  ======================================================"
echo "   CashFlow Manager EPA_OUAGA"
echo "   Installation automatique VPS — Docker + Traefik"
echo "  ======================================================"
echo -e "${NC}"

# ── Vérification root ─────────────────────────────────────────────────────────
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Ce script doit être exécuté en tant que root (sudo bash setup_vps.sh)${NC}"
    exit 1
fi

# ── Configuration interactive ─────────────────────────────────────────────────
echo -e "${YELLOW}Configuration requise :${NC}"
echo ""
read -p "  Domaine de l'application (ex: cashflow.epa-ouaga.com) : " DOMAIN
read -p "  Email pour Let's Encrypt (certificat SSL)             : " LE_EMAIL
read -p "  Repo GitHub (ex: https://github.com/6cBrak/cashflow-manager.git) : " GITHUB_URL
echo ""
read -s -p "  Mot de passe MySQL (choisissez-en un fort)            : " DB_PASSWORD
echo ""

SECRET_KEY=$(openssl rand -base64 64 | tr -d "=+/\n" | cut -c1-50)

echo ""
echo -e "${YELLOW}Récapitulatif :${NC}"
echo "  Domaine    : $DOMAIN"
echo "  Email SSL  : $LE_EMAIL"
echo "  GitHub     : $GITHUB_URL"
echo "  Secret Key : ${SECRET_KEY:0:12}... (auto-générée)"
echo ""
read -p "Confirmer et lancer l'installation ? (o/n) : " CONFIRM
if [[ "$CONFIRM" != "o" && "$CONFIRM" != "O" ]]; then
    echo "Installation annulée."
    exit 0
fi

# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 1 — Docker
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BLUE}[1/6] Installation de Docker...${NC}"

if command -v docker &>/dev/null; then
    echo -e "${GREEN}  OK : Docker déjà installé ($(docker --version))${NC}"
else
    apt-get update -qq
    apt-get install -y -qq ca-certificates curl gnupg lsb-release
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
        | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
      https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
      | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}  OK : Docker installé${NC}"
fi

# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 2 — Réseau Docker partagé
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BLUE}[2/6] Réseau Docker partagé (web)...${NC}"
docker network create web 2>/dev/null \
    && echo -e "${GREEN}  OK : Réseau 'web' créé${NC}" \
    || echo -e "${GREEN}  OK : Réseau 'web' déjà existant${NC}"

# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 3 — Traefik (reverse proxy + SSL automatique)
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BLUE}[3/6] Installation de Traefik (SSL Let's Encrypt)...${NC}"

mkdir -p /opt/traefik/letsencrypt
touch /opt/traefik/letsencrypt/acme.json
chmod 600 /opt/traefik/letsencrypt/acme.json

cat > /opt/traefik/docker-compose.yml <<EOF
services:
  traefik:
    image: traefik:v3.0
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./letsencrypt:/letsencrypt
    command:
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.web.http.redirections.entrypoint.to=websecure"
      - "--entrypoints.web.http.redirections.entrypoint.scheme=https"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
      - "--certificatesresolvers.letsencrypt.acme.email=${LE_EMAIL}"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
    networks:
      - web

networks:
  web:
    external: true
EOF

cd /opt/traefik
docker compose up -d
echo -e "${GREEN}  OK : Traefik démarré${NC}"

# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 4 — Clonage du projet
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BLUE}[4/6] Récupération du projet depuis GitHub...${NC}"

if [ -d "/opt/cashflow/.git" ]; then
    echo "  Projet déjà présent — mise à jour..."
    cd /opt/cashflow
    git pull origin master
else
    git clone "$GITHUB_URL" /opt/cashflow
    cd /opt/cashflow
fi
echo -e "${GREEN}  OK : Code disponible dans /opt/cashflow${NC}"

# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 5 — Fichier .env production
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BLUE}[5/6] Création du fichier .env...${NC}"

cat > /opt/cashflow/.env <<EOF
SECRET_KEY=${SECRET_KEY}
DEBUG=False
ALLOWED_HOSTS=${DOMAIN}

DB_NAME=cashflow_db
DB_USER=root
DB_PASSWORD=${DB_PASSWORD}
DB_HOST=db
DB_PORT=3306

JWT_ACCESS_TOKEN_LIFETIME_MINUTES=60
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7

CORS_ALLOW_ALL_ORIGINS=False
CORS_ALLOWED_ORIGINS=https://${DOMAIN}
CSRF_TRUSTED_ORIGINS=https://${DOMAIN}

MEDIA_URL=/media/
MEDIA_ROOT=media/

DOMAIN=${DOMAIN}
EOF

echo -e "${GREEN}  OK : .env créé${NC}"

# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 6 — Build Docker + migrations + superuser
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BLUE}[6/6] Build Docker et démarrage...${NC}"
echo "  (cela peut prendre 5-10 minutes à la première installation)"
echo ""

cd /opt/cashflow
docker compose up -d --build

echo ""
echo "  Attente démarrage MySQL..."
sleep 20

echo "  Application des migrations Django..."
docker compose exec django python manage.py migrate --noinput

echo "  Création du compte administrateur..."
docker compose exec django python create_superuser.py

# ─────────────────────────────────────────────────────────────────────────────
# SUCCÈS
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}"
echo "  ======================================================"
echo "   INSTALLATION TERMINÉE AVEC SUCCÈS !"
echo "  ======================================================"
echo ""
echo "   URL de l'application : https://${DOMAIN}"
echo "   Interface admin      : https://${DOMAIN}/admin"
echo "   Login                : admin@cashflow.local"
echo "   Mot de passe         : Admin@2024!"
echo ""
echo "   IMPORTANT : Changez le mot de passe à la 1ère connexion !"
echo ""
echo "   Pour les mises à jour futures :"
echo "     bash /opt/cashflow/deploy/update.sh"
echo -e "  ======================================================${NC}"
