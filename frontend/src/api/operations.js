import api from './axios'

export const getOperations = (mois, annee) =>
  api.get('/operations/', { params: { mois, annee } })

export const createOperation = (data) => api.post('/operations/', data)
export const updateOperation = (id, data) => api.put(`/operations/${id}/`, data)
export const deleteOperation = (id) => api.delete(`/operations/${id}/`)

export const getSolde = (mois, annee) =>
  api.get('/operations/solde/', { params: { mois, annee } })

export const cloturerMois = (mois, annee) =>
  api.post('/operations/cloture/', { mois, annee })
