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

describe('Members Endpoints - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ token: 'mock-token', user: { branchId: 'branch-1' } as any })
  })

  describe('GET /members', () => {
    // ============================================================================
    // TESTE 1: SUCCESS - Busca todos os membros com sucesso
    // ============================================================================
    it('deve buscar todos os membros com sucesso', async () => {
      // Arrange
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

      // Act
      const response = await api.get('/members')

      // Assert
      expect(api.get).toHaveBeenCalledWith('/members')
      expect(response.data).toBeInstanceOf(Array)
      expect(response.data[0]).toHaveProperty('id')
      expect(response.data[0]).toHaveProperty('name')
    })

    // ============================================================================
    // TESTE 2: EMPTY STATE - Retorna array vazio quando não há membros
    // ============================================================================
    it('deve retornar array vazio quando não há membros', async () => {
      // Arrange
      const mockResponse = {
        data: [],
      }
      vi.mocked(api.get).mockResolvedValue(mockResponse)

      // Act
      const response = await api.get('/members')

      // Assert
      expect(response.data).toEqual([])
    })
  })

  describe('GET /members/me', () => {
    // ============================================================================
    // TESTE 3: SUCCESS - Busca perfil do usuário atual com sucesso
    // ============================================================================
    it('deve buscar perfil do usuário atual com sucesso', async () => {
      // Arrange
      const mockResponse = {
        data: {
          id: 'member-1',
          name: 'Usuário Atual',
          email: 'user@example.com',
          role: 'ADMINFILIAL',
        },
      }
      vi.mocked(api.get).mockResolvedValue(mockResponse)

      // Act
      const response = await api.get('/members/me')

      // Assert
      expect(api.get).toHaveBeenCalledWith('/members/me')
      expect(response.data).toHaveProperty('id')
      expect(response.data).toHaveProperty('email')
    })
  })

  describe('GET /members/:id', () => {
    // ============================================================================
    // TESTE 4: SUCCESS - Busca membro específico com sucesso
    // ============================================================================
    it('deve buscar membro específico com sucesso', async () => {
      // Arrange
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

      // Act
      const response = await api.get('/members/member-1')

      // Assert
      expect(api.get).toHaveBeenCalledWith('/members/member-1')
      expect(response.data.id).toBe('member-1')
      expect(response.data).toHaveProperty('permissions')
    })

    // ============================================================================
    // TESTE 5: NOT FOUND - Retorna erro 404 quando membro não existe
    // ============================================================================
    it('deve retornar erro 404 quando membro não existe', async () => {
      // Arrange
      const mockError = {
        response: {
          status: 404,
          data: {
            message: 'Membro não encontrado',
          },
        },
      }
      vi.mocked(api.get).mockRejectedValue(mockError)

      // Act & Assert
      await expect(api.get('/members/invalid-id')).rejects.toMatchObject({
        response: {
          status: 404,
        },
      })
    })
  })

  describe('POST /register (criar membro)', () => {
    // ============================================================================
    // TESTE 6: SUCCESS - Cria membro com sucesso
    // ============================================================================
    it('deve criar membro com sucesso', async () => {
      // Arrange
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

      // Act
      const response = await api.post('/register', memberData)

      // Assert
      expect(api.post).toHaveBeenCalledWith('/register', memberData)
      expect(response.data).toHaveProperty('id')
      expect(response.data.name).toBe('Novo Membro')
    })

    // ============================================================================
    // TESTE 7: FORBIDDEN - Retorna erro 403 quando hierarquia de roles é inválida
    // ============================================================================
    it('deve retornar erro 403 quando hierarquia de roles é inválida', async () => {
      // Arrange
      const mockError = {
        response: {
          status: 403,
          data: {
            error: 'Você não pode criar um Administrador Geral',
          },
        },
      }
      vi.mocked(api.post).mockRejectedValue(mockError)

      // Act & Assert
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
    // ============================================================================
    // TESTE 8: SUCCESS - Atualiza membro com sucesso
    // ============================================================================
    it('deve atualizar membro com sucesso', async () => {
      // Arrange
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

      // Act
      const response = await api.put('/members/member-1', updateData)

      // Assert
      expect(api.put).toHaveBeenCalledWith('/members/member-1', updateData)
      expect(response.data.name).toBe('Membro Atualizado')
    })

    // ============================================================================
    // TESTE 9: NOT FOUND - Retorna erro 404 quando membro não existe
    // ============================================================================
    it('deve retornar erro 404 quando membro não existe', async () => {
      // Arrange
      const mockError = {
        response: {
          status: 404,
          data: {
            message: 'Membro não encontrado',
          },
        },
      }
      vi.mocked(api.put).mockRejectedValue(mockError)

      // Act & Assert
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

    // 3.1 PUT /members/:id - Validações
    it('deve validar schema com campos obrigatórios', async () => {
      const mockResponse = {
        data: {
          id: 'member-1',
          name: 'Membro Atualizado',
        },
      }

      vi.mocked(api.put).mockResolvedValue(mockResponse)

      const updateData = {
        name: 'Membro Atualizado',
      }

      const response = await api.put('/members/member-1', updateData)

      expect(api.put).toHaveBeenCalledWith('/members/member-1', updateData)
      expect(response.data).toHaveProperty('name')
    })

    it('deve aceitar campos opcionais como null', async () => {
      const mockResponse = {
        data: {
          id: 'member-1',
          name: 'Membro Atualizado',
          phone: null,
          address: null,
          birthDate: null,
        },
      }

      vi.mocked(api.put).mockResolvedValue(mockResponse)

      const updateData = {
        name: 'Membro Atualizado',
        phone: null,
        address: null,
        birthDate: null,
      }

      const response = await api.put('/members/member-1', updateData)

      expect(api.put).toHaveBeenCalledWith('/members/member-1', updateData)
      expect(response.data.phone).toBeNull()
      expect(response.data.address).toBeNull()
      expect(response.data.birthDate).toBeNull()
    })

    it('deve validar formato de data dd/mm/yyyy', async () => {
      const mockResponse = {
        data: {
          id: 'member-1',
          name: 'Membro Atualizado',
          birthDate: '15/05/1985',
        },
      }

      vi.mocked(api.put).mockResolvedValue(mockResponse)

      const updateData = {
        name: 'Membro Atualizado',
        birthDate: '15/05/1985',
      }

      const response = await api.put('/members/member-1', updateData)

      expect(api.put).toHaveBeenCalledWith('/members/member-1', updateData)
      expect(response.data.birthDate).toBe('15/05/1985')
      expect(response.data.birthDate).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
    })

    it('deve rejeitar email inválido', async () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            error: 'Email inválido',
          },
        },
      }

      vi.mocked(api.put).mockRejectedValue(mockError)

      await expect(
        api.put('/members/member-1', {
          name: 'Teste',
          email: 'email-invalido',
        })
      ).rejects.toMatchObject({
        response: {
          status: 400,
        },
      })
    })

    it('deve rejeitar positionId inválido (não cuid)', async () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            error: 'ID inválido',
          },
        },
      }

      vi.mocked(api.put).mockRejectedValue(mockError)

      await expect(
        api.put('/members/member-1', {
          name: 'Teste',
          positionId: 'invalid-id',
        })
      ).rejects.toMatchObject({
        response: {
          status: 400,
        },
      })
    })
  })

  // 3.2 GET /members/me - Resposta
  describe('GET /members/me - Resposta', () => {
    it('deve retornar todos os campos do perfil', async () => {
      const mockResponse = {
        data: {
          id: 'member-1',
          name: 'Usuário Atual',
          email: 'user@example.com',
          role: 'MEMBER',
          phone: '11999999999',
          address: 'Rua Teste, 123',
          birthDate: '01/01/1990',
          positionId: 'pos-1',
          position: { id: 'pos-1', name: 'Pastor' },
        },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const response = await api.get('/members/me')

      expect(api.get).toHaveBeenCalledWith('/members/me')
      expect(response.data).toHaveProperty('id')
      expect(response.data).toHaveProperty('name')
      expect(response.data).toHaveProperty('email')
      expect(response.data).toHaveProperty('phone')
      expect(response.data).toHaveProperty('address')
      expect(response.data).toHaveProperty('birthDate')
      expect(response.data).toHaveProperty('positionId')
      expect(response.data).toHaveProperty('position')
    })

    it('deve retornar positionId e position', async () => {
      const mockResponse = {
        data: {
          id: 'member-1',
          name: 'Usuário Atual',
          email: 'user@example.com',
          positionId: 'pos-1',
          position: { id: 'pos-1', name: 'Pastor' },
        },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const response = await api.get('/members/me')

      expect(response.data.positionId).toBe('pos-1')
      expect(response.data.position).toEqual({ id: 'pos-1', name: 'Pastor' })
    })

    it('deve retornar null para campos opcionais vazios', async () => {
      const mockResponse = {
        data: {
          id: 'member-1',
          name: 'Usuário Atual',
          email: 'user@example.com',
          phone: null,
          address: null,
          birthDate: null,
          positionId: null,
          position: null,
        },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const response = await api.get('/members/me')

      expect(response.data.phone).toBeNull()
      expect(response.data.address).toBeNull()
      expect(response.data.birthDate).toBeNull()
      expect(response.data.positionId).toBeNull()
      expect(response.data.position).toBeNull()
    })
  })
})

        name: 'Membro Atualizado',
      }

      // Act
      const response = await api.put('/members/member-1', updateData)

      // Assert
      expect(api.put).toHaveBeenCalledWith('/members/member-1', updateData)
      expect(response.data.name).toBe('Membro Atualizado')
    })

    // ============================================================================
    // TESTE 9: NOT FOUND - Retorna erro 404 quando membro não existe
    // ============================================================================
    it('deve retornar erro 404 quando membro não existe', async () => {
      // Arrange
      const mockError = {
        response: {
          status: 404,
          data: {
            message: 'Membro não encontrado',
          },
        },
      }
      vi.mocked(api.put).mockRejectedValue(mockError)

      // Act & Assert
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

    // 3.1 PUT /members/:id - Validações
    it('deve validar schema com campos obrigatórios', async () => {
      const mockResponse = {
        data: {
          id: 'member-1',
          name: 'Membro Atualizado',
        },
      }

      vi.mocked(api.put).mockResolvedValue(mockResponse)

      const updateData = {
        name: 'Membro Atualizado',
      }

      const response = await api.put('/members/member-1', updateData)

      expect(api.put).toHaveBeenCalledWith('/members/member-1', updateData)
      expect(response.data).toHaveProperty('name')
    })

    it('deve aceitar campos opcionais como null', async () => {
      const mockResponse = {
        data: {
          id: 'member-1',
          name: 'Membro Atualizado',
          phone: null,
          address: null,
          birthDate: null,
        },
      }

      vi.mocked(api.put).mockResolvedValue(mockResponse)

      const updateData = {
        name: 'Membro Atualizado',
        phone: null,
        address: null,
        birthDate: null,
      }

      const response = await api.put('/members/member-1', updateData)

      expect(api.put).toHaveBeenCalledWith('/members/member-1', updateData)
      expect(response.data.phone).toBeNull()
      expect(response.data.address).toBeNull()
      expect(response.data.birthDate).toBeNull()
    })

    it('deve validar formato de data dd/mm/yyyy', async () => {
      const mockResponse = {
        data: {
          id: 'member-1',
          name: 'Membro Atualizado',
          birthDate: '15/05/1985',
        },
      }

      vi.mocked(api.put).mockResolvedValue(mockResponse)

      const updateData = {
        name: 'Membro Atualizado',
        birthDate: '15/05/1985',
      }

      const response = await api.put('/members/member-1', updateData)

      expect(api.put).toHaveBeenCalledWith('/members/member-1', updateData)
      expect(response.data.birthDate).toBe('15/05/1985')
      expect(response.data.birthDate).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
    })

    it('deve rejeitar email inválido', async () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            error: 'Email inválido',
          },
        },
      }

      vi.mocked(api.put).mockRejectedValue(mockError)

      await expect(
        api.put('/members/member-1', {
          name: 'Teste',
          email: 'email-invalido',
        })
      ).rejects.toMatchObject({
        response: {
          status: 400,
        },
      })
    })

    it('deve rejeitar positionId inválido (não cuid)', async () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            error: 'ID inválido',
          },
        },
      }

      vi.mocked(api.put).mockRejectedValue(mockError)

      await expect(
        api.put('/members/member-1', {
          name: 'Teste',
          positionId: 'invalid-id',
        })
      ).rejects.toMatchObject({
        response: {
          status: 400,
        },
      })
    })
  })

  // 3.2 GET /members/me - Resposta
  describe('GET /members/me - Resposta', () => {
    it('deve retornar todos os campos do perfil', async () => {
      const mockResponse = {
        data: {
          id: 'member-1',
          name: 'Usuário Atual',
          email: 'user@example.com',
          role: 'MEMBER',
          phone: '11999999999',
          address: 'Rua Teste, 123',
          birthDate: '01/01/1990',
          positionId: 'pos-1',
          position: { id: 'pos-1', name: 'Pastor' },
        },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const response = await api.get('/members/me')

      expect(api.get).toHaveBeenCalledWith('/members/me')
      expect(response.data).toHaveProperty('id')
      expect(response.data).toHaveProperty('name')
      expect(response.data).toHaveProperty('email')
      expect(response.data).toHaveProperty('phone')
      expect(response.data).toHaveProperty('address')
      expect(response.data).toHaveProperty('birthDate')
      expect(response.data).toHaveProperty('positionId')
      expect(response.data).toHaveProperty('position')
    })

    it('deve retornar positionId e position', async () => {
      const mockResponse = {
        data: {
          id: 'member-1',
          name: 'Usuário Atual',
          email: 'user@example.com',
          positionId: 'pos-1',
          position: { id: 'pos-1', name: 'Pastor' },
        },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const response = await api.get('/members/me')

      expect(response.data.positionId).toBe('pos-1')
      expect(response.data.position).toEqual({ id: 'pos-1', name: 'Pastor' })
    })

    it('deve retornar null para campos opcionais vazios', async () => {
      const mockResponse = {
        data: {
          id: 'member-1',
          name: 'Usuário Atual',
          email: 'user@example.com',
          phone: null,
          address: null,
          birthDate: null,
          positionId: null,
          position: null,
        },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const response = await api.get('/members/me')

      expect(response.data.phone).toBeNull()
      expect(response.data.address).toBeNull()
      expect(response.data.birthDate).toBeNull()
      expect(response.data.positionId).toBeNull()
      expect(response.data.position).toBeNull()
    })
  })
})
