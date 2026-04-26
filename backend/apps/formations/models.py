from decimal import Decimal, ROUND_HALF_UP
from django.db import models, transaction
from django.conf import settings
from django.utils import timezone


class Formation(models.Model):
    PROGRAMME_CHOICES = [
        ('INFORMATIQUE', 'Programme Informatique & Management'),
        ('HUMANITAIRE', 'Programme Action Humanitaire'),
    ]
    nom = models.CharField(max_length=200, verbose_name='Nom')
    programme = models.CharField(max_length=20, choices=PROGRAMME_CHOICES, verbose_name='Programme')
    duree = models.CharField(max_length=100, blank=True, verbose_name='Durée')
    prix_base = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='Prix de base (FCFA)')
    is_active = models.BooleanField(default=True, verbose_name='Active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'formations'
        verbose_name = 'Formation'
        verbose_name_plural = 'Formations'
        ordering = ['programme', 'nom']

    def __str__(self):
        return self.nom


class Payeur(models.Model):
    TYPE_CHOICES = [
        ('PARRAIN', 'Parrain'),
        ('ENTREPRISE', 'Entreprise / ONG'),
    ]
    type_payeur = models.CharField(max_length=20, choices=TYPE_CHOICES, verbose_name='Type')
    nom = models.CharField(max_length=200, verbose_name='Nom')
    telephone = models.CharField(max_length=50, blank=True, verbose_name='Téléphone')
    email = models.EmailField(blank=True, verbose_name='Email')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'payeurs'
        verbose_name = 'Payeur'
        verbose_name_plural = 'Payeurs'
        ordering = ['nom']

    def __str__(self):
        return f'{self.nom} ({self.get_type_payeur_display()})'


class Inscription(models.Model):
    CIVILITE_CHOICES = [('M', 'M.'), ('MME', 'Mme'), ('MLLE', 'Mlle')]
    CENTRE_CHOICES = [
        ('OUAGA', 'EPA Ouagadougou'),
        ('BOBO', 'EPA Bobo'),
        ('SAHEL', 'EPA Sahel/Dori'),
    ]
    OPTION_COURS_CHOICES = [
        ('JOUR', 'Jour'),
        ('SOIR', 'Soir'),
        ('EN_LIGNE', 'En ligne'),
    ]
    NIVEAU_CHOICES = [
        ('BEPC', 'BEPC'),
        ('BAC', 'BAC'),
        ('BAC_PLUS', 'BAC+'),
        ('LICENCE', 'Licence'),
        ('M1_M2', 'M1/M2'),
    ]
    STATUT_PRO_CHOICES = [
        ('EMPLOYE_TP', 'Employé à temps plein'),
        ('FREELANCE', 'Employé en free-lance'),
        ('STAGIAIRE', 'Stagiaire'),
        ('ENTREPRENEUR', 'Entrepreneur'),
        ('ETUDIANT', 'Étudiant(e)'),
        ('AUTRE', 'Autre'),
    ]
    QUI_PAYE_CHOICES = [
        ('MOI_MEME', 'Moi-même'),
        ('PARRAIN', 'Mon parrain'),
        ('ENTREPRISE', 'Mon Entreprise/Association/ONG'),
    ]
    STATUT_CHOICES = [
        ('EN_COURS', 'En cours'),
        ('SOLDE', 'Soldé'),
        ('ABANDON', 'Abandon'),
    ]
    BOURSE_CHOICES = [(i, f'{i}%') for i in range(0, 55, 5)]

    # Numéro automatique
    numero = models.CharField(max_length=20, unique=True, editable=False, verbose_name='N° inscription')

    # Identité
    civilite = models.CharField(max_length=5, choices=CIVILITE_CHOICES, verbose_name='Civilité')
    nom = models.CharField(max_length=100, verbose_name='Nom')
    prenom = models.CharField(max_length=200, verbose_name='Prénom(s)')
    date_naissance = models.DateField(null=True, blank=True, verbose_name='Date de naissance')
    lieu_naissance = models.CharField(max_length=200, blank=True, verbose_name='Lieu de naissance')
    telephone = models.CharField(max_length=50, verbose_name='Téléphone')
    email = models.EmailField(blank=True, verbose_name='Email')
    nationalite = models.CharField(max_length=100, blank=True, default='Burkinabè', verbose_name='Nationalité')
    ville = models.CharField(max_length=100, blank=True, verbose_name='Ville')
    quartier = models.CharField(max_length=100, blank=True, verbose_name='Quartier')
    secteur = models.CharField(max_length=50, blank=True, verbose_name='Secteur')
    cnib_numero = models.CharField(max_length=50, blank=True, verbose_name='N° CNIB')
    cnib_date = models.DateField(null=True, blank=True, verbose_name='Date CNIB')
    cnib_lieu = models.CharField(max_length=100, blank=True, verbose_name='Lieu CNIB')
    contact_urgence_nom = models.CharField(max_length=200, blank=True, verbose_name='Contact urgence — Nom')
    contact_urgence_tel = models.CharField(max_length=50, blank=True, verbose_name='Contact urgence — Tél')
    photo = models.ImageField(upload_to='inscriptions/photos/', null=True, blank=True, verbose_name='Photo')

    # Formation
    formation = models.ForeignKey(Formation, on_delete=models.PROTECT, related_name='inscriptions', verbose_name='Formation')
    centre = models.CharField(max_length=10, choices=CENTRE_CHOICES, verbose_name='Centre')
    option_cours = models.CharField(max_length=10, choices=OPTION_COURS_CHOICES, verbose_name='Option cours')

    # Profil
    niveau_etude = models.CharField(max_length=20, choices=NIVEAU_CHOICES, blank=True, verbose_name='Niveau d\'étude')
    statut_professionnel = models.CharField(max_length=20, choices=STATUT_PRO_CHOICES, blank=True, verbose_name='Statut professionnel')
    nom_employeur = models.CharField(max_length=200, blank=True, verbose_name='Employeur')
    projet_apres_formation = models.TextField(blank=True, verbose_name='Projet après formation')

    # Paiement
    qui_paye = models.CharField(max_length=20, choices=QUI_PAYE_CHOICES, default='MOI_MEME', verbose_name='Qui paye')
    payeur = models.ForeignKey(Payeur, on_delete=models.SET_NULL, null=True, blank=True, related_name='inscriptions', verbose_name='Payeur')
    montant_formation = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='Montant formation (FCFA)')
    bourse_pourcentage = models.PositiveSmallIntegerField(default=0, choices=BOURSE_CHOICES, verbose_name='Bourse (%)')
    frais_inscription = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('15000.00'), verbose_name='Frais d\'inscription (FCFA)')
    nombre_tranches = models.PositiveSmallIntegerField(default=1, choices=[(1, '1 tranche'), (2, '2 tranches'), (3, '3 tranches')], verbose_name='Nombre de tranches')

    # Statut
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='EN_COURS', verbose_name='Statut')
    date_inscription = models.DateField(default=timezone.now, verbose_name='Date d\'inscription')

    # Tracking
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='inscriptions_created', verbose_name='Créé par')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'inscriptions'
        verbose_name = 'Inscription'
        verbose_name_plural = 'Inscriptions'
        ordering = ['-date_inscription', '-created_at']

    def __str__(self):
        return f'{self.numero} — {self.prenom} {self.nom}'

    @property
    def montant_net_tranches(self):
        """Reste après frais d'inscription, avec bourse appliquée."""
        reste = self.montant_formation - self.frais_inscription
        if reste < 0:
            reste = Decimal('0')
        reduction = (reste * Decimal(self.bourse_pourcentage) / Decimal('100')).quantize(Decimal('1'), rounding=ROUND_HALF_UP)
        return reste - reduction

    @property
    def montant_total_du(self):
        return self.frais_inscription + self.montant_net_tranches

    @property
    def montant_par_tranche(self):
        if self.nombre_tranches == 0:
            return Decimal('0')
        return (self.montant_net_tranches / self.nombre_tranches).quantize(Decimal('1'), rounding=ROUND_HALF_UP)

    @property
    def total_verse(self):
        return self.versements.aggregate(
            total=models.Sum('montant')
        )['total'] or Decimal('0')

    @property
    def reste_a_payer(self):
        return self.montant_total_du - self.total_verse

    def _generer_numero(self):
        annee = self.date_inscription.year if self.date_inscription else timezone.now().year
        prefix = f'EPA-{annee}-'
        last = (
            Inscription.objects
            .filter(numero__startswith=prefix)
            .order_by('-numero')
            .values_list('numero', flat=True)
            .first()
        )
        seq = int(last.split('-')[-1]) + 1 if last else 1
        return f'{prefix}{seq:03d}'

    def save(self, *args, **kwargs):
        with transaction.atomic():
            if not self.numero:
                self.numero = self._generer_numero()
            super().save(*args, **kwargs)

    def refresh_statut(self):
        """Met à jour le statut selon les tranches payées."""
        tranches = list(self.tranches.all())
        if tranches and all(t.statut == 'PAYE' for t in tranches):
            Inscription.objects.filter(pk=self.pk).update(statut='SOLDE')
        elif self.statut == 'SOLDE':
            Inscription.objects.filter(pk=self.pk).update(statut='EN_COURS')


class Tranche(models.Model):
    STATUT_CHOICES = [
        ('EN_ATTENTE', 'En attente'),
        ('PAYE', 'Payé'),
        ('EN_RETARD', 'En retard'),
    ]
    inscription = models.ForeignKey(Inscription, on_delete=models.CASCADE, related_name='tranches', verbose_name='Inscription')
    numero = models.PositiveSmallIntegerField(verbose_name='N° tranche')
    montant_attendu = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='Montant attendu')
    date_echeance = models.DateField(verbose_name='Date d\'échéance')
    statut = models.CharField(max_length=15, choices=STATUT_CHOICES, default='EN_ATTENTE', verbose_name='Statut')

    class Meta:
        db_table = 'tranches'
        verbose_name = 'Tranche'
        verbose_name_plural = 'Tranches'
        ordering = ['inscription', 'numero']
        unique_together = [['inscription', 'numero']]

    def __str__(self):
        return f'Tranche {self.numero} — {self.inscription.numero}'

    @property
    def montant_verse(self):
        return self.versements.aggregate(total=models.Sum('montant'))['total'] or Decimal('0')

    @property
    def reste(self):
        return self.montant_attendu - self.montant_verse


class Versement(models.Model):
    TYPE_CHOICES = [
        ('FRAIS_INSCRIPTION', "Frais d'inscription"),
        ('TRANCHE', 'Tranche'),
    ]

    inscription = models.ForeignKey(Inscription, on_delete=models.PROTECT, related_name='versements', verbose_name='Inscription')
    tranche = models.ForeignKey(Tranche, on_delete=models.SET_NULL, null=True, blank=True, related_name='versements', verbose_name='Tranche')
    type_versement = models.CharField(max_length=20, choices=TYPE_CHOICES, verbose_name='Type')
    numero_recu = models.CharField(max_length=30, unique=True, editable=False, verbose_name='N° reçu')
    date_versement = models.DateField(verbose_name='Date')
    montant = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='Montant (FCFA)')
    notes = models.TextField(blank=True, verbose_name='Notes')
    operation = models.OneToOneField(
        'operations.Operation',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='versement_formation',
        verbose_name='Opération caisse'
    )
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='versements_created', verbose_name='Caissier')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'versements'
        verbose_name = 'Versement'
        verbose_name_plural = 'Versements'
        ordering = ['-date_versement', '-created_at']

    def __str__(self):
        return f'Reçu {self.numero_recu} — {self.montant} FCFA'

    def _generer_numero_recu(self):
        annee = self.date_versement.year
        prefix = f'REC-{annee}-'
        last = (
            Versement.objects
            .filter(numero_recu__startswith=prefix)
            .order_by('-numero_recu')
            .values_list('numero_recu', flat=True)
            .first()
        )
        seq = int(last.split('-')[-1]) + 1 if last else 1
        return f'{prefix}{seq:04d}'

    def _creer_operation_caisse(self):
        from apps.operations.models import Operation
        inscrit = f'{self.inscription.prenom} {self.inscription.nom}'
        commentaire = f'Reçu {self.numero_recu} — {self.get_type_versement_display()} — {self.inscription.formation.nom}'
        op = Operation.objects.create(
            date_operation=self.date_versement,
            nature='ENTREE',
            tiers_libre=inscrit,
            montant=self.montant,
            commentaire=commentaire,
            created_by=self.created_by,
        )
        return op

    def save(self, *args, **kwargs):
        with transaction.atomic():
            is_new = self.pk is None
            if not self.numero_recu:
                self.numero_recu = self._generer_numero_recu()
            if is_new and not self.operation_id:
                op = self._creer_operation_caisse()
                self.operation = op
            super().save(*args, **kwargs)
            # Mettre à jour le statut de la tranche
            if self.tranche:
                tranche = self.tranche
                if tranche.montant_verse >= tranche.montant_attendu:
                    Tranche.objects.filter(pk=tranche.pk).update(statut='PAYE')
                else:
                    Tranche.objects.filter(pk=tranche.pk).update(statut='EN_ATTENTE')
            # Mettre à jour le statut de l'inscription
            self.inscription.refresh_statut()
