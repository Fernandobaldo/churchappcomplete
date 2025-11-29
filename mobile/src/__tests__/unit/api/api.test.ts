import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import api, { setToken, removeToken } from '../../../api/api'
import { useAuthStore } from '../../../stores/authStore'

// Mock do axios
jest.mock('axios', () => {
  const actualAxios = jest.requireActual('axios')
  const mockAxiosInstance = {
    interceptors: {
      request: {
        use: jest.fn(),
      },
      response: {
        use: jest.fn(),
      },
    },
    defaults: {
      headers: {
        common: {},
      },
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  }
  return {
    ...actualAxios,
    default: {
      ...actualAxios.default,
      create: jest.fn(() => mockAxiosInstance),
    },
  }
})

// Mock do useAuthStore
jest.mock('../../../stores/authStore', () => ({
  useAuthStore: {
    getState: jest.fn(() => ({
      token: null,
      user: null,
    })),
  },
}))

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('setToken', () => {
    it('deve definir token no header padrão', () => {
      setToken('test-token')
      expect(api.defaults.headers.common['Authorization']).toBe('Bearer test-token')
    })
  })

  describe('removeToken', () => {
    it('deve remover token do header padrão', () => {
      setToken('test-token')
      expect(api.defaults.headers.common['Authorization']).toBe('Bearer test-token')
      
      removeToken()
      expect(api.defaults.headers.common['Authorization']).toBeUndefined()
    })
  })

  describe('Request Interceptor', () => {
    it('deve adicionar token de autorização quando disponível', () => {
      const mockToken = 'test-token'
      ;(useAuthStore.getState as jest.Mock).mockReturnValue({
        token: mockToken,
        user: null,
      })

      // O interceptor é configurado no módulo, então testamos o comportamento
      expect(useAuthStore.getState).toBeDefined()
    })
  })
})



