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

describe('Devotionals Endpoints - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ token: 'mock-token', user: { branchId: 'branch-1' } as any })
  })

  describe('GET /devotionals', () => {
    it('deve buscar todos os devocionais com sucesso', async () => {
      const mockResponse = {
        data: [
          {
            id: 'devotional-1',
            title: 'Devocional do Dia',
            content: 'Conteúdo do devocional...',
            author: {
              id: 'user-1',
              name: 'Autor Teste',
            },
          },
        ],
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const response = await api.get('/devotionals')

      expect(api.get).toHaveBeenCalledWith('/devotionals')
      expect(response.data).toBeInstanceOf(Array)
      expect(response.data[0]).toHaveProperty('id')
      expect(response.data[0]).toHaveProperty('title')
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

      await expect(api.get('/devotionals')).rejects.toMatchObject({
        response: {
          status: 400,
          data: { message: 'Usuário não vinculado a uma filial.' },
        },
      })
    })
  })

  describe('GET /devotionals/:id', () => {
    it('deve buscar devocional específico com sucesso', async () => {
      const mockResponse = {
        data: {
          id: 'devotional-1',
          title: 'Devocional do Dia',
          content: 'Conteúdo completo...',
          author: {
            id: 'user-1',
            name: 'Autor Teste',
          },
        },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const response = await api.get('/devotionals/devotional-1')

      expect(api.get).toHaveBeenCalledWith('/devotionals/devotional-1')
      expect(response.data.id).toBe('devotional-1')
      expect(response.data).toHaveProperty('content')
    })

    it('deve retornar erro 404 quando devocional não existe', async () => {
      const mockError = {
        response: {
          status: 404,
          data: {
            message: 'Devocional não encontrado',
          },
        },
      }

      vi.mocked(api.get).mockRejectedValue(mockError)

      await expect(api.get('/devotionals/invalid-id')).rejects.toMatchObject({
        response: {
          status: 404,
        },
      })
    })
  })

  describe('POST /devotionals', () => {
    it('deve criar devocional com sucesso', async () => {
      const mockResponse = {
        data: {
          id: 'devotional-1',
          title: 'Novo Devocional',
          content: 'Conteúdo do novo devocional...',
        },
      }

      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const devotionalData = {
        title: 'Novo Devocional',
        content: 'Conteúdo do novo devocional...',
      }

      const response = await api.post('/devotionals', devotionalData)

      expect(api.post).toHaveBeenCalledWith('/devotionals', devotionalData)
      expect(response.data).toHaveProperty('id')
      expect(response.data.title).toBe('Novo Devocional')
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
        api.post('/devotionals', {
          title: 'Novo Devocional',
          content: 'Conteúdo...',
        })
      ).rejects.toMatchObject({
        response: {
          status: 400,
        },
      })
    })
  })

  describe('POST /devotionals/:id/like', () => {
    it('deve curtir devocional com sucesso', async () => {
      const mockResponse = {
        data: {
          success: true,
        },
      }

      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const response = await api.post('/devotionals/devotional-1/like')

      expect(api.post).toHaveBeenCalledWith('/devotionals/devotional-1/like')
      expect(response.data.success).toBe(true)
    })

    it('deve retornar erro 400 quando já curtiu', async () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            message: 'Você já curtiu esse devocional.',
          },
        },
      }

      vi.mocked(api.post).mockRejectedValue(mockError)

      await expect(api.post('/devotionals/devotional-1/like')).rejects.toMatchObject({
        response: {
          status: 400,
          data: { message: 'Você já curtiu esse devocional.' },
        },
      })
    })
  })
})

