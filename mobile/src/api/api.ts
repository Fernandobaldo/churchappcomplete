import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

// Configuração da API base
// Prioridade: variável de ambiente > IP detectado > fallback
const getBaseURL = (): string => {
  // 1. Verificar variável de ambiente (melhor opção)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL
  }

  // 2. Para desenvolvimento, você pode detectar o IP automaticamente
  // ou usar um IP padrão de desenvolvimento
  const devIP = '172.20.10.2' // Seu IP atual de desenvolvimento
  // Alternativas comentadas:
  // const devIP = '192.168.1.13'
  // const devIP = '10.22.1.23'
  
  return `http://${devIP}:3333`
}

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000, // 10 segundos de timeout
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Tratamento de erros de rede
    if (error.message === 'Network Error') {
      console.error('Erro de rede: Verifique se o servidor está rodando e acessível')
      // Você pode mostrar um toast aqui
    }
    
    // Tratamento de erros de autenticação
    if (error.response?.status === 401) {
      // Token inválido ou expirado
      useAuthStore.getState().logout?.() // Se tiver método de logout
    }
    
    return Promise.reject(error)
  }
)

export const setToken = (token: string) => {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

export const removeToken = () => {
  delete api.defaults.headers.common['Authorization']
}

export default api
