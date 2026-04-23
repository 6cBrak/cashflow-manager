"""Serveur de production Django avec Waitress (Windows)."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cashflow.settings')

from waitress import serve
from cashflow.wsgi import application

HOST = '0.0.0.0'
PORT = 8000

if __name__ == '__main__':
    import socket
    try:
        ip_local = socket.gethostbyname(socket.gethostname())
    except Exception:
        ip_local = 'votre-ip-locale'
    print('CashFlow Manager — Django en production')
    print(f'  Local      : http://localhost:{PORT}')
    print(f'  Reseau     : http://{ip_local}:{PORT}')
    print('Appuyez sur Ctrl+C pour arreter.')
    serve(application, host=HOST, port=PORT, threads=4)
