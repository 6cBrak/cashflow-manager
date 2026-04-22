from django.urls import path
from . import views

urlpatterns = [
    path('', views.TiersListCreateView.as_view(), name='tiers-list-create'),
    path('<int:pk>/', views.TiersDetailView.as_view(), name='tiers-detail'),
]
