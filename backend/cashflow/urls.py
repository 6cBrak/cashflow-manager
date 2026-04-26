from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.http import FileResponse, Http404
import os

def react_index(request, *args, **kwargs):
    index = settings.REACT_BUILD_DIR / 'index.html'
    if index.exists():
        return FileResponse(open(index, 'rb'), content_type='text/html')
    raise Http404('Frontend non buildé. Lancez : npm run build')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('apps.authentication.urls')),
    path('api/v1/operations/', include('apps.operations.urls')),
    path('api/v1/tiers/', include('apps.tiers.urls')),
    path('api/v1/fichiers/', include('apps.fichiers.urls')),
    path('api/v1/exports/', include('apps.exports.urls')),
    path('api/v1/', include('apps.formations.urls')),
    # Catch-all : toutes les routes non-API → React index.html
    re_path(r'^(?!api/|admin/|media/|static/).*$', react_index),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
