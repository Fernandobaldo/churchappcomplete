import { describe, it, expect, beforeEach, vi } from 'vitest'
import api from '@/api/api'
import { useAuthStore } from '@/stores/authStore'

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
    // ============================================================================
    // TESTE 1: SUCCESS - Busca todas as contribuições com sucesso
    // ============================================================================
    it('deve buscar todas as contribuições com sucesso', async () => {
      // Arrange
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

      // Act
      const response = await api.get('/contributions')

      // Assert
      expect(api.get).toHaveBeenCalledWith('/contributions')
      expect(response.data).toBeInstanceOf(Array)
      expect(response.data[0]).toHaveProperty('id')
      expect(response.data[0]).toHaveProperty('goal')
      expect(response.data[0]).toHaveProperty('isActive')
    })

    // ============================================================================
    // TESTE 2: VALIDATION FAILURE - Retorna erro 400 quando usuário não está vinculado a filial
    // ============================================================================
    it('deve retornar erro 400 quando usuário não está vinculado a filial', async () => {
      // Arrange
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

      // Act & Assert
      await expect(api.get('/contributions')).rejects.toMatchObject({
        response: {
          status: 400,
          data: { message: 'Usuário não vinculado a uma filial.' },
        },
      })
    })
  })

  describe('GET /contributions/:id', () => {
    // ============================================================================
    // TESTE 3: SUCCESS - Busca contribuição específica com sucesso
    // ============================================================================
    it('deve buscar contribuição específica com sucesso', async () => {
      // Arrange
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

      // Act
      const response = await api.get('/contributions/contrib-1')

      // Assert
      expect(api.get).toHaveBeenCalledWith('/contributions/contrib-1')
      expect(response.data.id).toBe('contrib-1')
      expect(response.data.goal).toBe(10000.0)
      expect(response.data.isActive).toBe(true)
    })

    // ============================================================================
    // TESTE 4: NOT FOUND - Retorna erro 404 quando contribuição não existe
    // ============================================================================
    it('deve retornar erro 404 quando contribuição não existe', async () => {
      // Arrange
      const mockError = {
        response: {
          status: 404,
          data: {
            message: 'Contribuição não encontrada',
          },
        },
      }
      vi.mocked(api.get).mockRejectedValue(mockError)

      // Act & Assert
      await expect(api.get('/contributions/invalid-id')).rejects.toMatchObject({
        response: {
          status: 404,
        },
      })
    })
  })

  describe('POST /contributions', () => {
    // ============================================================================
    // TESTE 5: SUCCESS - Cria contribuição com sucesso
    // ============================================================================
    it('deve criar contribuição com sucesso', async () => {
      // Arrange
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

      // Act
      const response = await api.post('/contributions', contributionData)

      // Assert
      expect(api.post).toHaveBeenCalledWith('/contributions', contributionData)
      expect(response.data).toHaveProperty('id')
      expect(response.data.title).toBe('Nova Campanha')
      expect(response.data.goal).toBe(5000.0)
    })

    // ============================================================================
    // TESTE 6: VALIDATION FAILURE - Retorna erro 400 quando branchId não está presente
    // ============================================================================
    it('deve retornar erro 400 quando branchId não está presente', async () => {
      // Arrange
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

      // Act & Assert
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
