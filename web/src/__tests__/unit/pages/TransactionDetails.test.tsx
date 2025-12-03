import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import TransactionDetails from '@/pages/Finances/TransactionDetails'
import api from '@/api/api'
import { useAuthStore } from '@/stores/authStore'
import { mockUser } from '@/test/mocks/mockData'

vi.mock('@/api/api', () => ({
  default: {
    get: vi.fn(),
  },
}))

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
    useParams: () => ({ id: 'trans-1' }),
  }
})

describe('TransactionDetails Page', () => {
  beforeEach(() => {
    useAuthStore.setState({
      token: 'token',
      user: mockUser,
    })
    vi.clearAllMocks()
  })

  it('deve carregar e exibir detalhes da transação', async () => {
    const mockTransaction = {
      id: 'trans-1',
      title: 'Dízimo',
      amount: 1000.0,
      type: 'ENTRY',
      entryType: 'DIZIMO',
      category: 'Dízimo',
      tithePayerName: 'João Silva',
      isTithePayerMember: false,
      branchId: 'branch-123',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      CreatedByUser: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
      },
    }

    vi.mocked(api.get).mockResolvedValue({ data: mockTransaction })

    render(
      <MemoryRouter>
        <TransactionDetails />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/finances/trans-1')
      // Verificar título usando testid
      expect(screen.getByTestId('transaction-title')).toHaveTextContent('Dízimo')
      // Verificar valor usando testid (formato: +R$ 1000,00)
      const amountElement = screen.getByTestId('transaction-amount')
      expect(amountElement).toHaveTextContent('R$')
      expect(amountElement).toHaveTextContent('1000,00')
      // Verificar tipo de entrada usando testid
      expect(screen.getByTestId('transaction-entry-type')).toHaveTextContent('Dízimo')
      // Verificar categoria usando testid
      expect(screen.getByTestId('transaction-category')).toHaveTextContent('Dízimo')
      expect(screen.getByText('João Silva')).toBeInTheDocument()
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })
  })

  it('deve exibir nome do membro dizimista ao invés do ID', async () => {
    const mockTransaction = {
      id: 'trans-1',
      title: 'Dízimo',
      amount: 1000.0,
      type: 'ENTRY',
      entryType: 'DIZIMO',
      category: 'Dízimo',
      tithePayerMemberId: 'member-123',
      isTithePayerMember: true,
      branchId: 'branch-123',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      CreatedByUser: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
      },
      TithePayerMember: {
        id: 'member-123',
        name: 'João Silva',
        email: 'joao@example.com',
      },
    }

    vi.mocked(api.get).mockResolvedValue({ data: mockTransaction })

    render(
      <MemoryRouter>
        <TransactionDetails />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument()
      // Verificar que não está mostrando o ID
      expect(screen.queryByText(/member-123/)).not.toBeInTheDocument()
    })
  })

  it('deve exibir transação de saída com exitType', async () => {
    const mockTransaction = {
      id: 'trans-1',
      title: 'Aluguel',
      amount: 1500.0,
      type: 'EXIT',
      exitType: 'ALUGUEL',
      category: 'Despesas',
      branchId: 'branch-123',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      CreatedByUser: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
      },
    }

    vi.mocked(api.get).mockResolvedValue({ data: mockTransaction })

    render(
      <MemoryRouter>
        <TransactionDetails />
      </MemoryRouter>
    )

    await waitFor(() => {
      // Verificar título usando testid
      expect(screen.getByTestId('transaction-title')).toHaveTextContent('Aluguel')
      // Verificar tipo de saída usando testid
      expect(screen.getByTestId('transaction-exit-type')).toHaveTextContent('Aluguel')
    })
  })

  it('deve exibir transação com tipo CONTRIBUICAO e contribuinte', async () => {
    const mockTransaction = {
      id: 'trans-1',
      title: 'Transação de Contribuição',
      amount: 500.0,
      type: 'ENTRY',
      entryType: 'CONTRIBUICAO',
      contributionId: 'contrib-1',
      category: 'Contribuição',
      tithePayerMemberId: 'member-123',
      branchId: 'branch-123',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      CreatedByUser: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
      },
      Contribution: {
        id: 'contrib-1',
        title: 'Contribuição Teste',
        description: 'Descrição da contribuição',
      },
      TithePayerMember: {
        id: 'member-123',
        name: 'Maria Santos',
        email: 'maria@example.com',
      },
    }

    vi.mocked(api.get).mockResolvedValue({ data: mockTransaction })

    render(
      <MemoryRouter>
        <TransactionDetails />
      </MemoryRouter>
    )

    await waitFor(() => {
      // Verificar tipo de entrada "Contribuição" usando testid
      const entryTypeElement = screen.getByTestId('transaction-entry-type')
      expect(entryTypeElement).toBeInTheDocument()
      expect(entryTypeElement).toHaveTextContent('Contribuição')
      
      // Verificar título da contribuição vinculada usando testid
      const contributionTitle = screen.getByTestId('contribution-linked-title')
      expect(contributionTitle).toBeInTheDocument()
      expect(contributionTitle).toHaveTextContent('Contribuição Teste')
      
      // Verificar descrição da contribuição usando testid
      const contributionDescription = screen.getByTestId('contribution-linked-description')
      expect(contributionDescription).toBeInTheDocument()
      expect(contributionDescription).toHaveTextContent('Descrição da contribuição')
      
      // Verificar label e nome do contribuinte
      expect(screen.getByText('Contribuinte')).toBeInTheDocument()
      const contributorName = screen.getByTestId('contributor-name')
      expect(contributorName).toBeInTheDocument()
      expect(contributorName).toHaveTextContent('Maria Santos')
    })
  })

  it('deve exibir nome do contribuinte não membro para CONTRIBUICAO', async () => {
    const mockTransaction = {
      id: 'trans-1',
      title: 'Transação de Contribuição',
      amount: 500.0,
      type: 'ENTRY',
      entryType: 'CONTRIBUICAO',
      contributionId: 'contrib-1',
      category: 'Contribuição',
      tithePayerName: 'Visitante Silva',
      branchId: 'branch-123',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      CreatedByUser: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
      },
      Contribution: {
        id: 'contrib-1',
        title: 'Contribuição Teste',
        description: 'Descrição da contribuição',
      },
    }

    vi.mocked(api.get).mockResolvedValue({ data: mockTransaction })

    render(
      <MemoryRouter>
        <TransactionDetails />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Contribuinte')).toBeInTheDocument()
      expect(screen.getByText('Visitante Silva')).toBeInTheDocument()
    })
  })

  it('deve exibir erro e redirecionar quando transação não encontrada', async () => {
    const toast = await import('react-hot-toast')
    vi.mocked(api.get).mockRejectedValue({
      response: {
        data: {
          message: 'Transação não encontrada',
        },
      },
    })

    render(
      <MemoryRouter>
        <TransactionDetails />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalledWith('Transação não encontrada')
      expect(mockNavigate).toHaveBeenCalledWith('/app/finances')
    })
  })

  it('deve navegar de volta ao clicar em Voltar', async () => {
    const mockTransaction = {
      id: 'trans-1',
      title: 'Teste',
      amount: 100.0,
      type: 'ENTRY',
      entryType: 'OFERTA',
      branchId: 'branch-123',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    }

    vi.mocked(api.get).mockResolvedValue({ data: mockTransaction })

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <TransactionDetails />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Voltar')).toBeInTheDocument()
    })

    const backButton = screen.getByText('Voltar')
    await user.click(backButton)

    expect(mockNavigate).toHaveBeenCalledWith('/app/finances')
  })
})

