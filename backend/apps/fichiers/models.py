import os
from django.db import models
from django.conf import settings


def upload_piece_jointe(instance, filename):
    op_id = instance.operation.id
    return f'pieces_jointes/operation_{op_id}/{filename}'


class PieceJointe(models.Model):
    operation = models.OneToOneField(
        'operations.Operation',
        on_delete=models.CASCADE,
        related_name='piece_jointe',
        verbose_name='Opération'
    )
    fichier = models.FileField(upload_to=upload_piece_jointe, verbose_name='Fichier')
    nom_original = models.CharField(max_length=255, verbose_name='Nom original')
    taille = models.PositiveIntegerField(verbose_name='Taille (octets)')
    mime_type = models.CharField(max_length=100, verbose_name='Type MIME')
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='pieces_jointes',
        verbose_name='Uploadé par'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pieces_jointes'
        verbose_name = 'Pièce jointe'
        verbose_name_plural = 'Pièces jointes'

    def __str__(self):
        return f'PJ de l\'opération #{self.operation_id} — {self.nom_original}'

    def delete(self, *args, **kwargs):
        # Supprimer le fichier physique à la suppression du modèle
        if self.fichier and os.path.isfile(self.fichier.path):
            os.remove(self.fichier.path)
        super().delete(*args, **kwargs)
