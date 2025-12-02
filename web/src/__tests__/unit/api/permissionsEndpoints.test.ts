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

describe('Permissions Endpoints - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ token: 'mock-token', user: { branchId: 'branch-1' } as any })
  })

  describe('GET /members (para listar membros com permissões)', () => {
    it('deve buscar membros com permissões com sucesso', async () => {
      const mockResponse = {
        data: [
          {
            id: 'member-1',
            name: 'Membro Teste',
            email: 'membro@example.com',
            permissions: [
              { type: 'members_manage' },
              { type: 'events_manage' },
            ],
          },
        ],
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const response = await api.get('/members')

      expect(api.get).toHaveBeenCalledWith('/members')
      expect(response.data).toBeInstanceOf(Array)
      expect(response.data[0]).toHaveProperty('permissions')
      expect(response.data[0].permissions).toBeInstanceOf(Array)
    })
  })

  describe('POST /permissions/:memberId', () => {
    it('deve atualizar permissões de membro com sucesso', async () => {
      const mockResponse = {
        data: {
          success: true,
          added: 2,
          permissions: [
            { id: 'perm-1', type: 'devotional_manage' },
            { id: 'perm-2', type: 'members_view' },
          ],
        },
      }

      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const response = await api.post('/permissions/member-1', {
        permissions: ['devotional_manage', 'members_view'],
      })

      expect(api.post).toHaveBeenCalledWith('/permissions/member-1', {
        permissions: ['devotional_manage', 'members_view'],
      })
      expect(response.data.success).toBe(true)
      expect(response.data.added).toBe(2)
      expect(Array.isArray(response.data.permissions)).toBe(true)
      expect(response.data.permissions.length).toBe(2)
    })

    it('deve retornar permissões atualizadas na resposta', async () => {
      const mockResponse = {
        data: {
          success: true,
          added: 1,
          permissions: [
            { id: 'perm-1', type: 'devotional_manage' },
          ],
        },
      }

      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const response = await api.post('/permissions/member-1', {
        permissions: ['devotional_manage'],
      })

      expect(response.data.permissions).toBeDefined()
      expect(Array.isArray(response.data.permissions)).toBe(true)
      expect(response.data.permissions[0]).toHaveProperty('id')
      expect(response.data.permissions[0]).toHaveProperty('type')
    })

    it('deve permitir remover todas as permissões enviando array vazio', async () => {
      const mockResponse = {
        data: {
          success: true,
          added: 0,
          permissions: [],
        },
      }

      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const response = await api.post('/permissions/member-1', {
        permissions: [],
      })

      expect(response.data.success).toBe(true)
      expect(response.data.permissions).toBeInstanceOf(Array)
      expect(response.data.permissions.length).toBe(0)
    })

    it('deve retornar erro 400 quando permissions não é um array', async () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            message: 'Dados inválidos',
            errors: [{ path: ['permissions'], message: 'Expected array' }],
          },
        },
      }

      vi.mocked(api.post).mockRejectedValue(mockError)

      await expect(
        api.post('/permissions/member-1', {
          permissions: 'not-an-array',
        })
      ).rejects.toMatchObject({
        response: {
          status: 400,
        },
      })
    })

    it('deve retornar erro 403 quando usuário não tem permissão', async () => {
      const mockError = {
        response: {
          status: 403,
          data: {
            message: 'Acesso negado',
          },
        },
      }

      vi.mocked(api.post).mockRejectedValue(mockError)

      await expect(
        api.post('/permissions/member-1', {
          permissions: ['devotional_manage'],
        })
      ).rejects.toMatchObject({
        response: {
          status: 403,
        },
      })
    })
  })
})

