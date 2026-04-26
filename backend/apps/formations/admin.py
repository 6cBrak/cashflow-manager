from django.contrib import admin
from .models import Formation, Payeur, Inscription, Tranche, Versement

admin.site.register(Formation)
admin.site.register(Payeur)
admin.site.register(Inscription)
admin.site.register(Tranche)
admin.site.register(Versement)
