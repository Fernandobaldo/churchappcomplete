import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

// Configuração da API base
const getBaseURL = (): string => {
  // Prioridade: variável de ambiente VITE_API_URL > fallback localhost
  if (import.meta.env.VITE_API_URL) {
    if (import.meta.env.DEV) {
      console.log('🌐 Usando API URL da variável de ambiente:', import.meta.env.VITE_API_URL)
    }
    return import.meta.env.VITE_API_URL
  }

  // Fallback para desenvolvimento
  const baseURL = 'http://localhost:3333'
  if (import.meta.env.DEV) {
    console.log('🌐 API Base URL (fallback):', baseURL)
  }
  return baseURL
}

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000, // 30 segundos de timeout (alinhado com Mobile)
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Configuração para garantir processamento correto de JSON
  transformResponse: [(data) => {
    // Garante que a resposta seja processada como JSON
    if (typeof data === 'string') {
      try {
        return JSON.parse(data)
      } catch (e) {
        return data
      }
    }
    return data
  }],
})

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Log da requisição em desenvolvimento
    if (import.meta.env.DEV) {
      console.log('📤 Requisição:', config.method?.toUpperCase(), config.url, {
        baseURL: config.baseURL,
        timeout: config.timeout,
      })
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => {
    // Garante que a resposta seja processada corretamente
    if (response.data) {
      // Se a resposta tiver um formato especial, garante que seja JSON válido
      try {
        // Tenta serializar e desserializar para garantir que é JSON válido
        const data = JSON.parse(JSON.stringify(response.data))
        response.data = data
      } catch (e) {
        console.warn('Erro ao processar resposta:', e)
      }
    }
    return response
  },
  (error) => {
    // Tratamento de erros de rede
    if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      console.error('Erro de rede: Verifique se o servidor está rodando e acessível')
    }

    // Tratamento de erros de timeout
    if (error.code === 'ECONNABORTED') {
      console.error('Timeout: A requisição demorou muito para responder')
    }

    // Tratamento de erros de autenticação
    if (error.response?.status === 401) {
      // Token inválido ou expirado
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }

    // Log detalhado do erro para debug
    if (import.meta.env.DEV) {
      console.error('Erro na requisição:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data,
      })
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

