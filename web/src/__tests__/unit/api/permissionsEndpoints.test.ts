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
    it('deve adicionar permissão a membro com sucesso', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Permissão adicionada com sucesso',
        },
      }

      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const response = await api.post('/permissions/member-1', {
        type: 'contribution_manage',
      })

      expect(api.post).toHaveBeenCalledWith('/permissions/member-1', {
        type: 'contribution_manage',
      })
      expect(response.data.success).toBe(true)
    })

    it('deve retornar erro 400 quando permissão já existe', async () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            message: 'Membro já possui esta permissão',
          },
        },
      }

      vi.mocked(api.post).mockRejectedValue(mockError)

      await expect(
        api.post('/permissions/member-1', {
          type: 'contribution_manage',
        })
      ).rejects.toMatchObject({
        response: {
          status: 400,
        },
      })
    })

    it('deve retornar erro 404 quando membro não existe', async () => {
      const mockError = {
        response: {
          status: 404,
          data: {
            message: 'Membro não encontrado',
          },
        },
      }

      vi.mocked(api.post).mockRejectedValue(mockError)

      await expect(
        api.post('/permissions/invalid-id', {
          type: 'contribution_manage',
        })
      ).rejects.toMatchObject({
        response: {
          status: 404,
        },
      })
    })
  })

  describe('DELETE /permissions/:memberId/:permissionType', () => {
    it('deve remover permissão de membro com sucesso', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Permissão removida com sucesso',
        },
      }

      vi.mocked(api.delete).mockResolvedValue(mockResponse)

      const response = await api.delete('/permissions/member-1/contribution_manage')

      expect(api.delete).toHaveBeenCalledWith('/permissions/member-1/contribution_manage')
      expect(response.data.success).toBe(true)
    })

    it('deve retornar erro 404 quando permissão não existe', async () => {
      const mockError = {
        response: {
          status: 404,
          data: {
            message: 'Permissão não encontrada',
          },
        },
      }

      vi.mocked(api.delete).mockRejectedValue(mockError)

      await expect(
        api.delete('/permissions/member-1/invalid_permission')
      ).rejects.toMatchObject({
        response: {
          status: 404,
        },
      })
    })
  })
})

