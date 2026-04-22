from django.urls import path
from . import views

urlpatterns = [
    path('excel/', views.ExportExcelView.as_view(), name='export-excel'),
    path('pdf/', views.ExportPDFView.as_view(), name='export-pdf'),
]
