from django.urls import path
from . import views

urlpatterns = [
    path('', views.OperationListCreateView.as_view(), name='operation-list-create'),
    path('<int:pk>/', views.OperationDetailView.as_view(), name='operation-detail'),
    path('solde/', views.SoldeView.as_view(), name='operation-solde'),
    path('cloture/', views.ClotureMoisView.as_view(), name='operation-cloture'),
]
