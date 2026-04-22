"""Serveur de production Django avec Waitress (Windows)."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cashflow.settings')

from waitress import serve
from cashflow.wsgi import application

HOST = '127.0.0.1'
PORT = 8000

if __name__ == '__main__':
    print(f'CashFlow Manager — Django en production')
    print(f'Serveur : http://{HOST}:{PORT}')
    print('Appuyez sur Ctrl+C pour arreter.')
    serve(application, host=HOST, port=PORT, threads=4)
