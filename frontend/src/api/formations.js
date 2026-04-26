import api from './axios'

// Formations
export const getFormations = (params = {}) => api.get('/formations/', { params })
export const createFormation = (data) => api.post('/formations/', data)
export const updateFormation = (id, data) => api.put(`/formations/${id}/`, data)
export const deleteFormation = (id) => api.delete(`/formations/${id}/`)

// Payeurs
export const getPayeurs = (search = '') => api.get('/payeurs/', { params: { search } })
export const createPayeur = (data) => api.post('/payeurs/', data)

// Inscriptions
export const getInscriptions = (params = {}) => api.get('/inscriptions/', { params })
export const getInscription = (id) => api.get(`/inscriptions/${id}/`)
export const createInscription = (data) => api.post('/inscriptions/', data)
export const updateInscription = (id, data) => api.patch(`/inscriptions/${id}/`, data)
export const getStatsInscriptions = (params = {}) => api.get('/inscriptions/stats/', { params })
export const getRecuPdf = (inscriptionId, versementId) =>
  api.get(`/inscriptions/${inscriptionId}/recu/${versementId}/`, { responseType: 'blob' })

// Versements
export const createVersement = (data) => api.post('/versements/', data)
