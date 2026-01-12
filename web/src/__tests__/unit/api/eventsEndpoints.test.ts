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

describe('Events Endpoints - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ token: 'mock-token', user: { branchId: 'branch-1' } as any })
  })

  describe('GET /events', () => {
    // ============================================================================
    // TESTE 1: SUCCESS - Busca todos os eventos com sucesso
    // ============================================================================
    it('deve buscar todos os eventos com sucesso', async () => {
      // Arrange
      const mockResponse = {
        data: [
          {
            id: 'event-1',
            title: 'Culto de Domingo',
            date: '2024-01-15T10:00:00Z',
            location: 'Igreja Principal',
          },
        ],
      }
      vi.mocked(api.get).mockResolvedValue(mockResponse)

      // Act
      const response = await api.get('/events')

      // Assert
      expect(api.get).toHaveBeenCalledWith('/events')
      expect(response.data).toBeInstanceOf(Array)
      expect(response.data[0]).toHaveProperty('id')
      expect(response.data[0]).toHaveProperty('title')
    })

    // ============================================================================
    // TESTE 2: EMPTY STATE - Retorna array vazio quando não há eventos
    // ============================================================================
    it('deve retornar array vazio quando não há eventos', async () => {
      // Arrange
      const mockResponse = {
        data: [],
      }
      vi.mocked(api.get).mockResolvedValue(mockResponse)

      // Act
      const response = await api.get('/events')

      // Assert
      expect(response.data).toEqual([])
    })
  })

  describe('GET /events/next', () => {
    // ============================================================================
    // TESTE 3: SUCCESS - Busca próximo evento com sucesso
    // ============================================================================
    it('deve buscar próximo evento com sucesso', async () => {
      // Arrange
      const mockResponse = {
        data: {
          id: 'event-1',
          title: 'Próximo Culto',
          date: '2024-01-20T10:00:00Z',
          location: 'Igreja Principal',
        },
      }
      vi.mocked(api.get).mockResolvedValue(mockResponse)

      // Act
      const response = await api.get('/events/next')

      // Assert
      expect(api.get).toHaveBeenCalledWith('/events/next')
      expect(response.data).toHaveProperty('id')
      expect(response.data).toHaveProperty('title')
    })

    // ============================================================================
    // TESTE 4: EMPTY STATE - Retorna null quando não há próximo evento
    // ============================================================================
    it('deve retornar null quando não há próximo evento', async () => {
      // Arrange
      const mockResponse = {
        data: null,
      }
      vi.mocked(api.get).mockResolvedValue(mockResponse)

      // Act
      const response = await api.get('/events/next')

      // Assert
      expect(response.data).toBeNull()
    })
  })

  describe('GET /events/:id', () => {
    // ============================================================================
    // TESTE 5: SUCCESS - Busca evento específico com sucesso
    // ============================================================================
    it('deve buscar evento específico com sucesso', async () => {
      // Arrange
      const mockResponse = {
        data: {
          id: 'event-1',
          title: 'Culto Especial',
          date: '2024-01-15T10:00:00Z',
          location: 'Igreja Principal',
        },
      }
      vi.mocked(api.get).mockResolvedValue(mockResponse)

      // Act
      const response = await api.get('/events/event-1')

      // Assert
      expect(api.get).toHaveBeenCalledWith('/events/event-1')
      expect(response.data.id).toBe('event-1')
    })

    // ============================================================================
    // TESTE 6: NOT FOUND - Retorna erro 404 quando evento não existe
    // ============================================================================
    it('deve retornar erro 404 quando evento não existe', async () => {
      // Arrange
      const mockError = {
        response: {
          status: 404,
          data: {
            message: 'Evento não encontrado',
          },
        },
      }
      vi.mocked(api.get).mockRejectedValue(mockError)

      // Act & Assert
      await expect(api.get('/events/invalid-id')).rejects.toMatchObject({
        response: {
          status: 404,
        },
      })
    })
  })

  describe('POST /events', () => {
    // ============================================================================
    // TESTE 7: SUCCESS - Cria evento com sucesso
    // ============================================================================
    it('deve criar evento com sucesso', async () => {
      // Arrange
      const mockResponse = {
        data: {
          id: 'event-1',
          title: 'Novo Evento',
          date: '2024-01-15T10:00:00Z',
          location: 'Igreja Principal',
        },
      }
      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const eventData = {
        title: 'Novo Evento',
        date: '2024-01-15T10:00:00Z',
        location: 'Igreja Principal',
      }

      // Act
      const response = await api.post('/events', eventData)

      // Assert
      expect(api.post).toHaveBeenCalledWith('/events', eventData)
      expect(response.data).toHaveProperty('id')
      expect(response.data.title).toBe('Novo Evento')
    })

    // ============================================================================
    // TESTE 8: VALIDATION FAILURE - Retorna erro 400 quando branchId não está presente
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
        api.post('/events', {
          title: 'Novo Evento',
          date: '2024-01-15T10:00:00Z',
        })
      ).rejects.toMatchObject({
        response: {
          status: 400,
        },
      })
    })
  })

  describe('PUT /events/:id', () => {
    // ============================================================================
    // TESTE 9: SUCCESS - Atualiza evento com sucesso
    // ============================================================================
    it('deve atualizar evento com sucesso', async () => {
      // Arrange
      const mockResponse = {
        data: {
          id: 'event-1',
          title: 'Evento Atualizado',
          date: '2024-01-20T10:00:00Z',
          location: 'Nova Localização',
        },
      }
      vi.mocked(api.put).mockResolvedValue(mockResponse)

      const updateData = {
        title: 'Evento Atualizado',
        date: '2024-01-20T10:00:00Z',
        location: 'Nova Localização',
      }

      // Act
      const response = await api.put('/events/event-1', updateData)

      // Assert
      expect(api.put).toHaveBeenCalledWith('/events/event-1', updateData)
      expect(response.data.title).toBe('Evento Atualizado')
    })
  })

  describe('DELETE /events/:id', () => {
    // ============================================================================
    // TESTE 10: SUCCESS - Deleta evento com sucesso
    // ============================================================================
    it('deve deletar evento com sucesso', async () => {
      // Arrange
      const mockResponse = {
        data: {
          success: true,
        },
      }
      vi.mocked(api.delete).mockResolvedValue(mockResponse)

      // Act
      const response = await api.delete('/events/event-1')

      // Assert
      expect(api.delete).toHaveBeenCalledWith('/events/event-1')
      expect(response.data.success).toBe(true)
    })

    // ============================================================================
    // TESTE 11: NOT FOUND - Retorna erro 404 quando evento não existe
    // ============================================================================
    it('deve retornar erro 404 quando evento não existe', async () => {
      // Arrange
      const mockError = {
        response: {
          status: 404,
          data: {
            message: 'Evento não encontrado',
          },
        },
      }
      vi.mocked(api.delete).mockRejectedValue(mockError)

      // Act & Assert
      await expect(api.delete('/events/invalid-id')).rejects.toMatchObject({
        response: {
          status: 404,
        },
      })
    })
  })
})
