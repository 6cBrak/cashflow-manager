import api from './axios'

export const uploadFichier = (operationId, fichier) => {
  const form = new FormData()
  form.append('operation', operationId)
  form.append('fichier', fichier)
  return api.post('/fichiers/', form, { headers: { 'Content-Type': 'multipart/form-data' } })
}

export const deleteFichier = (id) => api.delete(`/fichiers/${id}/`)
export const getFichierUrl = (id) => `/api/v1/fichiers/${id}/`
