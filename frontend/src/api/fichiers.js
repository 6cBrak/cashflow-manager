import api from './axios'

export const uploadFichier = (operationId, fichier) => {
  const form = new FormData()
  form.append('operation', operationId)
  form.append('fichier', fichier)
  return api.post('/fichiers/', form, { headers: { 'Content-Type': 'multipart/form-data' } })
}

export const deleteFichier = (id) => api.delete(`/fichiers/${id}/`)

export const downloadFichier = async (id, nom) => {
  const response = await api.get(`/fichiers/${id}/`, { responseType: 'blob' })
  const blob = new Blob([response.data], { type: response.headers['content-type'] })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = nom || 'piece_jointe'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(link.href)
}
