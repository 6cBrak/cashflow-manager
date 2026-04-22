from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'full_name', 'role', 'is_active', 'failed_attempts', 'last_login_at']
    list_filter = ['role', 'is_active']
    search_fields = ['email', 'full_name']
    ordering = ['full_name']
    readonly_fields = ['last_login_at', 'created_at', 'updated_at', 'failed_attempts']

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Informations', {'fields': ('full_name', 'role')}),
        ('Statut', {'fields': ('is_active', 'is_staff', 'is_superuser', 'failed_attempts')}),
        ('Dates', {'fields': ('last_login_at', 'created_at', 'updated_at')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'full_name', 'role', 'password1', 'password2'),
        }),
    )
