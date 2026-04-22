import api from './axios'

export const login = (email, password) => api.post('/auth/login/', { email, password })
export const logout = (refresh) => api.post('/auth/logout/', { refresh })
export const getMe = () => api.get('/auth/me/')
export const changePassword = (data) => api.post('/auth/change-password/', data)
export const getUsers = () => api.get('/auth/users/')
export const createUser = (data) => api.post('/auth/users/', data)
export const updateUser = (id, data) => api.put(`/auth/users/${id}/`, data)
export const deleteUser = (id) => api.delete(`/auth/users/${id}/`)
