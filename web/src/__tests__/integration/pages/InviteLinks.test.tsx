import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import InviteLinks from '@/pages/Members/InviteLinks'
import { useAuthStore } from '@/stores/authStore'
import { mockUser } from '@/test/mocks/mockData'

// Mock dos planos esperados - usando vi.hoisted para garantir que seja executado antes do vi.mock
const { mockApi, mockPlans } = vi.hoisted(() => {
  const mockPlans = [
    {
      id: '1',
      name: 'Free',
      price: 0,
      maxMembers: 10,
      maxBranches: 1,
      features: ['Até 10 membros', '1 filial'],
      isActive: true,
    },
    {
      id: '2',
      name: 'Básico',
      price: 29.9,
      maxMembers: 50,
      maxBranches: 3,
      features: ['Até 50 membros', '3 filiais'],
      isActive: true,
    },
    {
      id: '3',
      name: 'Premium',
      price: 79.9,
      maxMembers: 200,
      maxBranches: 10,
      features: ['Até 200 membros', '10 filiais'],
      isActive: true,
    },
    {
      id: '4',
      name: 'Enterprise',
      price: 199.9,
      maxMembers: null,
      maxBranches: null,
      features: ['Membros ilimitados', 'Filiais ilimitadas'],
      isActive: true,
    },
  ]

  const mockApi = {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  }

  return { mockApi, mockPlans }
})

vi.mock('@/api/api', () => ({
  default: mockApi,
  plansApi: {
    getAll: vi.fn(() => Promise.resolve(mockPlans)),
  },
  subscriptionApi: {
    checkout: vi.fn(() => Promise.resolve({ subscription: { checkoutUrl: null } })),
  },
}))

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const mockUserWithBranch = {
  ...mockUser,
  branchId: 'branch-123',
}

describe('InviteLinks - Integração', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ user: mockUserWithBranch })
  })

  afterEach(() => {
    cleanup()
  })

  it('deve exibir modal de upgrade quando limite de plano for atingido', async () => {
    const user = userEvent.setup()

    // Mock da resposta de erro com PLAN_LIMIT_REACHED
    mockApi.post.mockRejectedValueOnce({
      response: {
        data: {
          code: 'PLAN_LIMIT_REACHED',
          error: 'PLAN_LIMIT_REACHED',
          message: 'Limite de membros do plano atingido',
        },
      },
    })

    // Mock da busca do plano atual
    mockApi.get.mockResolvedValueOnce({
      data: {
        plan: {
          name: 'Free',
          maxMembers: 10,
        },
      },
    } as any)

    // Mock da listagem de links
    mockApi.get.mockResolvedValueOnce({
      data: [],
    } as any)

    render(
      <MemoryRouter>
        <InviteLinks />
      </MemoryRouter>
    )

    // Aguardar carregamento
    await waitFor(() => {
      expect(screen.queryByText('Carregando')).not.toBeInTheDocument()
    })

    // Usar getByRole para encontrar o botão especificamente
    const createButton = screen.getByRole('button', { name: /Novo Link de Convite/i })
    await user.click(createButton)

    // Preencher formulário e submeter
    const createLinkButton = screen.getByRole('button', { name: /Criar Link/i })
    await user.click(createLinkButton)

    // Aguardar modal de upgrade aparecer
    await waitFor(() => {
      expect(screen.getByText('Upgrade do Plano')).toBeInTheDocument()
    })

    // Verificar que o modal de upgrade está visível
    expect(screen.getByText(/Seu plano atual atingiu o limite de membros/)).toBeInTheDocument()
    
    // Aguardar o carregamento dos planos no modal
    await waitFor(() => {
      expect(screen.getByText('Básico')).toBeInTheDocument()
    })
    
    // Usar getAllByText e verificar que pelo menos um existe, já que "Free" aparece múltiplas vezes
    const freeElements = screen.getAllByText('Free')
    expect(freeElements.length).toBeGreaterThan(0)
  })

  it('deve fechar modal de upgrade ao clicar em fechar', async () => {
    const user = userEvent.setup()

    // Mock da resposta de erro
    mockApi.post.mockRejectedValueOnce({
      response: {
        data: {
          code: 'PLAN_LIMIT_REACHED',
          error: 'PLAN_LIMIT_REACHED',
        },
      },
    })

    // Mock da busca do plano atual
    mockApi.get.mockResolvedValueOnce({
      data: {
        plan: {
          name: 'Free',
          maxMembers: 10,
        },
      },
    } as any)

    // Mock da listagem de links
    mockApi.get.mockResolvedValueOnce({
      data: [],
    } as any)

    render(
      <MemoryRouter>
        <InviteLinks />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.queryByText('Carregando')).not.toBeInTheDocument()
    })

    // Usar getByRole para encontrar o botão especificamente
    const createButton = screen.getByRole('button', { name: /Novo Link de Convite/i })
    await user.click(createButton)

    const createLinkButton = screen.getByRole('button', { name: /Criar Link/i })
    await user.click(createLinkButton)

    // Aguardar modal aparecer
    await waitFor(() => {
      expect(screen.getByText('Upgrade do Plano')).toBeInTheDocument()
    })

    // Fechar modal - o botão de fechar pode não ter um nome acessível, então vamos procurar pelo ícone X ou pelo botão sem nome que está no header
    const closeButtons = screen.getAllByRole('button')
    // Procurar pelo botão que não tem nome (geralmente é o botão de fechar com ícone)
    const closeButton = closeButtons.find(button => {
      const buttonText = button.textContent || ''
      return buttonText === '' || buttonText.trim() === ''
    })
    if (closeButton) {
      await user.click(closeButton)
    } else {
      // Se não encontrar, tentar encontrar pelo aria-label ou testid
      const closeByAria = screen.queryByRole('button', { name: /fechar|close/i })
      if (closeByAria) {
        await user.click(closeByAria)
      }
    }

    // Verificar que o modal foi fechado
    await waitFor(() => {
      expect(screen.queryByText('Upgrade do Plano')).not.toBeInTheDocument()
    })
  })

  it('deve mostrar toast de erro quando limite for atingido', async () => {
    const toast = await import('react-hot-toast')
    const user = userEvent.setup()

    // Mock da resposta de erro
    mockApi.post.mockRejectedValueOnce({
      response: {
        data: {
          code: 'PLAN_LIMIT_REACHED',
          error: 'PLAN_LIMIT_REACHED',
          message: 'Limite atingido',
        },
      },
    })

    // Mock da busca do plano atual
    mockApi.get.mockResolvedValueOnce({
      data: {
        plan: {
          name: 'Free',
          maxMembers: 10,
        },
      },
    } as any)

    // Mock da listagem de links
    mockApi.get.mockResolvedValueOnce({
      data: [],
    } as any)

    render(
      <MemoryRouter>
        <InviteLinks />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.queryByText('Carregando')).not.toBeInTheDocument()
    })

    // Usar getByRole para encontrar o botão especificamente
    const createButton = screen.getByRole('button', { name: /Novo Link de Convite/i })
    await user.click(createButton)

    const createLinkButton = screen.getByRole('button', { name: /Criar Link/i })
    await user.click(createLinkButton)

    // Verificar que toast de erro foi chamado
    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalledWith(
        expect.stringContaining('Limite de membros do plano atingido')
      )
    })
  })
})

