import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EditTransaction from '@/pages/Finances/EditTransaction'
import { fixtures } from '@/test/fixtures'
import { renderWithProviders } from '@/test/helpers'
import { mockApiResponse, mockApiError } from '@/test/mockApi'
import api from '@/api/api'

vi.mock('@/api/api')
const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
vi.mock('react-hot-toast', () => ({
  default: {
    success: mockToastSuccess,
    error: mockToastError,
  },
}))

vi.mock('@/components/MemberSearch', () => ({
  default: ({ value, onChange, placeholder }: any) => (
    <div>
      <input
        data-testid="member-search-input"
        value={value || ''}
        onChange={(e) => onChange && onChange(e.target.value, e.target.value)}
        placeholder={placeholder}
      />
    </div>
  ),
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

describe('EditTransaction - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // TESTE 1: LOADING STATE - Carrega dados da transação existente
  // ============================================================================
  it('deve carregar dados da transação existente', async () => {
    // Arrange
    const mockUser = fixtures.user()
    const mockTransaction = {
      id: 'trans-1',
      title: 'Transação Original',
      amount: 500.0,
      type: 'ENTRY',
      entryType: 'OFERTA',
      category: 'Oferta',
      branchId: 'branch-123',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    }
    mockApiResponse('get', '/finances/trans-1', mockTransaction)

    // Act
    renderWithProviders(<EditTransaction />, {
      initialEntries: ['/app/finances/trans-1/edit'],
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      const titleInput = document.getElementById('title') as HTMLInputElement
      expect(titleInput).toBeInTheDocument()
      expect(titleInput.value).toBe('Transação Original')
      
      const amountInput = document.getElementById('amount') as HTMLInputElement
      expect(amountInput.value).toBe('500')
      
      const categoryInput = document.getElementById('category') as HTMLInputElement
      expect(categoryInput.value).toBe('Oferta')
    })
  })

  // ============================================================================
  // TESTE 2: BASIC RENDER - Preenche campos de transação de saída com exitType
  // ============================================================================
  it('deve preencher campos de transação de saída com exitType', async () => {
    // Arrange
    const mockUser = fixtures.user()
    const mockTransaction = {
      id: 'trans-1',
      title: 'Aluguel',
      amount: 1500.0,
      type: 'EXIT',
      exitType: 'ALUGUEL',
      exitTypeOther: null,
      category: 'Despesas',
      branchId: 'branch-123',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    }
    mockApiResponse('get', '/finances/trans-1', mockTransaction)

    // Act
    renderWithProviders(<EditTransaction />, {
      initialEntries: ['/app/finances/trans-1/edit'],
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      const titleInput = document.getElementById('title') as HTMLInputElement
      expect(titleInput.value).toBe('Aluguel')
      
      const exitTypeSelect = document.getElementById('exitType') as HTMLSelectElement
      expect(exitTypeSelect).toBeInTheDocument()
      expect(exitTypeSelect.value).toBe('ALUGUEL')
    })
  })

  // ============================================================================
  // TESTE 3: PRIMARY INTERACTION - Atualiza transação com sucesso
  // ============================================================================
  it('deve atualizar transação com sucesso', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockUser = fixtures.user()
    const mockTransaction = {
      id: 'trans-1',
      title: 'Transação Original',
      amount: 500.0,
      type: 'ENTRY',
      entryType: 'OFERTA',
      category: 'Oferta',
      branchId: 'branch-123',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    }
    mockApiResponse('get', '/finances/trans-1', mockTransaction)
    mockApiResponse('put', '/finances/trans-1', { ...mockTransaction, title: 'Atualizada' })

    // Act
    renderWithProviders(<EditTransaction />, {
      initialEntries: ['/app/finances/trans-1/edit'],
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    await waitFor(() => {
      expect(document.getElementById('title')).toBeInTheDocument()
    })

    const titleInput = document.getElementById('title') as HTMLInputElement
    await user.clear(titleInput)
    await user.type(titleInput, 'Transação Atualizada')

    const submitButton = screen.getByText('Atualizar Transação')
    const form = submitButton.closest('form')
    if (form) {
      fireEvent.submit(form)
    } else {
      await user.click(submitButton)
    }

    // Assert
    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Transação atualizada com sucesso!')
      expect(mockNavigate).toHaveBeenCalledWith('/app/finances')
    })
  })

  // ============================================================================
  // TESTE 4: ERROR STATE - Exibe erro quando falha ao carregar transação
  // ============================================================================
  it('deve exibir erro quando falha ao carregar transação', async () => {
    // Arrange
    const mockUser = fixtures.user()
    mockApiError('get', '/finances/trans-1', { message: 'Transação não encontrada' })

    // Act
    renderWithProviders(<EditTransaction />, {
      initialEntries: ['/app/finances/trans-1/edit'],
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
  // TESTE 5: ERROR STATE - Exibe erro quando falha ao atualizar
  // ============================================================================
  it('deve exibir erro quando falha ao atualizar', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockUser = fixtures.user()
    const mockTransaction = {
      id: 'trans-1',
      title: 'Transação Original',
      amount: 500.0,
      type: 'ENTRY',
      entryType: 'OFERTA',
      branchId: 'branch-123',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    }
    mockApiResponse('get', '/finances/trans-1', mockTransaction)
    mockApiError('put', '/finances/trans-1', { message: 'Erro ao atualizar' })

    // Act
    renderWithProviders(<EditTransaction />, {
      initialEntries: ['/app/finances/trans-1/edit'],
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    await waitFor(() => {
      expect(document.getElementById('title')).toBeInTheDocument()
    })

    const submitButton = screen.getByText('Atualizar Transação')
    const form = submitButton.closest('form')
    if (form) {
      fireEvent.submit(form)
    }

    // Assert
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalled()
    })
  })

  // ============================================================================
  // TESTE 6: BASIC RENDER - Preenche campos de transação com tipo CONTRIBUICAO
  // ============================================================================
  it('deve preencher campos de transação com tipo CONTRIBUICAO', async () => {
    // Arrange
    const mockUser = fixtures.user()
    vi.mocked(api.get).mockImplementation((url) => {
      if (url === '/finances/trans-1') {
        return Promise.resolve({
          data: {
            id: 'trans-1',
            title: 'Transação de Contribuição',
            amount: 500.0,
            type: 'ENTRY',
            entryType: 'CONTRIBUICAO',
            contributionId: 'contrib-1',
            category: 'Contribuição',
            branchId: 'branch-123',
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-15T10:00:00Z',
          },
        })
      }
      if (url === '/contributions') {
        return Promise.resolve({
          data: [
            { id: 'contrib-1', title: 'Contribuição Teste', description: 'Descrição' },
          ],
        })
      }
      return Promise.reject(new Error('Not found'))
    })

    // Act
    renderWithProviders(<EditTransaction />, {
      initialEntries: ['/app/finances/trans-1/edit'],
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      const titleInput = document.getElementById('title') as HTMLInputElement
      expect(titleInput.value).toBe('Transação de Contribuição')
      
      const entryTypeSelect = document.getElementById('entryType') as HTMLSelectElement
      expect(entryTypeSelect.value).toBe('CONTRIBUICAO')
      
      const contributionSelect = document.getElementById('contributionId') as HTMLSelectElement
      expect(contributionSelect).toBeInTheDocument()
      expect(contributionSelect.value).toBe('contrib-1')
    })
  })
})

        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      const titleInput = document.getElementById('title') as HTMLInputElement
      expect(titleInput.value).toBe('Transação de Contribuição')
      
      const entryTypeSelect = document.getElementById('entryType') as HTMLSelectElement
      expect(entryTypeSelect.value).toBe('CONTRIBUICAO')
      
      const contributionSelect = document.getElementById('contributionId') as HTMLSelectElement
      expect(contributionSelect).toBeInTheDocument()
      expect(contributionSelect.value).toBe('contrib-1')
    })
  })
})
