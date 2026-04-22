from rest_framework import serializers
from .models import Tiers


class TiersSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)

    class Meta:
        model = Tiers
        fields = ['id', 'nom', 'is_active', 'created_by_name', 'created_at']
        read_only_fields = ['id', 'created_by_name', 'created_at']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)
