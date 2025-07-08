import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

const api = axios.create({
    baseURL: 'http://172.20.10.2:3333',
    //10.22.1.23
    //192.168.1.13
    //172.20.10.2
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
