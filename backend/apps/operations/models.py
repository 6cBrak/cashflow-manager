from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from decimal import Decimal


class SoldeMois(models.Model):
    mois = models.PositiveSmallIntegerField(verbose_name='Mois')
    annee = models.PositiveIntegerField(verbose_name='Année')
    solde_reporte = models.DecimalField(
        max_digits=15, decimal_places=2, default=Decimal('0.00'),
        verbose_name='Solde reporté'
    )
    total_entrees = models.DecimalField(
        max_digits=15, decimal_places=2, default=Decimal('0.00'),
        verbose_name='Total entrées'
    )
    total_depenses = models.DecimalField(
        max_digits=15, decimal_places=2, default=Decimal('0.00'),
        verbose_name='Total dépenses'
    )
    solde_final = models.DecimalField(
        max_digits=15, decimal_places=2, default=Decimal('0.00'),
        verbose_name='Solde final'
    )
    is_cloture = models.BooleanField(default=False, verbose_name='Clôturé')
    cloture_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True, blank=True,
        related_name='clotures',
        verbose_name='Clôturé par'
    )
    cloture_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'soldes_mois'
        verbose_name = 'Solde du mois'
        verbose_name_plural = 'Soldes des mois'
        unique_together = [['mois', 'annee']]
        ordering = ['-annee', '-mois']

    def __str__(self):
        return f'{self.mois:02d}/{self.annee}'

    def calculer_solde(self):
        self.solde_final = self.solde_reporte + self.total_entrees - self.total_depenses

    def recalculer_totaux(self):
        from django.db.models import Sum
        ops = self.get_operations_actives()
        self.total_entrees = ops.filter(nature='ENTREE').aggregate(
            total=Sum('montant')
        )['total'] or Decimal('0.00')
        self.total_depenses = ops.filter(nature='DEPENSE').aggregate(
            total=Sum('montant')
        )['total'] or Decimal('0.00')
        self.calculer_solde()

    def get_operations_actives(self):
        return Operation.objects.filter(mois=self.mois, annee=self.annee, is_deleted=False)


class Operation(models.Model):
    NATURE_CHOICES = [
        ('ENTREE', 'Entrée'),
        ('DEPENSE', 'Dépense'),
    ]

    date_operation = models.DateField(verbose_name='Date')
    nature = models.CharField(max_length=7, choices=NATURE_CHOICES, verbose_name='Nature')
    tiers = models.ForeignKey(
        'tiers.Tiers',
        on_delete=models.PROTECT,
        null=True, blank=True,
        related_name='operations',
        verbose_name='Tiers'
    )
    tiers_libre = models.CharField(
        max_length=200, blank=True, default='',
        verbose_name='Tiers libre'
    )
    montant = models.DecimalField(
        max_digits=15, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Montant'
    )
    commentaire = models.TextField(blank=True, default='', verbose_name='Commentaire')
    mois = models.PositiveSmallIntegerField(verbose_name='Mois')
    annee = models.PositiveIntegerField(verbose_name='Année')
    is_deleted = models.BooleanField(default=False, verbose_name='Supprimé')
    deleted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True, blank=True,
        related_name='operations_deleted',
        verbose_name='Supprimé par'
    )
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='operations_created',
        verbose_name='Créé par'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True, blank=True,
        related_name='operations_updated',
        verbose_name='Modifié par'
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'operations'
        verbose_name = 'Opération'
        verbose_name_plural = 'Opérations'
        ordering = ['date_operation', 'created_at']

    def __str__(self):
        return f'{self.nature} - {self.montant} FCFA ({self.date_operation})'

    def save(self, *args, **kwargs):
        self.mois = self.date_operation.month
        self.annee = self.date_operation.year
        super().save(*args, **kwargs)
