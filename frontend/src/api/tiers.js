import api from './axios'

export const getTiers = (q = '') => api.get('/tiers/', { params: q ? { search: q } : {} })
export const createTiers = (data) => api.post('/tiers/', data)
export const updateTiers = (id, data) => api.put(`/tiers/${id}/`, data)
export const deleteTiers = (id) => api.delete(`/tiers/${id}/`)
