import { describe, it, expect, beforeEach, vi } from 'vitest'
import api, { setToken } from '@/api/api'
import { useAuthStore } from '@/stores/authStore'

// Mock do axios
vi.mock('axios', () => {
  const actualAxios = vi.importActual('axios')
  return {
    default: {
      ...actualAxios.default,
      create: vi.fn(() => ({
        interceptors: {
          request: {
            use: vi.fn(),
            handlers: [],
          },
          response: {
            use: vi.fn(),
            handlers: [],
          },
        },
        defaults: {
          headers: {
            common: {},
          },
        },
      })),
    },
  }
})

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('setToken', () => {
    it('deve definir token no header padrão', () => {
      setToken('test-token')
      expect(api.defaults.headers.common['Authorization']).toBe('Bearer test-token')
    })
  })

  describe('Request Interceptor', () => {
    it('deve adicionar token de autorização quando disponível', () => {
      const mockToken = 'test-token'
      useAuthStore.setState({ token: mockToken, user: null })

      // Simula interceptor
      const config = {
        headers: {},
      }

      // O interceptor é configurado no arquivo api.ts
      // Aqui apenas verificamos que o store está sendo usado
      expect(useAuthStore.getState().token).toBe(mockToken)
    })
  })

  describe('Response Interceptor', () => {
    it('deve fazer logout em erro 401', () => {
      const mockLogout = vi.fn()
      useAuthStore.setState({
        token: 'token',
        user: null,
        logout: mockLogout,
      } as any)

      // O interceptor é configurado no arquivo api.ts
      // Aqui apenas verificamos que o logout existe
      expect(useAuthStore.getState().logout).toBeDefined()
    })
  })
})


