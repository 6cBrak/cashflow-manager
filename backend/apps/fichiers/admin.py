from django.contrib import admin
from .models import PieceJointe


@admin.register(PieceJointe)
class PieceJointeAdmin(admin.ModelAdmin):
    list_display = ['operation', 'nom_original', 'taille', 'mime_type', 'uploaded_by', 'created_at']
    readonly_fields = ['created_at']
