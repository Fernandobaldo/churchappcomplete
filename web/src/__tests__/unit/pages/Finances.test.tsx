import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import Finances from '@/pages/Finances/index'
import api from '@/api/api'
import { useAuthStore } from '@/stores/authStore'
import { mockUser } from '@/test/mocks/mockData'

vi.mock('@/api/api')
vi.mock('react-hot-toast', () => ({
  default: {
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

vi.mock('@/components/PermissionGuard', () => ({
  default: ({ children, permission }: any) => {
    const { user } = useAuthStore.getState()
    if (!user) return null
    
    // Simula a lógica de hasAccess: ADMINGERAL/ADMINFILIAL têm acesso ou verifica permissões
    const hasPermission = 
      user.role === 'ADMINGERAL' || 
      user.role === 'ADMINFILIAL' ||
      user.permissions?.some((p: any) => {
        const permType = typeof p === 'object' ? p.type : p
        return permType === permission
      }) === true
    
    return hasPermission ? <>{children}</> : null
  },
}))

describe('Finances Page', () => {
  beforeEach(() => {
    useAuthStore.setState({
      token: 'token',
      user: {
        ...mockUser,
        permissions: ['finances_manage'],
      },
    })
    vi.clearAllMocks()
  })

  it('deve renderizar a página corretamente', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        transactions: [],
        summary: {
          total: 0,
          entries: 0,
          exits: 0,
        },
      },
    })

    render(
      <MemoryRouter>
        <Finances />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Finanças')).toBeInTheDocument()
      expect(screen.getByText('Gestão financeira da filial')).toBeInTheDocument()
    })
  })

  it('deve exibir resumo financeiro', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        transactions: [],
        summary: {
          total: 1200.0,
          entries: 1500.0,
          exits: 300.0,
        },
      },
    })

    render(
      <MemoryRouter>
        <Finances />
      </MemoryRouter>
    )

    await waitFor(() => {
      // Verificar Saldo Total
      const saldoLabel = screen.getByText('Saldo Total')
      expect(saldoLabel).toBeInTheDocument()
      const saldoCard = saldoLabel.closest('.card')
      expect(saldoCard?.textContent).toContain('R$')
      expect(saldoCard?.textContent).toContain('1200,00')
      
      // Verificar Entradas
      const entradasLabel = screen.getByText('Entradas')
      expect(entradasLabel).toBeInTheDocument()
      const entradasCard = entradasLabel.closest('.card')
      expect(entradasCard?.textContent).toContain('R$')
      expect(entradasCard?.textContent).toContain('1500,00')
      
      // Verificar Saídas
      const saidasLabel = screen.getByText('Saídas')
      expect(saidasLabel).toBeInTheDocument()
      const saidasCard = saidasLabel.closest('.card')
      expect(saidasCard?.textContent).toContain('R$')
      expect(saidasCard?.textContent).toContain('300,00')
    })
  })

  it('deve exibir lista de transações', async () => {
    const mockTransactions = [
      {
        id: 'trans-1',
        title: 'Dízimo',
        amount: 1000.0,
        type: 'ENTRY' as const,
        category: 'Dízimo',
        branchId: 'branch-1',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      },
      {
        id: 'trans-2',
        title: 'Pagamento',
        amount: 300.0,
        type: 'EXIT' as const,
        category: 'Despesas',
        branchId: 'branch-1',
        createdAt: '2024-01-16T10:00:00Z',
        updatedAt: '2024-01-16T10:00:00Z',
      },
    ]

    vi.mocked(api.get).mockResolvedValue({
      data: {
        transactions: mockTransactions,
        summary: {
          total: 700.0,
          entries: 1000.0,
          exits: 300.0,
        },
      },
    })

    render(
      <MemoryRouter>
        <Finances />
      </MemoryRouter>
    )

    await waitFor(() => {
      // "Dízimo" aparece tanto no título quanto na categoria
      // Verificamos que ambos existem usando getAllByText
      const dizimoElements = screen.getAllByText('Dízimo')
      expect(dizimoElements.length).toBe(2) // Título e categoria
      expect(dizimoElements[0]).toBeInTheDocument()
      expect(dizimoElements[1]).toBeInTheDocument()
      
      // Verificar que ambos estão dentro da tabela
      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()
      expect(table).toContainElement(dizimoElements[0])
      expect(table).toContainElement(dizimoElements[1])
      
      expect(screen.getByText('Pagamento')).toBeInTheDocument()
    })
  })

  it('deve exibir mensagem quando não há transações', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        transactions: [],
        summary: {
          total: 0,
          entries: 0,
          exits: 0,
        },
      },
    })

    render(
      <MemoryRouter>
        <Finances />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Nenhuma transação cadastrada')).toBeInTheDocument()
    })
  })

  it('deve navegar para criar transação ao clicar em Nova Transação', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        transactions: [],
        summary: {
          total: 0,
          entries: 0,
          exits: 0,
        },
      },
    })

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Finances />
      </MemoryRouter>
    )

    const newButton = await screen.findByText('Nova Transação')
    await user.click(newButton)

    expect(mockNavigate).toHaveBeenCalledWith('/app/finances/new')
  })

  it('deve exibir erro quando falha ao carregar finanças', async () => {
    const toast = await import('react-hot-toast')
    vi.mocked(api.get).mockRejectedValue(new Error('Erro na API'))

    render(
      <MemoryRouter>
        <Finances />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalled()
    })
  })

  it('deve exibir saldo negativo em vermelho', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        transactions: [],
        summary: {
          total: -500.0,
          entries: 1000.0,
          exits: 1500.0,
        },
      },
    })

    render(
      <MemoryRouter>
        <Finances />
      </MemoryRouter>
    )

    await waitFor(() => {
      const saldoElement = screen.getByText('R$ -500,00')
      expect(saldoElement).toBeInTheDocument()
      expect(saldoElement.className).toContain('text-red-600')
    })
  })

  it('deve exibir saldo positivo em verde', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        transactions: [],
        summary: {
          total: 500.0,
          entries: 1000.0,
          exits: 500.0,
        },
      },
    })

    render(
      <MemoryRouter>
        <Finances />
      </MemoryRouter>
    )

    await waitFor(() => {
      // Buscar pelo texto "Saldo Total" e então encontrar o valor no mesmo card
      const saldoLabel = screen.getByText('Saldo Total')
      expect(saldoLabel).toBeInTheDocument()
      
      // Encontrar o elemento pai (card) e então buscar o valor dentro dele
      const saldoCard = saldoLabel.closest('.card')
      expect(saldoCard).toBeInTheDocument()
      
      // Verificar que o valor está em verde (text-green-600)
      const saldoElement = saldoCard?.querySelector('.text-green-600')
      expect(saldoElement).toBeInTheDocument()
      expect(saldoElement).toHaveTextContent('R$ 500,00')
      expect(saldoElement?.className).toContain('text-green-600')
    })
  })

  it('deve exibir transações com categoria "Sem categoria" quando não há categoria', async () => {
    const mockTransactions = [
      {
        id: 'trans-1',
        title: 'Transação Sem Categoria',
        amount: 100.0,
        type: 'ENTRY' as const,
        category: null,
        branchId: 'branch-1',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      },
    ]

    vi.mocked(api.get).mockResolvedValue({
      data: {
        transactions: mockTransactions,
        summary: {
          total: 100.0,
          entries: 100.0,
          exits: 0,
        },
      },
    })

    render(
      <MemoryRouter>
        <Finances />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Sem categoria')).toBeInTheDocument()
    })
  })

  it('não deve exibir botão Nova Transação quando usuário não tem permissão', async () => {
    useAuthStore.setState({
      token: 'token',
      user: {
        ...mockUser,
        permissions: [], // Sem permissão
      },
    })

    vi.mocked(api.get).mockResolvedValue({
      data: {
        transactions: [],
        summary: {
          total: 0,
          entries: 0,
          exits: 0,
        },
      },
    })

    render(
      <MemoryRouter>
        <Finances />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.queryByText('Nova Transação')).not.toBeInTheDocument()
    })
  })
})

