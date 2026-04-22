from django.urls import path
from . import views

urlpatterns = [
    path('', views.PieceJointeUploadView.as_view(), name='piece-jointe-upload'),
    path('<int:pk>/', views.PieceJointeDetailView.as_view(), name='piece-jointe-detail'),
]
