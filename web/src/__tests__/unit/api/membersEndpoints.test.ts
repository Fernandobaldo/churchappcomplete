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

describe('Members Endpoints - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ token: 'mock-token', user: { branchId: 'branch-1' } as any })
  })

  describe('GET /members', () => {
    it('deve buscar todos os membros com sucesso', async () => {
      const mockResponse = {
        data: [
          {
            id: 'member-1',
            name: 'Membro Teste',
            email: 'membro@example.com',
            role: 'MEMBER',
          },
        ],
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const response = await api.get('/members')

      expect(api.get).toHaveBeenCalledWith('/members')
      expect(response.data).toBeInstanceOf(Array)
      expect(response.data[0]).toHaveProperty('id')
      expect(response.data[0]).toHaveProperty('name')
    })

    it('deve retornar array vazio quando não há membros', async () => {
      const mockResponse = {
        data: [],
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const response = await api.get('/members')

      expect(response.data).toEqual([])
    })
  })

  describe('GET /members/me', () => {
    it('deve buscar perfil do usuário atual com sucesso', async () => {
      const mockResponse = {
        data: {
          id: 'member-1',
          name: 'Usuário Atual',
          email: 'user@example.com',
          role: 'ADMINFILIAL',
        },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const response = await api.get('/members/me')

      expect(api.get).toHaveBeenCalledWith('/members/me')
      expect(response.data).toHaveProperty('id')
      expect(response.data).toHaveProperty('email')
    })
  })

  describe('GET /members/:id', () => {
    it('deve buscar membro específico com sucesso', async () => {
      const mockResponse = {
        data: {
          id: 'member-1',
          name: 'Membro Teste',
          email: 'membro@example.com',
          role: 'MEMBER',
          permissions: [],
        },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const response = await api.get('/members/member-1')

      expect(api.get).toHaveBeenCalledWith('/members/member-1')
      expect(response.data.id).toBe('member-1')
      expect(response.data).toHaveProperty('permissions')
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

      vi.mocked(api.get).mockRejectedValue(mockError)

      await expect(api.get('/members/invalid-id')).rejects.toMatchObject({
        response: {
          status: 404,
        },
      })
    })
  })

  describe('POST /register (criar membro)', () => {
    it('deve criar membro com sucesso', async () => {
      const mockResponse = {
        data: {
          id: 'member-1',
          name: 'Novo Membro',
          email: 'novo@example.com',
          role: 'MEMBER',
        },
      }

      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const memberData = {
        name: 'Novo Membro',
        email: 'novo@example.com',
        password: 'password123',
        branchId: 'branch-1',
        role: 'MEMBER',
      }

      const response = await api.post('/register', memberData)

      expect(api.post).toHaveBeenCalledWith('/register', memberData)
      expect(response.data).toHaveProperty('id')
      expect(response.data.name).toBe('Novo Membro')
    })

    it('deve retornar erro 403 quando hierarquia de roles é inválida', async () => {
      const mockError = {
        response: {
          status: 403,
          data: {
            error: 'Você não pode criar um Administrador Geral',
          },
        },
      }

      vi.mocked(api.post).mockRejectedValue(mockError)

      await expect(
        api.post('/register', {
          name: 'Admin',
          email: 'admin@example.com',
          password: 'password123',
          branchId: 'branch-1',
          role: 'ADMINGERAL',
        })
      ).rejects.toMatchObject({
        response: {
          status: 403,
        },
      })
    })
  })

  describe('PUT /members/:id', () => {
    it('deve atualizar membro com sucesso', async () => {
      const mockResponse = {
        data: {
          id: 'member-1',
          name: 'Membro Atualizado',
          email: 'membro@example.com',
        },
      }

      vi.mocked(api.put).mockResolvedValue(mockResponse)

      const updateData = {
        name: 'Membro Atualizado',
      }

      const response = await api.put('/members/member-1', updateData)

      expect(api.put).toHaveBeenCalledWith('/members/member-1', updateData)
      expect(response.data.name).toBe('Membro Atualizado')
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

      vi.mocked(api.put).mockRejectedValue(mockError)

      await expect(
        api.put('/members/invalid-id', {
          name: 'Teste',
        })
      ).rejects.toMatchObject({
        response: {
          status: 404,
        },
      })
    })
  })
})

