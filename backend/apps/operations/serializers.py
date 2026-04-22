from rest_framework import serializers
from django.utils import timezone
from .models import Operation, SoldeMois


class OperationSerializer(serializers.ModelSerializer):
    tiers_nom = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    updated_by_name = serializers.CharField(source='updated_by.full_name', read_only=True)
    has_piece_jointe = serializers.SerializerMethodField()

    class Meta:
        model = Operation
        fields = [
            'id', 'date_operation', 'nature', 'tiers', 'tiers_nom', 'tiers_libre',
            'montant', 'commentaire', 'mois', 'annee', 'is_deleted',
            'created_by', 'created_by_name', 'created_at',
            'updated_by', 'updated_by_name', 'updated_at',
            'has_piece_jointe',
        ]
        read_only_fields = [
            'id', 'mois', 'annee', 'is_deleted', 'created_by', 'created_by_name',
            'created_at', 'updated_by', 'updated_by_name', 'updated_at', 'has_piece_jointe',
        ]

    def get_tiers_nom(self, obj):
        if obj.tiers:
            return obj.tiers.nom
        return obj.tiers_libre or ''

    def get_has_piece_jointe(self, obj):
        return hasattr(obj, 'piece_jointe') and obj.piece_jointe is not None

    def validate(self, data):
        if data.get('tiers') and data.get('tiers_libre'):
            raise serializers.ValidationError(
                'Choisissez soit un tiers du référentiel, soit un tiers libre, pas les deux.'
            )
        return data

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data['updated_by'] = self.context['request'].user
        return super().update(instance, validated_data)


class SoldeMoisSerializer(serializers.ModelSerializer):
    cloture_by_name = serializers.CharField(source='cloture_by.full_name', read_only=True)

    class Meta:
        model = SoldeMois
        fields = [
            'id', 'mois', 'annee', 'solde_reporte', 'total_entrees',
            'total_depenses', 'solde_final', 'is_cloture',
            'cloture_by', 'cloture_by_name', 'cloture_at',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'cloture_by_name', 'created_at', 'updated_at']


class SoldeCalculeSerializer(serializers.Serializer):
    mois = serializers.IntegerField()
    annee = serializers.IntegerField()
    solde_reporte = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_entrees = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_depenses = serializers.DecimalField(max_digits=15, decimal_places=2)
    solde_final = serializers.DecimalField(max_digits=15, decimal_places=2)
    is_cloture = serializers.BooleanField()


class ClotureMoisSerializer(serializers.Serializer):
    mois = serializers.IntegerField(min_value=1, max_value=12)
    annee = serializers.IntegerField(min_value=2000)
