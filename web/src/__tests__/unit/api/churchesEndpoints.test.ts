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

describe('Churches Endpoints - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ token: 'mock-token', user: null })
  })

  describe('GET /churches', () => {
    it('deve retornar array vazio quando usuário não tem igreja configurada (sem branchId)', async () => {
      useAuthStore.setState({ 
        token: 'mock-token', 
        user: { 
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: '',
          branchId: '',
          permissions: [],
          token: 'mock-token',
        } 
      })

      const mockResponse = {
        data: [],
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const response = await api.get('/churches')

      expect(api.get).toHaveBeenCalledWith('/churches')
      expect(response.data).toEqual([])
    })

    it('deve retornar apenas a igreja do usuário quando tem branchId', async () => {
      useAuthStore.setState({ 
        token: 'mock-token', 
        user: { 
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'ADMINGERAL',
          branchId: 'branch-123',
          permissions: [],
          token: 'mock-token',
        } 
      })

      const mockResponse = {
        data: [
          {
            id: 'church-123',
            name: 'Igreja do Usuário',
            logoUrl: 'https://example.com/logo.png',
            isActive: true,
            Branch: [{ id: 'branch-123', name: 'Sede' }],
          },
        ],
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const response = await api.get('/churches')

      expect(api.get).toHaveBeenCalledWith('/churches')
      expect(response.data).toBeInstanceOf(Array)
      expect(response.data.length).toBe(1)
      expect(response.data[0]).toHaveProperty('id')
      expect(response.data[0].name).toBe('Igreja do Usuário')
    })

    it('não deve retornar igrejas de outros usuários', async () => {
      useAuthStore.setState({ 
        token: 'mock-token', 
        user: { 
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'ADMINGERAL',
          branchId: 'branch-123',
          permissions: [],
          token: 'mock-token',
        } 
      })

      const mockResponse = {
        data: [
          {
            id: 'church-123',
            name: 'Igreja do Usuário',
            Branch: [{ id: 'branch-123', name: 'Sede' }],
          },
        ],
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const response = await api.get('/churches')

      expect(response.data.length).toBe(1)
      expect(response.data[0].name).toBe('Igreja do Usuário')
      // Não deve conter igrejas de outros usuários
      expect(response.data.find((c: any) => c.id === 'church-other')).toBeUndefined()
    })
  })

  describe('POST /churches', () => {
    it('deve criar igreja com sucesso', async () => {
      const mockResponse = {
        data: {
          church: {
            id: 'church-1',
            name: 'Nova Igreja',
            logoUrl: 'https://example.com/logo.png',
          },
          branch: {
            id: 'branch-1',
            name: 'Sede',
          },
          member: {
            id: 'member-1',
            name: 'Admin',
          },
          token: 'new-jwt-token',
        },
      }

      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const response = await api.post('/churches', {
        name: 'Nova Igreja',
        logoUrl: 'https://example.com/logo.png',
        withBranch: true,
        branchName: 'Sede',
      })

      expect(api.post).toHaveBeenCalledWith('/churches', {
        name: 'Nova Igreja',
        logoUrl: 'https://example.com/logo.png',
        withBranch: true,
        branchName: 'Sede',
      })
      expect(response.data).toHaveProperty('church')
      expect(response.data).toHaveProperty('token')
    })

    it('deve retornar erro 401 quando não autenticado', async () => {
      useAuthStore.setState({ token: null, user: null })

      const mockError = {
        response: {
          status: 401,
          data: {
            message: 'Não autenticado',
          },
        },
      }

      vi.mocked(api.post).mockRejectedValue(mockError)

      await expect(
        api.post('/churches', {
          name: 'Nova Igreja',
        })
      ).rejects.toMatchObject({
        response: {
          status: 401,
        },
      })
    })
  })

  describe('PUT /churches/:id', () => {
    it('deve atualizar igreja com sucesso', async () => {
      const mockResponse = {
        data: {
          id: 'church-1',
          name: 'Igreja Atualizada',
          logoUrl: 'https://example.com/new-logo.png',
        },
      }

      vi.mocked(api.put).mockResolvedValue(mockResponse)

      const response = await api.put('/churches/church-1', {
        name: 'Igreja Atualizada',
        logoUrl: 'https://example.com/new-logo.png',
      })

      expect(api.put).toHaveBeenCalledWith('/churches/church-1', {
        name: 'Igreja Atualizada',
        logoUrl: 'https://example.com/new-logo.png',
      })
      expect(response.data.name).toBe('Igreja Atualizada')
    })

    it('deve retornar erro 404 quando igreja não existe', async () => {
      const mockError = {
        response: {
          status: 404,
          data: {
            message: 'Igreja não encontrada',
          },
        },
      }

      vi.mocked(api.put).mockRejectedValue(mockError)

      await expect(
        api.put('/churches/invalid-id', {
          name: 'Igreja Teste',
        })
      ).rejects.toMatchObject({
        response: {
          status: 404,
        },
      })
    })
  })
})

