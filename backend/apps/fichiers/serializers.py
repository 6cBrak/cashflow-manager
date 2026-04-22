import os
from rest_framework import serializers
from django.conf import settings
from .models import PieceJointe


class PieceJointeSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.full_name', read_only=True)
    url = serializers.SerializerMethodField()

    class Meta:
        model = PieceJointe
        fields = [
            'id', 'operation', 'nom_original', 'taille', 'mime_type',
            'uploaded_by', 'uploaded_by_name', 'created_at', 'url',
        ]
        read_only_fields = ['id', 'nom_original', 'taille', 'mime_type', 'uploaded_by', 'created_at', 'url']

    def get_url(self, obj):
        request = self.context.get('request')
        if obj.fichier and request:
            return request.build_absolute_uri(obj.fichier.url)
        return None


class PieceJointeUploadSerializer(serializers.Serializer):
    operation = serializers.PrimaryKeyRelatedField(
        queryset=__import__('apps.operations.models', fromlist=['Operation']).Operation.objects.filter(is_deleted=False)
    )
    fichier = serializers.FileField()

    def validate_fichier(self, value):
        ext = os.path.splitext(value.name)[1].lower()
        allowed_ext = getattr(settings, 'ALLOWED_UPLOAD_EXTENSIONS', ['.pdf', '.jpg', '.jpeg', '.png'])
        allowed_mime = getattr(settings, 'ALLOWED_UPLOAD_MIME_TYPES', ['application/pdf', 'image/jpeg', 'image/png'])
        max_size = 5 * 1024 * 1024  # 5 MB

        if ext not in allowed_ext:
            raise serializers.ValidationError(
                f'Extension non autorisée. Extensions acceptées : {", ".join(allowed_ext)}'
            )
        if value.content_type not in allowed_mime:
            raise serializers.ValidationError(
                f'Type MIME non autorisé. Types acceptés : {", ".join(allowed_mime)}'
            )
        if value.size > max_size:
            raise serializers.ValidationError(
                f'Fichier trop volumineux. Taille max : 5 Mo. Taille reçue : {value.size // 1024} Ko.'
            )
        return value

    def validate(self, data):
        operation = data.get('operation')
        if hasattr(operation, 'piece_jointe'):
            raise serializers.ValidationError(
                {'operation': 'Cette opération possède déjà une pièce jointe.'}
            )
        return data
