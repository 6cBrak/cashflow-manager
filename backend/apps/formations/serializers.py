from decimal import Decimal
from rest_framework import serializers
from django.utils import timezone
from .models import Formation, Payeur, Inscription, Tranche, Versement


class FormationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Formation
        fields = ['id', 'nom', 'programme', 'duree', 'prix_base', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class PayeurSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payeur
        fields = ['id', 'type_payeur', 'nom', 'telephone', 'email', 'created_at']
        read_only_fields = ['id', 'created_at']


class TrancheSerializer(serializers.ModelSerializer):
    montant_verse = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    reste = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Tranche
        fields = ['id', 'numero', 'montant_attendu', 'date_echeance', 'statut', 'montant_verse', 'reste']
        read_only_fields = ['id', 'statut', 'montant_verse', 'reste']


class VersementSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    type_versement_label = serializers.CharField(source='get_type_versement_display', read_only=True)
    tranche_numero = serializers.IntegerField(source='tranche.numero', read_only=True)

    class Meta:
        model = Versement
        fields = [
            'id', 'inscription', 'tranche', 'tranche_numero',
            'type_versement', 'type_versement_label',
            'numero_recu', 'date_versement', 'montant', 'notes',
            'created_by', 'created_by_name', 'created_at',
        ]
        read_only_fields = ['id', 'numero_recu', 'created_by', 'created_by_name', 'created_at', 'type_versement_label', 'tranche_numero']

    def validate(self, data):
        inscription = data.get('inscription')
        tranche = data.get('tranche')
        type_versement = data.get('type_versement')
        montant = data.get('montant', Decimal('0'))

        if montant <= 0:
            raise serializers.ValidationError('Le montant doit être supérieur à 0.')

        if type_versement == 'TRANCHE' and not tranche:
            raise serializers.ValidationError('Sélectionnez la tranche concernée.')

        if tranche and tranche.inscription != inscription:
            raise serializers.ValidationError('La tranche ne correspond pas à cette inscription.')

        return data

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class InscriptionListSerializer(serializers.ModelSerializer):
    """Serializer allégé pour la liste."""
    formation_nom = serializers.CharField(source='formation.nom', read_only=True)
    programme = serializers.CharField(source='formation.programme', read_only=True)
    montant_total_du = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_verse = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    reste_a_payer = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)

    class Meta:
        model = Inscription
        fields = [
            'id', 'numero', 'civilite', 'nom', 'prenom', 'telephone',
            'formation_nom', 'programme', 'centre', 'option_cours',
            'statut', 'date_inscription',
            'montant_total_du', 'total_verse', 'reste_a_payer',
            'bourse_pourcentage', 'created_by_name',
        ]


class InscriptionDetailSerializer(serializers.ModelSerializer):
    """Serializer complet pour la fiche."""
    formation_nom = serializers.CharField(source='formation.nom', read_only=True)
    programme = serializers.CharField(source='formation.programme', read_only=True)
    payeur_nom = serializers.CharField(source='payeur.nom', read_only=True)
    payeur_tel = serializers.CharField(source='payeur.telephone', read_only=True)
    montant_net_tranches = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    montant_total_du = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    montant_par_tranche = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_verse = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    reste_a_payer = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    tranches = TrancheSerializer(many=True, read_only=True)
    versements = VersementSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)

    class Meta:
        model = Inscription
        fields = [
            'id', 'numero',
            # Identité
            'civilite', 'nom', 'prenom', 'date_naissance', 'lieu_naissance',
            'telephone', 'email', 'nationalite', 'ville', 'quartier', 'secteur',
            'cnib_numero', 'cnib_date', 'cnib_lieu',
            'contact_urgence_nom', 'contact_urgence_tel', 'photo',
            # Formation
            'formation', 'formation_nom', 'programme', 'centre', 'option_cours',
            # Profil
            'niveau_etude', 'statut_professionnel', 'nom_employeur', 'projet_apres_formation',
            # Paiement
            'qui_paye', 'payeur', 'payeur_nom', 'payeur_tel',
            'montant_formation', 'bourse_pourcentage', 'frais_inscription', 'nombre_tranches',
            'montant_net_tranches', 'montant_total_du', 'montant_par_tranche',
            'total_verse', 'reste_a_payer',
            # Statut
            'statut', 'date_inscription',
            # Relations
            'tranches', 'versements',
            # Tracking
            'created_by', 'created_by_name', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'numero', 'montant_net_tranches', 'montant_total_du', 'montant_par_tranche',
            'total_verse', 'reste_a_payer', 'tranches', 'versements',
            'created_by', 'created_by_name', 'created_at', 'updated_at',
        ]

    def create(self, validated_data):
        from datetime import timedelta
        request = self.context['request']
        validated_data['created_by'] = request.user

        inscription = Inscription(**validated_data)
        # Calculer le montant par tranche avant save
        montant_par_tranche = inscription.montant_par_tranche
        nombre_tranches = inscription.nombre_tranches
        date_base = inscription.date_inscription

        inscription.save()

        # Créer les tranches automatiquement
        for i in range(1, nombre_tranches + 1):
            date_echeance = date_base.replace(
                month=((date_base.month - 1 + i) % 12) + 1,
                year=date_base.year + ((date_base.month - 1 + i) // 12)
            )
            Tranche.objects.create(
                inscription=inscription,
                numero=i,
                montant_attendu=montant_par_tranche,
                date_echeance=date_echeance,
            )

        return inscription
