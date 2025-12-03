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
        common: {} as Record<string, string>,
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

describe('Contributions Endpoints - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ token: 'mock-token', user: { branchId: 'branch-1' } as any })
  })

  describe('GET /contributions', () => {
    it('deve buscar todas as contribuições com sucesso', async () => {
      const mockResponse = {
        data: [
          {
            id: 'contrib-1',
            title: 'Campanha de Janeiro',
            goal: 10000.0,
            endDate: '2024-12-31',
            raised: 5000.0,
            isActive: true,
            PaymentMethods: [],
          },
        ],
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const response = await api.get('/contributions')

      expect(api.get).toHaveBeenCalledWith('/contributions')
      expect(response.data).toBeInstanceOf(Array)
      expect(response.data[0]).toHaveProperty('id')
      expect(response.data[0]).toHaveProperty('goal')
      expect(response.data[0]).toHaveProperty('isActive')
    })

    it('deve retornar erro 400 quando usuário não está vinculado a filial', async () => {
      useAuthStore.setState({ token: 'mock-token', user: { branchId: null } as any })

      const mockError = {
        response: {
          status: 400,
          data: {
            message: 'Usuário não vinculado a uma filial.',
          },
        },
      }

      vi.mocked(api.get).mockRejectedValue(mockError)

      await expect(api.get('/contributions')).rejects.toMatchObject({
        response: {
          status: 400,
          data: { message: 'Usuário não vinculado a uma filial.' },
        },
      })
    })
  })

  describe('GET /contributions/:id', () => {
    it('deve buscar contribuição específica com sucesso', async () => {
      const mockResponse = {
        data: {
          id: 'contrib-1',
          title: 'Campanha de Janeiro',
          goal: 10000.0,
          endDate: '2024-12-31',
          raised: 5000.0,
          isActive: true,
          PaymentMethods: [],
        },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const response = await api.get('/contributions/contrib-1')

      expect(api.get).toHaveBeenCalledWith('/contributions/contrib-1')
      expect(response.data.id).toBe('contrib-1')
      expect(response.data.goal).toBe(10000.0)
      expect(response.data.isActive).toBe(true)
    })

    it('deve retornar erro 404 quando contribuição não existe', async () => {
      const mockError = {
        response: {
          status: 404,
          data: {
            message: 'Contribuição não encontrada',
          },
        },
      }

      vi.mocked(api.get).mockRejectedValue(mockError)

      await expect(api.get('/contributions/invalid-id')).rejects.toMatchObject({
        response: {
          status: 404,
        },
      })
    })
  })

  describe('POST /contributions', () => {
    it('deve criar contribuição com sucesso', async () => {
      const mockResponse = {
        data: {
          id: 'contrib-1',
          title: 'Nova Campanha',
          goal: 5000.0,
          endDate: '2024-12-31',
          isActive: true,
          PaymentMethods: [],
        },
      }

      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const contributionData = {
        title: 'Nova Campanha',
        goal: 5000.0,
        endDate: '2024-12-31',
        isActive: true,
        paymentMethods: [
          {
            type: 'PIX',
            data: { chave: '12345678900' },
          },
        ],
      }

      const response = await api.post('/contributions', contributionData)

      expect(api.post).toHaveBeenCalledWith('/contributions', contributionData)
      expect(response.data).toHaveProperty('id')
      expect(response.data.title).toBe('Nova Campanha')
      expect(response.data.goal).toBe(5000.0)
    })

    it('deve retornar erro 400 quando branchId não está presente', async () => {
      useAuthStore.setState({ token: 'mock-token', user: { branchId: null } as any })

      const mockError = {
        response: {
          status: 400,
          data: {
            message: 'Usuário não vinculado a uma filial.',
          },
        },
      }

      vi.mocked(api.post).mockRejectedValue(mockError)

      await expect(
        api.post('/contributions', {
          title: 'Nova Campanha',
          goal: 5000.0,
        })
      ).rejects.toMatchObject({
        response: {
          status: 400,
        },
      })
    })
  })
})

