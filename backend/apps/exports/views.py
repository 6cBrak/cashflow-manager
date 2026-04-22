from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .excel import generate_excel, MOIS_FR
from .pdf import generate_pdf


class ExportExcelView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        mois, annee, error = self._get_params(request)
        if error:
            return error
        buf = generate_excel(mois, annee)
        filename = f'journal_caisse_{MOIS_FR[mois]}_{annee}.xlsx'
        response = HttpResponse(
            buf.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    def _get_params(self, request):
        mois = request.query_params.get('mois')
        annee = request.query_params.get('annee')
        if not mois or not annee:
            return None, None, Response(
                {'detail': 'Les paramètres mois et annee sont requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            mois = int(mois)
            annee = int(annee)
            if not (1 <= mois <= 12):
                raise ValueError
        except ValueError:
            return None, None, Response(
                {'detail': 'mois (1-12) et annee doivent être des entiers valides.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return mois, annee, None


class ExportPDFView(APIView):
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
            return Response({'detail': 'Paramètres invalides.'}, status=400)

        try:
            pdf_bytes = generate_pdf(mois, annee)
        except ImportError as e:
            return Response({'detail': str(e)}, status=500)

        filename = f'journal_caisse_{MOIS_FR[mois]}_{annee}.pdf'
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
