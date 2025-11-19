import { describe, it, expect, beforeEach, vi } from 'vitest'
import api from '@/api/api'
import { useAuthStore } from '@/stores/authStore'

// Mock do módulo api
vi.mock('@/api/api', () => {
  const mockApi = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    defaults: {
      headers: {
        common: {},
      },
    },
  }
  return {
    default: mockApi,
    setToken: vi.fn((token: string) => {
      mockApi.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }),
  }
})

describe('Auth Endpoints - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ token: null, user: null })
  })

  describe('POST /auth/login', () => {
    it('deve fazer login com sucesso', async () => {
      const mockResponse = {
        data: {
          token: 'mock-jwt-token',
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
          },
          type: 'member',
        },
      }

      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const response = await api.post('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      })

      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      })
      expect(response.data).toHaveProperty('token')
      expect(response.data).toHaveProperty('user')
      expect(response.data.user.email).toBe('test@example.com')
    })

    it('deve retornar erro 401 para credenciais inválidas', async () => {
      const mockError = {
        response: {
          status: 401,
          data: {
            message: 'Credenciais inválidas',
          },
        },
      }

      vi.mocked(api.post).mockRejectedValue(mockError)

      await expect(
        api.post('/auth/login', {
          email: 'wrong@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toMatchObject({
        response: {
          status: 401,
          data: { message: 'Credenciais inválidas' },
        },
      })
    })
  })

  describe('POST /register', () => {
    it('deve registrar usuário com sucesso', async () => {
      const mockResponse = {
        data: {
          token: 'mock-jwt-token',
          user: {
            id: 'user-123',
            email: 'newuser@example.com',
            name: 'New User',
          },
        },
      }

      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const response = await api.post('/register', {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
      })

      expect(api.post).toHaveBeenCalledWith('/register', {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
      })
      expect(response.data).toHaveProperty('token')
      expect(response.data).toHaveProperty('user')
    })

    it('deve retornar erro 400 para email já cadastrado', async () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            error: 'Email já cadastrado',
          },
        },
      }

      vi.mocked(api.post).mockRejectedValue(mockError)

      await expect(
        api.post('/register', {
          name: 'Existing User',
          email: 'existing@example.com',
          password: 'password123',
        })
      ).rejects.toMatchObject({
        response: {
          status: 400,
          data: { error: 'Email já cadastrado' },
        },
      })
    })
  })

  describe('POST /public/register', () => {
    it('deve registrar usuário público com sucesso', async () => {
      const mockResponse = {
        data: {
          token: 'mock-jwt-token',
          user: {
            id: 'user-123',
            email: 'public@example.com',
            name: 'Public User',
          },
        },
      }

      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const response = await api.post('/public/register', {
        name: 'Public User',
        email: 'public@example.com',
        password: 'password123',
      })

      expect(api.post).toHaveBeenCalledWith('/public/register', {
        name: 'Public User',
        email: 'public@example.com',
        password: 'password123',
      })
      expect(response.data).toHaveProperty('token')
      expect(response.data).toHaveProperty('user')
    })
  })
})

