export const exportExcel = (mois, annee) => {
  window.open(`/api/v1/exports/excel/?mois=${mois}&annee=${annee}`, '_blank')
}

export const exportPdf = (mois, annee) => {
  window.open(`/api/v1/exports/pdf/?mois=${mois}&annee=${annee}`, '_blank')
}
