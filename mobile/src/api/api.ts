import axios from 'axios'
import { Platform } from 'react-native'
import Constants from 'expo-constants'
import { useAuthStore } from '../stores/authStore'
import { resetToLogin } from '../navigation/navigationRef'

// Configuração da API base
// Prioridade: variável de ambiente EXPO_PUBLIC_API_URL > app.config.js extra > fallback
const getBaseURL = (): string => {
  // 1. Verificar variável de ambiente EXPO_PUBLIC_API_URL (mais alta prioridade)
  // O Expo SDK 54+ expõe automaticamente variáveis EXPO_PUBLIC_* para process.env
  const envApiUrl = process.env.EXPO_PUBLIC_API_URL
  if (envApiUrl) {
    console.log('✅ [API] Usando EXPO_PUBLIC_API_URL:', envApiUrl)
    return envApiUrl
  }

  // 2. Verificar configuração do app.config.js via Constants
  const configApiUrl = Constants.expoConfig?.extra?.apiUrl
  if (configApiUrl) {
    console.log('✅ [API] Usando apiUrl do app.config.js:', configApiUrl)
    return configApiUrl
  }

  // 3. Fallback baseado na plataforma
  let fallbackUrl = 'http://localhost:3333'
  if (Platform.OS === 'android') {
    // Emulador Android usa este IP especial para localhost
    fallbackUrl = 'http://10.0.2.2:3333'
  }
  
  console.warn('⚠️ [API] Usando fallback:', fallbackUrl)
  console.warn('⚠️ [API] Configure EXPO_PUBLIC_API_URL no arquivo .env para evitar usar fallback')
  return fallbackUrl
}

// Obter URL base
const baseURL = getBaseURL()

// Log de debug completo (apenas em desenvolvimento)
if (__DEV__) {
  console.log('🔍 [API DEBUG] ====================')
  console.log('🔍 [API DEBUG] URL Base configurada:', baseURL)
  console.log('🔍 [API DEBUG] EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL || '(não definido)')
  console.log('🔍 [API DEBUG] Constants.expoConfig?.extra?.apiUrl:', Constants.expoConfig?.extra?.apiUrl || '(não definido)')
  console.log('🔍 [API DEBUG] Platform.OS:', Platform.OS)
  console.log('🔍 [API DEBUG] ====================')
}

const api = axios.create({
  baseURL: baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Configuração para React Native
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
    if (__DEV__) {
      console.log(`📤 [API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`)
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
    // Remove qualquer propriedade que possa causar problemas no React Native
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
      console.error('❌ [API] Erro de rede: Verifique se o servidor está rodando e acessível')
      console.error('❌ [API] URL tentada:', error.config?.baseURL + error.config?.url)
    }
    
    // Tratamento de erros de timeout
    if (error.code === 'ECONNABORTED') {
      console.error('❌ [API] Timeout: A requisição demorou muito para responder')
      console.error('❌ [API] URL tentada:', error.config?.baseURL + error.config?.url)
      console.error('❌ [API] Verifique se a URL está correta e o servidor está acessível')
    }
    
    // Tratamento de erros de autenticação
    if (error.response?.status === 401) {
      resetToLogin()
      return Promise.reject(error)
    }
    
    // Log detalhado do erro para debug
    if (__DEV__) {
      console.error('❌ [API] Erro na requisição:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        url: error.config?.baseURL + error.config?.url,
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

// ==================== SUBSCRIPTIONS ====================
export const subscriptionApi = {
  checkout: async (planId: string, trialDays?: number) => {
    const response = await api.post('/api/subscriptions/checkout', {
      planId,
      trialDays,
    })
    return response.data
  },
  getMySubscription: async () => {
    const response = await api.get('/api/subscriptions')
    return response.data
  },
  cancel: async (cancelAtPeriodEnd = true) => {
    const response = await api.post('/api/subscriptions/cancel', {
      cancelAtPeriodEnd,
    })
    return response.data
  },
  resume: async () => {
    const response = await api.post('/api/subscriptions/resume')
    return response.data
  },
}

// ==================== PLANS ====================
export const plansApi = {
  getAll: async () => {
    const response = await api.get('/plans')
    return response.data
  },
}

export default api
