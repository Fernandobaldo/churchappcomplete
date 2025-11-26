import axios from 'axios'
import { Platform } from 'react-native'
import { useAuthStore } from '../stores/authStore'

// Configuração da API base
// Prioridade: variável de ambiente > IP detectado > fallback
const getBaseURL = (): string => {
  // 1. Verificar variável de ambiente (melhor opção)
  if (process.env.EXPO_PUBLIC_API_URL) {
    console.log('📱 Usando API URL da variável de ambiente:', process.env.EXPO_PUBLIC_API_URL)
    return process.env.EXPO_PUBLIC_API_URL
  }

  // 2. Para desenvolvimento, você pode detectar o IP automaticamente
  // ou usar um IP padrão de desenvolvimento
  // IMPORTANTE: Use o IP da sua máquina na mesma rede do dispositivo móvel
  // Para descobrir seu IP: ifconfig (macOS/Linux) ou ipconfig (Windows)
  // Procure por "inet" na interface en0 (WiFi) ou en1 (Ethernet)
  
  // Opções de IP (descomente a que corresponde à sua rede):
  // const devIP = '172.20.10.2' // WiFi hotspot
  // const devIP = '192.168.1.13' // Rede local comum
  // const devIP = '10.22.1.23' // Rede local alternativa
  // const devIP = 'localhost' // Apenas para emulador Android (não funciona em dispositivo físico)
  
  // Para Expo Go em dispositivo físico, você PRECISA usar o IP da sua máquina
  // Para emulador Android, pode usar '10.0.2.2' (localhost do emulador)
  // Para iOS Simulator, pode usar 'localhost'
  
  // IMPORTANTE: Atualize este IP com o IP da sua máquina na rede local
  // Para descobrir: ifconfig (macOS/Linux) ou ipconfig (Windows)
  // O IP encontrado foi: 192.168.1.7
  
  // Detecção automática do IP baseado na plataforma
  // IMPORTANTE: Se estiver usando Expo Go em dispositivo físico, você PRECISA usar o IP da sua máquina
  // Para descobrir seu IP: ifconfig (macOS/Linux) ou ipconfig (Windows)
  // Procure pelo IP na interface en0 (WiFi) ou en1 (Ethernet)
  
  let devIP: string
  if (Platform.OS === 'android') {
    // Emulador Android usa este IP especial para localhost
    // Para dispositivo físico Android, use o IP da sua máquina (ex: '192.168.1.7')
    devIP = '10.0.2.2'
  } else if (Platform.OS === 'ios') {
    // iOS Simulator pode usar localhost
    // Para dispositivo físico iOS, use o IP da sua máquina (ex: '192.168.1.7')
    // Nota: __DEV__ pode não funcionar corretamente em todos os casos
    // Se tiver problemas, force o IP da sua máquina aqui
    devIP = '192.168.1.7' // Atualize com o IP da sua máquina se necessário
  } else {
    // Web ou outras plataformas
    devIP = '192.168.1.7'
  }
  
  const baseURL = `http://${devIP}:3333`
  console.log('📱 API Base URL:', baseURL, '(Platform:', Platform.OS + ', Dev:', __DEV__ + ')')
  return baseURL
}

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000, // 30 segundos de timeout (aumentado para debug)
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
    }
    
    // Log detalhado do erro para debug
    if (process.env.NODE_ENV === 'development') {
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
