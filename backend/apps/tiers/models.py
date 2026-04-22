from django.db import models
from django.conf import settings


class Tiers(models.Model):
    nom = models.CharField(max_length=200, unique=True, verbose_name='Nom')
    is_active = models.BooleanField(default=True, verbose_name='Actif')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='tiers_created',
        verbose_name='Créé par'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tiers'
        verbose_name = 'Tiers'
        verbose_name_plural = 'Tiers'
        ordering = ['nom']

    def __str__(self):
        return self.nom
