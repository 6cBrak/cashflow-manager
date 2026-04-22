import io
from decimal import Decimal
from django.template.loader import render_to_string
from apps.operations.models import Operation, SoldeMois

MOIS_FR = [
    '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]


def generate_pdf(mois: int, annee: int) -> bytes:
    try:
        solde_obj = SoldeMois.objects.get(mois=mois, annee=annee)
        solde_reporte = solde_obj.solde_reporte
        total_entrees = solde_obj.total_entrees
        total_depenses = solde_obj.total_depenses
        solde_final = solde_obj.solde_final
    except SoldeMois.DoesNotExist:
        solde_reporte = Decimal('0.00')
        total_entrees = Decimal('0.00')
        total_depenses = Decimal('0.00')
        solde_final = Decimal('0.00')

    operations = Operation.objects.filter(
        mois=mois, annee=annee, is_deleted=False
    ).select_related('tiers', 'piece_jointe').order_by('date_operation', 'created_at')

    context = {
        'mois_label': MOIS_FR[mois],
        'mois': mois,
        'annee': annee,
        'organisation': 'EPA_OUAGA',
        'solde_reporte': solde_reporte,
        'total_entrees': total_entrees,
        'total_depenses': total_depenses,
        'solde_final': solde_final,
        'operations': operations,
    }
    html = render_to_string('exports/journal_pdf.html', context)

    try:
        from weasyprint import HTML
        pdf_bytes = HTML(string=html).write_pdf()
    except ImportError:
        raise ImportError(
            'WeasyPrint n\'est pas installé. Installez-le avec: pip install WeasyPrint'
        )
    return pdf_bytes
