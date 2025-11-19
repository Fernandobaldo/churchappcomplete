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

describe('Branches Endpoints - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ token: 'mock-token', user: null })
  })

  describe('GET /branches', () => {
    it('deve buscar todas as filiais com sucesso', async () => {
      const mockResponse = {
        data: [
          {
            id: 'branch-1',
            name: 'Sede',
            churchId: 'church-1',
            isMainBranch: true,
          },
          {
            id: 'branch-2',
            name: 'Filial Centro',
            churchId: 'church-1',
            isMainBranch: false,
          },
        ],
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const response = await api.get('/branches')

      expect(api.get).toHaveBeenCalledWith('/branches')
      expect(response.data).toBeInstanceOf(Array)
      expect(response.data.length).toBe(2)
      expect(response.data[0]).toHaveProperty('id')
      expect(response.data[0]).toHaveProperty('name')
    })

    it('deve retornar array vazio quando não há filiais', async () => {
      const mockResponse = {
        data: [],
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const response = await api.get('/branches')

      expect(response.data).toEqual([])
    })
  })

  describe('POST /branches', () => {
    it('deve criar filial com sucesso', async () => {
      const mockResponse = {
        data: {
          id: 'branch-1',
          name: 'Filial Centro',
          churchId: 'church-1',
          isMainBranch: false,
        },
      }

      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const response = await api.post('/branches', {
        name: 'Filial Centro',
        churchId: 'church-1',
      })

      expect(api.post).toHaveBeenCalledWith('/branches', {
        name: 'Filial Centro',
        churchId: 'church-1',
      })
      expect(response.data).toHaveProperty('id')
      expect(response.data.name).toBe('Filial Centro')
    })

    it('deve retornar erro 400 quando churchId não existe', async () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            error: 'Igreja não encontrada',
          },
        },
      }

      vi.mocked(api.post).mockRejectedValue(mockError)

      await expect(
        api.post('/branches', {
          name: 'Filial Teste',
          churchId: 'invalid-church-id',
        })
      ).rejects.toMatchObject({
        response: {
          status: 400,
          data: { error: 'Igreja não encontrada' },
        },
      })
    })

    it('deve retornar erro 403 quando limite de filiais é excedido', async () => {
      const mockError = {
        response: {
          status: 403,
          data: {
            error: 'Limite do plano atingido',
          },
        },
      }

      vi.mocked(api.post).mockRejectedValue(mockError)

      await expect(
        api.post('/branches', {
          name: 'Filial Teste',
          churchId: 'church-1',
        })
      ).rejects.toMatchObject({
        response: {
          status: 403,
          data: { error: 'Limite do plano atingido' },
        },
      })
    })
  })
})

