import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

const api = axios.create({
    baseURL: 'http://192.168.1.59:3333',
    // timeout: 10000, // adiciona timeout maior
})

api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

export const setToken = (token: string) => {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

export default api
