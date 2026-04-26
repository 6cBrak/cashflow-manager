import io
from django.http import HttpResponse
from django.template.loader import render_to_string
from django.utils import timezone
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Formation, Payeur, Inscription, Versement
from .serializers import (
    FormationSerializer, PayeurSerializer,
    InscriptionListSerializer, InscriptionDetailSerializer,
    VersementSerializer,
)


class FormationViewSet(viewsets.ModelViewSet):
    queryset = Formation.objects.all()
    serializer_class = FormationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nom', 'programme']
    ordering_fields = ['nom', 'programme', 'prix_base']

    def get_queryset(self):
        qs = super().get_queryset()
        actif = self.request.query_params.get('actif')
        if actif == 'true':
            qs = qs.filter(is_active=True)
        programme = self.request.query_params.get('programme')
        if programme:
            qs = qs.filter(programme=programme)
        return qs


class PayeurViewSet(viewsets.ModelViewSet):
    queryset = Payeur.objects.all()
    serializer_class = PayeurSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['nom', 'telephone']


class InscriptionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nom', 'prenom', 'telephone', 'numero', 'formation__nom']
    ordering_fields = ['date_inscription', 'nom', 'statut']

    def get_queryset(self):
        qs = Inscription.objects.select_related(
            'formation', 'payeur', 'created_by'
        ).prefetch_related('tranches', 'versements')

        statut = self.request.query_params.get('statut')
        if statut:
            qs = qs.filter(statut=statut)

        centre = self.request.query_params.get('centre')
        if centre:
            qs = qs.filter(centre=centre)

        formation = self.request.query_params.get('formation')
        if formation:
            qs = qs.filter(formation_id=formation)

        annee = self.request.query_params.get('annee')
        if annee:
            qs = qs.filter(date_inscription__year=annee)

        return qs

    def get_serializer_class(self):
        if self.action in ('retrieve', 'create', 'update', 'partial_update'):
            return InscriptionDetailSerializer
        return InscriptionListSerializer

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        from django.db.models import Sum, Count, Q
        from decimal import Decimal

        qs = self.get_queryset()
        today = timezone.now().date()

        total_inscrits = qs.count()
        soldes = qs.filter(statut='SOLDE').count()
        en_cours = qs.filter(statut='EN_COURS').count()

        versements_total = Versement.objects.filter(
            inscription__in=qs
        ).aggregate(total=Sum('montant'))['total'] or Decimal('0')

        # Tranches en retard
        from .models import Tranche
        retards = Tranche.objects.filter(
            inscription__in=qs,
            statut__in=['EN_ATTENTE', 'EN_RETARD'],
            date_echeance__lt=today,
        ).count()

        return Response({
            'total_inscrits': total_inscrits,
            'soldes': soldes,
            'en_cours': en_cours,
            'retards': retards,
            'total_encaisse': versements_total,
        })

    @action(detail=True, methods=['get'], url_path='recu/(?P<versement_id>[0-9]+)')
    def recu(self, request, pk=None, versement_id=None):
        inscription = self.get_object()
        try:
            versement = inscription.versements.get(pk=versement_id)
        except Versement.DoesNotExist:
            return Response({'detail': 'Versement introuvable.'}, status=404)

        try:
            from xhtml2pdf import pisa
        except ImportError:
            return Response({'detail': 'xhtml2pdf non installé.'}, status=500)

        context = {
            'versement': versement,
            'inscription': inscription,
            'formation': inscription.formation,
        }
        html = render_to_string('formations/recu_versement.html', context)
        buf = io.BytesIO()
        result = pisa.CreatePDF(io.StringIO(html), dest=buf, encoding='utf-8')
        if result.err:
            return Response({'detail': 'Erreur génération PDF.'}, status=500)

        filename = f'recu_{versement.numero_recu}.pdf'
        response = HttpResponse(buf.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response


class VersementViewSet(viewsets.ModelViewSet):
    queryset = Versement.objects.select_related(
        'inscription', 'inscription__formation', 'tranche', 'created_by'
    )
    serializer_class = VersementSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        qs = super().get_queryset()
        inscription_id = self.request.query_params.get('inscription')
        if inscription_id:
            qs = qs.filter(inscription_id=inscription_id)
        return qs
