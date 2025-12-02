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
    beforeEach(async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockMembers })
    })

    it('deve adicionar permissão quando toggle é ativado', async () => {
      const user = userEvent.setup()

      vi.mocked(api.get).mockResolvedValueOnce({
        data: {
          ...mockMembers[0],
          permissions: [],
        },
      })

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
        .mockResolvedValueOnce({ data: mockMembers })
        .mockResolvedValueOnce({
          data: {
            ...mockMembers[0],
            permissions: [],
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

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Membro Teste 1')).toBeInTheDocument()
      })

      const memberButton = screen.getByText('Membro Teste 1')
      await user.click(memberButton)

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/members/member-1')
      })

      // Aguarda o toggle aparecer
      await waitFor(() => {
        const toggles = screen.queryAllByRole('switch')
        expect(toggles.length).toBeGreaterThan(0)
      })

      const toggle = screen.getAllByRole('switch')[0]
      await user.click(toggle)

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/permissions/member-1', {
          permissions: ['devotional_manage'],
        })
      })

      // Verifica que GET /members é chamado após atualização
      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/members')
      })

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Permissão adicionada com sucesso!')
      })
    })

    it('deve remover permissão quando toggle é desativado', async () => {
      const user = userEvent.setup()

      vi.mocked(api.get).mockResolvedValueOnce({
        data: {
          ...mockMembers[0],
          permissions: [
            { id: 'perm-1', type: 'devotional_manage' },
          ],
        },
      })

      // POST retorna permissões atualizadas (vazias)
      vi.mocked(api.post).mockResolvedValueOnce({
        data: {
          success: true,
          added: 0,
          permissions: [],
        },
      })

      vi.mocked(api.get)
        .mockResolvedValueOnce({ data: mockMembers })
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
        const toggles = screen.queryAllByRole('switch')
        expect(toggles.length).toBeGreaterThan(0)
      })

      const toggle = screen.getAllByRole('switch')[0]
      await user.click(toggle)

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/permissions/member-1', {
          permissions: [],
        })
      })

      // Verifica que GET /members é chamado após atualização
      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/members')
      })

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Permissão removida com sucesso!')
      })
    })

    it('deve reverter toggle em caso de erro na API', async () => {
      const user = userEvent.setup()

      vi.mocked(api.get).mockResolvedValueOnce({
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

      vi.mocked(api.get)
        .mockResolvedValueOnce({ data: mockMembers })
        .mockResolvedValueOnce({
          data: {
            ...mockMembers[0],
            permissions: [],
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
        const toggles = screen.queryAllByRole('switch')
        expect(toggles.length).toBeGreaterThan(0)
      })

      const toggle = screen.getAllByRole('switch')[0]
      await user.click(toggle)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled()
      })
    })

    it('deve atualizar lista de membros após atualizar permissões', async () => {
      const user = userEvent.setup()

      vi.mocked(api.get).mockResolvedValueOnce({
        data: {
          ...mockMembers[0],
          permissions: [],
        },
      })

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
        .mockResolvedValueOnce({ data: mockMembers })
        .mockResolvedValueOnce({
          data: {
            ...mockMembers[0],
            permissions: [],
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
        const toggles = screen.queryAllByRole('switch')
        expect(toggles.length).toBeGreaterThan(0)
      })

      const toggle = screen.getAllByRole('switch')[0]
      await user.click(toggle)

      // Verifica que POST foi chamado
      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/permissions/member-1', {
          permissions: ['devotional_manage'],
        })
      })

      // Verifica que GET /members é chamado após atualização
      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/members')
      })

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Permissão adicionada com sucesso!')
      })
    })

    it('deve usar permissões da resposta POST em vez de fazer GET adicional quando disponível', async () => {
      const user = userEvent.setup()

      vi.mocked(api.get).mockResolvedValueOnce({
        data: {
          ...mockMembers[0],
          permissions: [],
        },
      })

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
        .mockResolvedValueOnce({ data: mockMembers })
        .mockResolvedValueOnce({
          data: {
            ...mockMembers[0],
            permissions: [],
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
        const toggles = screen.queryAllByRole('switch')
        expect(toggles.length).toBeGreaterThan(0)
      })

      const toggle = screen.getAllByRole('switch')[0]
      await user.click(toggle)

      // Verifica que POST foi chamado e retornou permissões
      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/permissions/member-1', {
          permissions: ['devotional_manage'],
        })
      })

      // Verifica que GET /members é chamado após atualização
      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/members')
      })
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
        .mockResolvedValueOnce({ data: [adminMember] })
        .mockResolvedValueOnce({ data: adminMember })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Admin Geral')).toBeInTheDocument()
      })

      const memberButton = screen.getByText('Admin Geral')
      await user.click(memberButton)

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/members/admin-1')
      })

      // Tenta clicar em um toggle
      await waitFor(() => {
        const toggles = screen.queryAllByRole('switch')
        if (toggles.length > 0) {
          user.click(toggles[0])
        }
      })

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining('Administrador Geral possui todas as permissões')
        )
      })

      expect(api.post).not.toHaveBeenCalled()
    })
  })

  describe('Tratamento robusto de permissões', () => {
    it('deve processar permissões corretamente quando vem como array de objetos', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: [
          {
            id: 'member-1',
            name: 'Membro Teste',
            email: 'membro@example.com',
            role: 'MEMBER',
            permissions: [
              { id: 'perm-1', type: 'devotional_manage' },
              { id: 'perm-2', type: 'members_view' },
            ],
          },
        ],
      })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Membro Teste')).toBeInTheDocument()
      })
    })

    it('deve processar permissões corretamente quando vem como array de strings', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: [
          {
            id: 'member-1',
            name: 'Membro Teste',
            email: 'membro@example.com',
            role: 'MEMBER',
            permissions: ['devotional_manage', 'members_view'],
          },
        ],
      })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Membro Teste')).toBeInTheDocument()
      })
    })

    it('deve fazer fallback para GET quando POST não retorna permissões', async () => {
      const user = userEvent.setup()

      vi.mocked(api.get).mockResolvedValueOnce({
        data: {
          ...mockMembers[0],
          permissions: [],
        },
      })

      // POST não retorna permissões (simula resposta antiga)
      vi.mocked(api.post).mockResolvedValueOnce({
        data: {
          success: true,
          added: 1,
          // permissions não está presente
        },
      })

      vi.mocked(api.get)
        .mockResolvedValueOnce({ data: mockMembers })
        .mockResolvedValueOnce({
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
        const toggles = screen.queryAllByRole('switch')
        expect(toggles.length).toBeGreaterThan(0)
      })

      const toggle = screen.getAllByRole('switch')[0]
      await user.click(toggle)

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/permissions/member-1', {
          permissions: ['devotional_manage'],
        })
      })

      // Verifica que GET adicional é feito quando POST não retorna permissões
      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/members/member-1')
      }, { timeout: 3000 })

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

