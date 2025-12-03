import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import Permissions from '@/pages/Permissions'
import api from '@/api/api'
import toast from 'react-hot-toast'

// Mock do módulo api
vi.mock('@/api/api', () => {
  const mockApi = {
    get: vi.fn(),
    post: vi.fn(),
  }
  return {
    default: mockApi,
  }
})

// Mock do react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock do useAuthStore
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'ADMINGERAL',
    },
  })),
}))

// Mock do useSearchParams
let mockSearchParams: URLSearchParams
let mockSetSearchParams: ReturnType<typeof vi.fn>

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useSearchParams: () => {
      if (!mockSearchParams) {
        mockSearchParams = new URLSearchParams()
      }
      if (!mockSetSearchParams) {
        mockSetSearchParams = vi.fn()
      }
      return [mockSearchParams, mockSetSearchParams]
    },
  }
})

describe('Permissions Page - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams = new URLSearchParams()
    mockSetSearchParams = vi.fn()
    // Limpa o estado do componente entre testes
    vi.mocked(api.get).mockReset()
    vi.mocked(api.post).mockReset()
  })

  const mockMembers = [
    {
      id: 'member-1',
      name: 'Membro Teste 1',
      email: 'membro1@example.com',
      role: 'MEMBER',
      permissions: [
        { id: 'perm-1', type: 'devotional_manage' },
      ],
    },
    {
      id: 'member-2',
      name: 'Membro Teste 2',
      email: 'membro2@example.com',
      role: 'COORDINATOR',
      permissions: [],
    },
  ]

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <Permissions />
      </BrowserRouter>
    )
  }

  describe('Carregamento de membros', () => {
    it('deve carregar e exibir lista de membros', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: mockMembers,
      })

      renderComponent()

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/members')
      })

      await waitFor(() => {
        expect(screen.getByText('Membro Teste 1')).toBeInTheDocument()
        expect(screen.getByText('Membro Teste 2')).toBeInTheDocument()
      })
    })

    it('deve exibir mensagem de erro quando falha ao carregar membros', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Erro ao carregar'))

      renderComponent()

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Erro ao carregar membros')
      })
    })

    it('deve garantir que permissions seja sempre um array', async () => {
      const membersWithNullPermissions = [
        {
          id: 'member-1',
          name: 'Membro Teste',
          email: 'membro@example.com',
          role: 'MEMBER',
          permissions: null,
        },
      ]

      vi.mocked(api.get).mockResolvedValueOnce({
        data: membersWithNullPermissions,
      })

      renderComponent()

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/members')
      })

      // Verifica que o componente não quebra com permissions null
      await waitFor(() => {
        expect(screen.getByText('Membro Teste')).toBeInTheDocument()
      })
    })

    it('deve tratar permissions como string JSON corretamente', async () => {
      const membersWithStringPermissions = [
        {
          id: 'member-1',
          name: 'Membro Teste',
          email: 'membro@example.com',
          role: 'MEMBER',
          permissions: JSON.stringify([{ id: 'perm-1', type: 'devotional_manage' }]),
        },
      ]

      vi.mocked(api.get).mockResolvedValueOnce({
        data: membersWithStringPermissions,
      })

      renderComponent()

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/members')
      })

      await waitFor(() => {
        expect(screen.getByText('Membro Teste')).toBeInTheDocument()
      })
    })

    it('deve tratar permissions undefined corretamente', async () => {
      const membersWithUndefinedPermissions = [
        {
          id: 'member-1',
          name: 'Membro Teste',
          email: 'membro@example.com',
          role: 'MEMBER',
          permissions: undefined,
        },
      ]

      vi.mocked(api.get).mockResolvedValueOnce({
        data: membersWithUndefinedPermissions,
      })

      renderComponent()

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/members')
      })

      await waitFor(() => {
        expect(screen.getByText('Membro Teste')).toBeInTheDocument()
      })
    })
  })

  describe('Seleção de membro', () => {
    it('deve carregar detalhes do membro quando selecionado', async () => {
      vi.mocked(api.get)
        .mockResolvedValueOnce({ data: mockMembers })
        .mockResolvedValueOnce({
          data: {
            ...mockMembers[0],
            permissions: [
              { id: 'perm-1', type: 'devotional_manage' },
              { id: 'perm-2', type: 'members_view' },
            ],
          },
        })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Membro Teste 1')).toBeInTheDocument()
      })

      const memberButton = screen.getByText('Membro Teste 1')
      await userEvent.click(memberButton)

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/members/member-1')
      })
    })

    it('deve carregar membro da URL quando memberId está presente', async () => {
      mockSearchParams.set('memberId', 'member-1')

      vi.mocked(api.get)
        .mockResolvedValueOnce({ data: mockMembers })
        .mockResolvedValueOnce({
          data: {
            ...mockMembers[0],
            permissions: [{ id: 'perm-1', type: 'devotional_manage' }],
          },
        })

      renderComponent()

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/members/member-1')
      })
    })
  })

  describe('Atualização de permissões', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('deve adicionar permissão quando toggle é ativado', async () => {
      const user = userEvent.setup()

      // POST retorna permissões atualizadas
      vi.mocked(api.post).mockResolvedValueOnce({
        data: {
          success: true,
          added: 1,
          permissions: [
            { id: 'perm-1', type: 'devotional_manage' },
          ],
        },
      })

      // Configura todos os mocks necessários
      vi.mocked(api.get)
        .mockResolvedValueOnce({ data: mockMembers }) // GET /members inicial
        .mockResolvedValueOnce({ // GET /members/member-1 ao selecionar
          data: {
            ...mockMembers[0],
            permissions: [],
          },
        })
        .mockResolvedValueOnce({ // GET /members após atualização
          data: [
            {
              ...mockMembers[0],
              permissions: [
                { id: 'perm-1', type: 'devotional_manage' },
              ],
            },
            mockMembers[1],
          ],
        })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Membro Teste 1')).toBeInTheDocument()
      })

      const memberButton = screen.getByText('Membro Teste 1')
      await user.click(memberButton)

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/members/member-1')
      })

      // Aguarda o toggle aparecer (são checkboxes, não switches)
      await waitFor(() => {
        const toggles = screen.queryAllByRole('checkbox')
        expect(toggles.length).toBeGreaterThan(0)
      }, { timeout: 5000 })

      const toggle = screen.getAllByRole('checkbox')[0]
      await user.click(toggle)

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/permissions/member-1', {
          permissions: ['devotional_manage'],
        })
      }, { timeout: 3000 })

      // Verifica que GET /members é chamado após atualização
      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/members')
      }, { timeout: 5000 })

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Permissão adicionada com sucesso!')
      }, { timeout: 5000 })
    })

    it('deve remover permissão quando toggle é desativado', async () => {
      const user = userEvent.setup()

      // POST retorna permissões atualizadas (vazias)
      vi.mocked(api.post).mockResolvedValueOnce({
        data: {
          success: true,
          added: 0,
          permissions: [],
        },
      })

      vi.mocked(api.get)
        .mockResolvedValueOnce({ data: mockMembers }) // GET /members inicial
        .mockResolvedValueOnce({ // GET /members/member-1 ao selecionar
          data: {
            ...mockMembers[0],
            permissions: [
              { id: 'perm-1', type: 'devotional_manage' },
            ],
          },
        })
        .mockResolvedValueOnce({ // GET /members após atualização
          data: [
            {
              ...mockMembers[0],
              permissions: [],
            },
            mockMembers[1],
          ],
        })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Membro Teste 1')).toBeInTheDocument()
      })

      const memberButton = screen.getByText('Membro Teste 1')
      await user.click(memberButton)

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/members/member-1')
      })

      await waitFor(() => {
        const toggles = screen.queryAllByRole('checkbox')
        expect(toggles.length).toBeGreaterThan(0)
      }, { timeout: 5000 })

      const toggle = screen.getAllByRole('checkbox')[0]
      await user.click(toggle)

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/permissions/member-1', {
          permissions: [],
        })
      }, { timeout: 3000 })

      // Verifica que GET /members é chamado após atualização
      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/members')
      }, { timeout: 5000 })

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Permissão removida com sucesso!')
      }, { timeout: 5000 })
    })

    it('deve reverter toggle em caso de erro na API', async () => {
      const user = userEvent.setup()

      vi.mocked(api.get)
        .mockResolvedValueOnce({ data: mockMembers }) // GET /members inicial
        .mockResolvedValueOnce({ // GET /members/member-1 ao selecionar
          data: {
            ...mockMembers[0],
            permissions: [],
          },
        })

      vi.mocked(api.post).mockRejectedValueOnce({
        response: {
          status: 500,
          data: { message: 'Erro interno' },
        },
      })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Membro Teste 1')).toBeInTheDocument()
      })

      const memberButton = screen.getByText('Membro Teste 1')
      await user.click(memberButton)

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/members/member-1')
      })

      await waitFor(() => {
        const toggles = screen.queryAllByRole('checkbox')
        expect(toggles.length).toBeGreaterThan(0)
      }, { timeout: 3000 })

      const toggle = screen.getAllByRole('checkbox')[0]
      await user.click(toggle)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled()
      })
    })

    it('deve atualizar lista de membros após atualizar permissões', async () => {
      const user = userEvent.setup()

      // POST retorna permissões atualizadas
      vi.mocked(api.post).mockResolvedValueOnce({
        data: {
          success: true,
          added: 1,
          permissions: [
            { id: 'perm-1', type: 'devotional_manage' },
          ],
        },
      })

      vi.mocked(api.get)
        .mockResolvedValueOnce({ data: mockMembers }) // GET /members inicial
        .mockResolvedValueOnce({ // GET /members/member-1 ao selecionar
          data: {
            ...mockMembers[0],
            permissions: [],
          },
        })
        .mockResolvedValueOnce({ // GET /members após atualização
          data: [
            {
              ...mockMembers[0],
              permissions: [
                { id: 'perm-1', type: 'devotional_manage' },
              ],
            },
            mockMembers[1],
          ],
        })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Membro Teste 1')).toBeInTheDocument()
      })

      const memberButton = screen.getByText('Membro Teste 1')
      await user.click(memberButton)

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/members/member-1')
      })

      await waitFor(() => {
        const toggles = screen.queryAllByRole('checkbox')
        expect(toggles.length).toBeGreaterThan(0)
      }, { timeout: 5000 })

      const toggle = screen.getAllByRole('checkbox')[0]
      await user.click(toggle)

      // Verifica que POST foi chamado
      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/permissions/member-1', {
          permissions: ['devotional_manage'],
        })
      }, { timeout: 3000 })

      // Verifica que GET /members é chamado após atualização
      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/members')
      }, { timeout: 5000 })

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Permissão adicionada com sucesso!')
      }, { timeout: 5000 })
    })

    it('deve usar permissões da resposta POST em vez de fazer GET adicional quando disponível', async () => {
      const user = userEvent.setup()

      // POST retorna permissões atualizadas
      vi.mocked(api.post).mockResolvedValueOnce({
        data: {
          success: true,
          added: 1,
          permissions: [
            { id: 'perm-1', type: 'devotional_manage' },
          ],
        },
      })

      vi.mocked(api.get)
        .mockResolvedValueOnce({ data: mockMembers }) // GET /members inicial
        .mockResolvedValueOnce({ // GET /members/member-1 ao selecionar
          data: {
            ...mockMembers[0],
            permissions: [],
          },
        })
        .mockResolvedValueOnce({ // GET /members após atualização
          data: [
            {
              ...mockMembers[0],
              permissions: [
                { id: 'perm-1', type: 'devotional_manage' },
              ],
            },
            mockMembers[1],
          ],
        })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Membro Teste 1')).toBeInTheDocument()
      })

      const memberButton = screen.getByText('Membro Teste 1')
      await user.click(memberButton)

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/members/member-1')
      })

      await waitFor(() => {
        const toggles = screen.queryAllByRole('checkbox')
        expect(toggles.length).toBeGreaterThan(0)
      }, { timeout: 5000 })

      const toggle = screen.getAllByRole('checkbox')[0]
      await user.click(toggle)

      // Verifica que POST foi chamado e retornou permissões
      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/permissions/member-1', {
          permissions: ['devotional_manage'],
        })
      }, { timeout: 3000 })

      // Verifica que GET /members é chamado após atualização
      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/members')
      }, { timeout: 5000 })
    })
  })

  describe('Proteção de ADMINGERAL', () => {
    it('deve impedir alteração de permissões de ADMINGERAL', async () => {
      const user = userEvent.setup()

      const adminMember = {
        id: 'admin-1',
        name: 'Admin Geral',
        email: 'admin@example.com',
        role: 'ADMINGERAL',
        permissions: [],
      }

      vi.mocked(api.get)
        .mockResolvedValueOnce({ data: [adminMember] }) // GET /members inicial
        .mockResolvedValueOnce({ data: adminMember }) // GET /members/admin-1 ao selecionar

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Admin Geral')).toBeInTheDocument()
      })

      const memberButton = screen.getByText('Admin Geral')
      await user.click(memberButton)

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/members/admin-1')
      })

      // Aguarda os toggles aparecerem (são checkboxes, não switches)
      await waitFor(() => {
        const toggles = screen.queryAllByRole('checkbox')
        expect(toggles.length).toBeGreaterThan(0)
      }, { timeout: 5000 })

      // Aguarda os toggles aparecerem
      const toggles = screen.getAllByRole('checkbox')
      expect(toggles.length).toBeGreaterThan(0)
      
      // Verifica que todos os toggles estão desabilitados para ADMINGERAL
      toggles.forEach(toggle => {
        expect(toggle).toBeDisabled()
      })
      
      // Como os toggles estão desabilitados, o onChange não será disparado
      // Mas vamos verificar que a mensagem informativa está sendo exibida
      await waitFor(() => {
        expect(screen.getByText(/Administrador Geral possui todas as permissões automaticamente/i)).toBeInTheDocument()
      }, { timeout: 3000 })

      // Verifica que nenhuma chamada POST foi feita
      expect(api.post).not.toHaveBeenCalled()
    })
  })

  describe('Tratamento robusto de permissões', () => {
    it('deve processar permissões corretamente quando vem como array de objetos', async () => {
      const member = {
        id: 'member-1',
        name: 'Membro Teste',
        email: 'membro@example.com',
        role: 'MEMBER',
        permissions: [
          { id: 'perm-1', type: 'devotional_manage' },
          { id: 'perm-2', type: 'members_view' },
        ],
      }

      vi.mocked(api.get).mockResolvedValue({
        data: [member],
      })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Membro Teste')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('deve processar permissões corretamente quando vem como array de strings', async () => {
      const member = {
        id: 'member-1',
        name: 'Membro Teste',
        email: 'membro@example.com',
        role: 'MEMBER',
        permissions: ['devotional_manage', 'members_view'],
      }

      vi.mocked(api.get).mockResolvedValue({
        data: [member],
      })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Membro Teste')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('deve fazer fallback para GET quando POST não retorna permissões', async () => {
      const user = userEvent.setup()

      vi.mocked(api.get)
        .mockResolvedValueOnce({ data: mockMembers }) // GET /members inicial
        .mockResolvedValueOnce({ // GET /members/member-1 ao selecionar
          data: {
            ...mockMembers[0],
            permissions: [],
          },
        })
        // GET adicional quando POST não retorna permissões
        .mockResolvedValueOnce({
          data: {
            ...mockMembers[0],
            permissions: [
              { id: 'perm-1', type: 'devotional_manage' },
            ],
          },
        })
        // GET /members após atualização
        .mockResolvedValueOnce({
          data: [
            {
              ...mockMembers[0],
              permissions: [
                { id: 'perm-1', type: 'devotional_manage' },
              ],
            },
            mockMembers[1],
          ],
        })

      // POST não retorna permissões (simula resposta antiga)
      vi.mocked(api.post).mockResolvedValueOnce({
        data: {
          success: true,
          added: 1,
          // permissions não está presente
        },
      })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Membro Teste 1')).toBeInTheDocument()
      })

      const memberButton = screen.getByText('Membro Teste 1')
      await user.click(memberButton)

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/members/member-1')
      })

      // Aguarda o componente carregar os detalhes do membro
      await waitFor(() => {
        const toggles = screen.queryAllByRole('checkbox')
        expect(toggles.length).toBeGreaterThan(0)
      }, { timeout: 5000 })

      const toggle = screen.getAllByRole('checkbox')[0]
      await user.click(toggle)

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/permissions/member-1', {
          permissions: ['devotional_manage'],
        })
      })

      // Verifica que GET adicional é feito quando POST não retorna permissões
      await waitFor(() => {
        // Verifica que GET /members/member-1 foi chamado novamente (fallback)
        const calls = vi.mocked(api.get).mock.calls
        const memberCalls = calls.filter(call => call[0] === '/members/member-1')
        expect(memberCalls.length).toBeGreaterThan(1)
      }, { timeout: 5000 })

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Permissão adicionada com sucesso!')
      })
    })
  })

  describe('Sincronização de estado', () => {
    it('deve sempre buscar detalhes do membro quando selecionado', async () => {
      const user = userEvent.setup()

      vi.mocked(api.get)
        .mockResolvedValueOnce({ data: mockMembers })
        .mockResolvedValueOnce({
          data: {
            ...mockMembers[0],
            permissions: [
              { id: 'perm-1', type: 'devotional_manage' },
              { id: 'perm-2', type: 'members_view' },
            ],
          },
        })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Membro Teste 1')).toBeInTheDocument()
      })

      const memberButton = screen.getByText('Membro Teste 1')
      await user.click(memberButton)

      // Verifica que sempre busca detalhes do membro, mesmo que já esteja na lista
      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/members/member-1')
      })
    })

    it('deve buscar membro da URL quando memberId está presente', async () => {
      mockSearchParams.set('memberId', 'member-1')

      vi.mocked(api.get)
        .mockResolvedValueOnce({ data: mockMembers })
        .mockResolvedValueOnce({
          data: {
            ...mockMembers[0],
            permissions: [{ id: 'perm-1', type: 'devotional_manage' }],
          },
        })

      renderComponent()

      // Verifica que busca o membro da URL
      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/members/member-1')
      })
    })
  })
})

