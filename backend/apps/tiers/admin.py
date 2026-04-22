from django.contrib import admin
from .models import Tiers


@admin.register(Tiers)
class TiersAdmin(admin.ModelAdmin):
    list_display = ['nom', 'is_active', 'created_by', 'created_at']
    list_filter = ['is_active']
    search_fields = ['nom']
    readonly_fields = ['created_at']
