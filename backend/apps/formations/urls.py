from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FormationViewSet, PayeurViewSet, InscriptionViewSet, VersementViewSet

router = DefaultRouter()
router.register('formations', FormationViewSet, basename='formation')
router.register('payeurs', PayeurViewSet, basename='payeur')
router.register('inscriptions', InscriptionViewSet, basename='inscription')
router.register('versements', VersementViewSet, basename='versement')

urlpatterns = [
    path('', include(router.urls)),
]
