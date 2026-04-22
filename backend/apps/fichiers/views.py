from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import FileResponse
import os

from .models import PieceJointe
from .serializers import PieceJointeSerializer, PieceJointeUploadSerializer


class PieceJointeUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PieceJointeUploadSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        fichier = serializer.validated_data['fichier']
        operation = serializer.validated_data['operation']

        piece = PieceJointe.objects.create(
            operation=operation,
            fichier=fichier,
            nom_original=fichier.name,
            taille=fichier.size,
            mime_type=fichier.content_type,
            uploaded_by=request.user,
        )
        return Response(
            PieceJointeSerializer(piece, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


class PieceJointeDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return PieceJointe.objects.get(pk=pk)
        except PieceJointe.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound('Pièce jointe introuvable.')

    def get(self, request, pk):
        piece = self.get_object(pk)
        if not os.path.isfile(piece.fichier.path):
            return Response({'detail': 'Fichier introuvable sur le serveur.'}, status=404)
        return FileResponse(
            open(piece.fichier.path, 'rb'),
            as_attachment=True,
            filename=piece.nom_original,
            content_type=piece.mime_type,
        )

    def delete(self, request, pk):
        piece = self.get_object(pk)
        if not request.user.is_admin and piece.uploaded_by != request.user:
            return Response(
                {'detail': 'Vous ne pouvez supprimer que vos propres pièces jointes.'},
                status=status.HTTP_403_FORBIDDEN
            )
        piece.delete()
        return Response({'detail': 'Pièce jointe supprimée.'}, status=status.HTTP_200_OK)
