from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('apps.authentication.urls')),
    path('api/v1/operations/', include('apps.operations.urls')),
    path('api/v1/tiers/', include('apps.tiers.urls')),
    path('api/v1/fichiers/', include('apps.fichiers.urls')),
    path('api/v1/exports/', include('apps.exports.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
