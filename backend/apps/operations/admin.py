from django.contrib import admin
from .models import Operation, SoldeMois


@admin.register(Operation)
class OperationAdmin(admin.ModelAdmin):
    list_display = ['date_operation', 'nature', 'tiers', 'tiers_libre', 'montant', 'mois', 'annee', 'is_deleted']
    list_filter = ['nature', 'mois', 'annee', 'is_deleted']
    search_fields = ['tiers__nom', 'tiers_libre', 'commentaire']
    readonly_fields = ['mois', 'annee', 'created_at', 'updated_at', 'deleted_at']
    date_hierarchy = 'date_operation'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('tiers', 'created_by', 'deleted_by')


@admin.register(SoldeMois)
class SoldeMoisAdmin(admin.ModelAdmin):
    list_display = ['mois', 'annee', 'solde_reporte', 'total_entrees', 'total_depenses', 'solde_final', 'is_cloture']
    list_filter = ['is_cloture', 'annee']
    readonly_fields = ['created_at', 'updated_at']
