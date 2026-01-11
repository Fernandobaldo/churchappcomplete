import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TransactionDetails from '@/pages/Finances/TransactionDetails'
import { fixtures } from '@/test/fixtures'
import { renderWithProviders } from '@/test/helpers'
import { mockApiResponse, mockApiError } from '@/test/mockApi'

vi.mock('@/api/api')
const mockToastError = vi.fn()
vi.mock('react-hot-toast', () => ({
  default: {
    error: mockToastError,
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

describe('TransactionDetails - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // TESTE 1: BASIC RENDER - Carrega e exibe detalhes da transação
  // ============================================================================
  it('deve carregar e exibir detalhes da transação', async () => {
    // Arrange
    const mockUser = fixtures.user()
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
    mockApiResponse('get', '/finances/trans-1', mockTransaction)

    // Act
    renderWithProviders(<TransactionDetails />, {
      initialEntries: ['/app/finances/trans-1'],
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('transaction-title')).toHaveTextContent('Dízimo')
      const amountElement = screen.getByTestId('transaction-amount')
      expect(amountElement).toHaveTextContent('R$')
      expect(amountElement).toHaveTextContent('1000,00')
      expect(screen.getByTestId('transaction-entry-type')).toHaveTextContent('Dízimo')
      expect(screen.getByTestId('transaction-category')).toHaveTextContent('Dízimo')
      expect(screen.getByText('João Silva')).toBeInTheDocument()
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // TESTE 2: BASIC RENDER - Exibe nome do membro dizimista ao invés do ID
  // ============================================================================
  it('deve exibir nome do membro dizimista ao invés do ID', async () => {
    // Arrange
    const mockUser = fixtures.user()
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
    mockApiResponse('get', '/finances/trans-1', mockTransaction)

    // Act
    renderWithProviders(<TransactionDetails />, {
      initialEntries: ['/app/finances/trans-1'],
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument()
      expect(screen.queryByText(/member-123/)).not.toBeInTheDocument()
    })
  })

  // ============================================================================
  // TESTE 3: BASIC RENDER - Exibe transação de saída com exitType
  // ============================================================================
  it('deve exibir transação de saída com exitType', async () => {
    // Arrange
    const mockUser = fixtures.user()
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
    mockApiResponse('get', '/finances/trans-1', mockTransaction)

    // Act
    renderWithProviders(<TransactionDetails />, {
      initialEntries: ['/app/finances/trans-1'],
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('transaction-title')).toHaveTextContent('Aluguel')
      expect(screen.getByTestId('transaction-exit-type')).toHaveTextContent('Aluguel')
    })
  })

  // ============================================================================
  // TESTE 4: ERROR STATE - Exibe erro e redireciona quando transação não encontrada
  // ============================================================================
  it('deve exibir erro e redirecionar quando transação não encontrada', async () => {
    // Arrange
    const mockUser = fixtures.user()
    mockApiError('get', '/finances/trans-1', { message: 'Transação não encontrada' })

    // Act
    renderWithProviders(<TransactionDetails />, {
      initialEntries: ['/app/finances/trans-1'],
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/app/finances')
    })
  })

  // ============================================================================
  // TESTE 5: PRIMARY INTERACTION - Navega de volta ao clicar em Voltar
  // ============================================================================
  it('deve navegar de volta ao clicar em Voltar', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockUser = fixtures.user()
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
    mockApiResponse('get', '/finances/trans-1', mockTransaction)

    // Act
    renderWithProviders(<TransactionDetails />, {
      initialEntries: ['/app/finances/trans-1'],
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    await waitFor(() => {
      expect(screen.getByText('Voltar')).toBeInTheDocument()
    })

    const backButton = screen.getByText('Voltar')
    await user.click(backButton)

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('/app/finances')
  })
})
