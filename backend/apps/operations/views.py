from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Sum
from decimal import Decimal

from .models import Operation, SoldeMois
from .serializers import (
    OperationSerializer, SoldeMoisSerializer,
    SoldeCalculeSerializer, ClotureMoisSerializer
)
from apps.authentication.permissions import IsAdmin


def get_or_create_solde_mois(mois, annee):
    solde, _ = SoldeMois.objects.get_or_create(mois=mois, annee=annee)
    return solde


def get_solde_reporte(mois, annee):
    """Récupère le solde final du mois précédent."""
    if mois == 1:
        mois_prec, annee_prec = 12, annee - 1
    else:
        mois_prec, annee_prec = mois - 1, annee
    try:
        solde_prec = SoldeMois.objects.get(mois=mois_prec, annee=annee_prec)
        return solde_prec.solde_final
    except SoldeMois.DoesNotExist:
        return Decimal('0.00')


class OperationListCreateView(generics.ListCreateAPIView):
    serializer_class = OperationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        mois = self.request.query_params.get('mois')
        annee = self.request.query_params.get('annee')
        qs = Operation.objects.filter(is_deleted=False).select_related(
            'tiers', 'created_by', 'updated_by', 'piece_jointe'
        )
        if mois:
            qs = qs.filter(mois=mois)
        if annee:
            qs = qs.filter(annee=annee)
        return qs

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        date_op = serializer.validated_data['date_operation']
        mois, annee = date_op.month, date_op.year

        solde_mois = get_or_create_solde_mois(mois, annee)
        if solde_mois.is_cloture:
            return Response(
                {'detail': f'Le mois {mois:02d}/{annee} est clôturé et ne peut plus être modifié.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        operation = serializer.save()
        solde_mois.recalculer_totaux()
        solde_mois.save()

        return Response(serializer.data, status=status.HTTP_201_CREATED)


class OperationDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = OperationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Operation.objects.filter(is_deleted=False).select_related(
            'tiers', 'created_by', 'updated_by', 'piece_jointe'
        )

    def check_mois_cloture(self, operation):
        try:
            solde = SoldeMois.objects.get(mois=operation.mois, annee=operation.annee)
            return solde.is_cloture
        except SoldeMois.DoesNotExist:
            return False

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if request.method in ('PUT', 'PATCH'):
            if not request.user.is_admin and obj.created_by != request.user:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied('Vous ne pouvez modifier que vos propres saisies.')

    def update(self, request, *args, **kwargs):
        operation = self.get_object()
        if self.check_mois_cloture(operation):
            return Response(
                {'detail': 'Ce mois est clôturé et ne peut plus être modifié.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        response = super().update(request, *args, **kwargs)
        solde_mois = get_or_create_solde_mois(operation.mois, operation.annee)
        solde_mois.recalculer_totaux()
        solde_mois.save()
        return response

    def destroy(self, request, *args, **kwargs):
        if not request.user.is_admin:
            return Response(
                {'detail': 'Seul un administrateur peut supprimer une opération.'},
                status=status.HTTP_403_FORBIDDEN
            )
        operation = self.get_object()
        if self.check_mois_cloture(operation):
            return Response(
                {'detail': 'Ce mois est clôturé et ne peut plus être modifié.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        operation.is_deleted = True
        operation.deleted_by = request.user
        operation.deleted_at = timezone.now()
        operation.save(update_fields=['is_deleted', 'deleted_by', 'deleted_at'])

        solde_mois = get_or_create_solde_mois(operation.mois, operation.annee)
        solde_mois.recalculer_totaux()
        solde_mois.save()

        return Response({'detail': 'Opération supprimée.'}, status=status.HTTP_200_OK)


class SoldeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        mois = request.query_params.get('mois')
        annee = request.query_params.get('annee')
        if not mois or not annee:
            return Response(
                {'detail': 'Les paramètres mois et annee sont requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            mois = int(mois)
            annee = int(annee)
        except ValueError:
            return Response({'detail': 'mois et annee doivent être des entiers.'}, status=400)

        solde = get_or_create_solde_mois(mois, annee)
        if not solde.is_cloture:
            solde.solde_reporte = get_solde_reporte(mois, annee)
            solde.recalculer_totaux()
            solde.save()

        data = {
            'mois': mois,
            'annee': annee,
            'solde_reporte': solde.solde_reporte,
            'total_entrees': solde.total_entrees,
            'total_depenses': solde.total_depenses,
            'solde_final': solde.solde_final,
            'is_cloture': solde.is_cloture,
        }
        return Response(data)


class ClotureMoisView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request):
        serializer = ClotureMoisSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        mois = serializer.validated_data['mois']
        annee = serializer.validated_data['annee']

        solde = get_or_create_solde_mois(mois, annee)
        if solde.is_cloture:
            return Response(
                {'detail': f'Le mois {mois:02d}/{annee} est déjà clôturé.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        solde.solde_reporte = get_solde_reporte(mois, annee)
        solde.recalculer_totaux()
        solde.is_cloture = True
        solde.cloture_by = request.user
        solde.cloture_at = timezone.now()
        solde.save()

        # Pré-créer le solde du mois suivant avec le report
        if mois == 12:
            mois_suiv, annee_suiv = 1, annee + 1
        else:
            mois_suiv, annee_suiv = mois + 1, annee
        suivant, created = SoldeMois.objects.get_or_create(mois=mois_suiv, annee=annee_suiv)
        if not suivant.is_cloture:
            suivant.solde_reporte = solde.solde_final
            suivant.calculer_solde()
            suivant.save()

        return Response(SoldeMoisSerializer(solde).data, status=status.HTTP_200_OK)
