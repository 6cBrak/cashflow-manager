import api from './axios'

async function downloadBlob(url, filename) {
  const response = await api.get(url, { responseType: 'blob' })
  const blob = new Blob([response.data], { type: response.headers['content-type'] })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(link.href)
}

const MOIS_FR = ['', 'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre']

export const exportExcel = (mois, annee) =>
  downloadBlob(
    `/exports/excel/?mois=${mois}&annee=${annee}`,
    `journal_caisse_${MOIS_FR[mois]}_${annee}.xlsx`
  )

export const exportPdf = (mois, annee) =>
  downloadBlob(
    `/exports/pdf/?mois=${mois}&annee=${annee}`,
    `journal_caisse_${MOIS_FR[mois]}_${annee}.pdf`
  )
