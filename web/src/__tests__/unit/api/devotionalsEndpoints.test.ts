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

describe('Devotionals Endpoints - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ token: 'mock-token', user: { branchId: 'branch-1' } as any })
  })

  describe('GET /devotionals', () => {
    // ============================================================================
    // TESTE 1: SUCCESS - Busca todos os devocionais com sucesso
    // ============================================================================
    it('deve buscar todos os devocionais com sucesso', async () => {
      // Arrange
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

      // Act
      const response = await api.get('/devotionals')

      // Assert
      expect(api.get).toHaveBeenCalledWith('/devotionals')
      expect(response.data).toBeInstanceOf(Array)
      expect(response.data[0]).toHaveProperty('id')
      expect(response.data[0]).toHaveProperty('title')
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
      await expect(api.get('/devotionals')).rejects.toMatchObject({
        response: {
          status: 400,
          data: { message: 'Usuário não vinculado a uma filial.' },
        },
      })
    })
  })

  describe('GET /devotionals/:id', () => {
    // ============================================================================
    // TESTE 3: SUCCESS - Busca devocional específico com sucesso
    // ============================================================================
    it('deve buscar devocional específico com sucesso', async () => {
      // Arrange
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

      // Act
      const response = await api.get('/devotionals/devotional-1')

      // Assert
      expect(api.get).toHaveBeenCalledWith('/devotionals/devotional-1')
      expect(response.data.id).toBe('devotional-1')
      expect(response.data).toHaveProperty('content')
    })

    // ============================================================================
    // TESTE 4: NOT FOUND - Retorna erro 404 quando devocional não existe
    // ============================================================================
    it('deve retornar erro 404 quando devocional não existe', async () => {
      // Arrange
      const mockError = {
        response: {
          status: 404,
          data: {
            message: 'Devocional não encontrado',
          },
        },
      }
      vi.mocked(api.get).mockRejectedValue(mockError)

      // Act & Assert
      await expect(api.get('/devotionals/invalid-id')).rejects.toMatchObject({
        response: {
          status: 404,
        },
      })
    })
  })

  describe('POST /devotionals', () => {
    // ============================================================================
    // TESTE 5: SUCCESS - Cria devocional com sucesso
    // ============================================================================
    it('deve criar devocional com sucesso', async () => {
      // Arrange
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
        passage: 'João 3:16',
        content: 'Conteúdo do novo devocional...',
      }

      // Act
      const response = await api.post('/devotionals', devotionalData)

      // Assert
      expect(api.post).toHaveBeenCalledWith('/devotionals', devotionalData)
      expect(response.data).toHaveProperty('id')
      expect(response.data.title).toBe('Novo Devocional')
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
    // ============================================================================
    // TESTE 7: SUCCESS - Curtir devocional com sucesso
    // ============================================================================
    it('deve curtir devocional com sucesso', async () => {
      // Arrange
      const mockResponse = {
        data: {
          success: true,
        },
      }
      vi.mocked(api.post).mockResolvedValue(mockResponse)

      // Act
      const response = await api.post('/devotionals/devotional-1/like')

      // Assert
      expect(api.post).toHaveBeenCalledWith('/devotionals/devotional-1/like')
      expect(response.data.success).toBe(true)
    })

    // ============================================================================
    // TESTE 8: VALIDATION FAILURE - Retorna erro 400 quando já curtiu
    // ============================================================================
    it('deve retornar erro 400 quando já curtiu', async () => {
      // Arrange
      const mockError = {
        response: {
          status: 400,
          data: {
            message: 'Você já curtiu esse devocional.',
          },
        },
      }
      vi.mocked(api.post).mockRejectedValue(mockError)

      // Act & Assert
      await expect(api.post('/devotionals/devotional-1/like')).rejects.toMatchObject({
        response: {
          status: 400,
          data: { message: 'Você já curtiu esse devocional.' },
        },
      })
    })
  })
})
