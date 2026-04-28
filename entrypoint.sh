#!/bin/bash
set -e

echo "==> Collecte des fichiers statiques..."
python manage.py collectstatic --noinput

echo "==> Démarrage Gunicorn..."
exec gunicorn cashflow.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 3 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -
