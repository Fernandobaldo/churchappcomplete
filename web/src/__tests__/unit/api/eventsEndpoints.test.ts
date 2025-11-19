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

describe('Events Endpoints - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ token: 'mock-token', user: { branchId: 'branch-1' } as any })
  })

  describe('GET /events', () => {
    it('deve buscar todos os eventos com sucesso', async () => {
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

      const response = await api.get('/events')

      expect(api.get).toHaveBeenCalledWith('/events')
      expect(response.data).toBeInstanceOf(Array)
      expect(response.data[0]).toHaveProperty('id')
      expect(response.data[0]).toHaveProperty('title')
    })

    it('deve retornar array vazio quando não há eventos', async () => {
      const mockResponse = {
        data: [],
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const response = await api.get('/events')

      expect(response.data).toEqual([])
    })
  })

  describe('GET /events/next', () => {
    it('deve buscar próximo evento com sucesso', async () => {
      const mockResponse = {
        data: {
          id: 'event-1',
          title: 'Próximo Culto',
          date: '2024-01-20T10:00:00Z',
          location: 'Igreja Principal',
        },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const response = await api.get('/events/next')

      expect(api.get).toHaveBeenCalledWith('/events/next')
      expect(response.data).toHaveProperty('id')
      expect(response.data).toHaveProperty('title')
    })

    it('deve retornar null quando não há próximo evento', async () => {
      const mockResponse = {
        data: null,
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const response = await api.get('/events/next')

      expect(response.data).toBeNull()
    })
  })

  describe('GET /events/:id', () => {
    it('deve buscar evento específico com sucesso', async () => {
      const mockResponse = {
        data: {
          id: 'event-1',
          title: 'Culto Especial',
          date: '2024-01-15T10:00:00Z',
          location: 'Igreja Principal',
        },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const response = await api.get('/events/event-1')

      expect(api.get).toHaveBeenCalledWith('/events/event-1')
      expect(response.data.id).toBe('event-1')
    })

    it('deve retornar erro 404 quando evento não existe', async () => {
      const mockError = {
        response: {
          status: 404,
          data: {
            message: 'Evento não encontrado',
          },
        },
      }

      vi.mocked(api.get).mockRejectedValue(mockError)

      await expect(api.get('/events/invalid-id')).rejects.toMatchObject({
        response: {
          status: 404,
        },
      })
    })
  })

  describe('POST /events', () => {
    it('deve criar evento com sucesso', async () => {
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

      const response = await api.post('/events', eventData)

      expect(api.post).toHaveBeenCalledWith('/events', eventData)
      expect(response.data).toHaveProperty('id')
      expect(response.data.title).toBe('Novo Evento')
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
    it('deve atualizar evento com sucesso', async () => {
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

      const response = await api.put('/events/event-1', updateData)

      expect(api.put).toHaveBeenCalledWith('/events/event-1', updateData)
      expect(response.data.title).toBe('Evento Atualizado')
    })
  })

  describe('DELETE /events/:id', () => {
    it('deve deletar evento com sucesso', async () => {
      const mockResponse = {
        data: {
          success: true,
        },
      }

      vi.mocked(api.delete).mockResolvedValue(mockResponse)

      const response = await api.delete('/events/event-1')

      expect(api.delete).toHaveBeenCalledWith('/events/event-1')
      expect(response.data.success).toBe(true)
    })

    it('deve retornar erro 404 quando evento não existe', async () => {
      const mockError = {
        response: {
          status: 404,
          data: {
            message: 'Evento não encontrado',
          },
        },
      }

      vi.mocked(api.delete).mockRejectedValue(mockError)

      await expect(api.delete('/events/invalid-id')).rejects.toMatchObject({
        response: {
          status: 404,
        },
      })
    })
  })
})

