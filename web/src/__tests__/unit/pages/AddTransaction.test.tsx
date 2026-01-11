import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AddTransaction from '@/pages/Finances/AddTransaction'
import { fixtures } from '@/test/fixtures'
import { renderWithProviders } from '@/test/helpers'
import { mockApiResponse, mockApiError } from '@/test/mockApi'

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
  }
})

describe('AddTransaction - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // TESTE 1: BASIC RENDER - Renderiza o formulário corretamente
  // ============================================================================
  it('deve renderizar o formulário corretamente', () => {
    // Arrange
    const mockUser = fixtures.user()

    // Act
    renderWithProviders(<AddTransaction />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    expect(screen.getByText('Nova Transação')).toBeInTheDocument()
    expect(document.getElementById('type')).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 2: VALIDATION - Valida campos obrigatórios
  // ============================================================================
  it('deve validar campos obrigatórios', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockUser = fixtures.user()

    // Act
    renderWithProviders(<AddTransaction />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    const submitButton = document.getElementById('submit-button') || screen.getByText('Salvar Transação')
    await user.click(submitButton)

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/valor é obrigatório/i)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // TESTE 3: PRIMARY INTERACTION - Cria transação de entrada (Oferta) com sucesso
  // ============================================================================
  it('deve criar transação de entrada (Oferta) com sucesso', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockUser = fixtures.user()
    const mockResponse = {
      id: 'trans-1',
      amount: 500.0,
      type: 'ENTRY',
      entryType: 'OFERTA',
    }
    mockApiResponse('post', '/finances', mockResponse)

    // Act
    renderWithProviders(<AddTransaction />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    const typeSelect = document.getElementById('type') as HTMLSelectElement
    await user.selectOptions(typeSelect, 'ENTRY')

    await waitFor(() => {
      expect(document.getElementById('entryType')).toBeInTheDocument()
    })

    const entryTypeSelect = document.getElementById('entryType') as HTMLSelectElement
    await user.selectOptions(entryTypeSelect, 'OFERTA')

    await waitFor(() => {
      expect(document.getElementById('amount')).toBeInTheDocument()
    })

    const amountInput = document.getElementById('amount') as HTMLInputElement
    await user.clear(amountInput)
    fireEvent.change(amountInput, { target: { value: '500' } })

    const submitButton = document.getElementById('submit-button') || screen.getByText('Salvar Transação')
    const form = submitButton.closest('form')
    if (form) {
      fireEvent.submit(form)
    } else {
      await user.click(submitButton)
    }

    // Assert
    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Transação adicionada com sucesso!')
    })

    expect(mockNavigate).toHaveBeenCalledWith('/app/finances')
  })

  // ============================================================================
  // TESTE 4: PRIMARY INTERACTION - Cria transação de saída com sucesso
  // ============================================================================
  it('deve criar transação de saída com sucesso', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockUser = fixtures.user()
    const mockResponse = {
      id: 'trans-1',
      amount: 300.0,
      type: 'EXIT',
      exitType: 'ALUGUEL',
    }
    mockApiResponse('post', '/finances', mockResponse)

    // Act
    renderWithProviders(<AddTransaction />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    const typeSelect = document.getElementById('type') as HTMLSelectElement
    await user.selectOptions(typeSelect, 'EXIT')

    await waitFor(() => {
      const exitTypeSelect = document.getElementById('exitType')
      expect(exitTypeSelect).toBeInTheDocument()
    })

    const exitTypeSelect = document.getElementById('exitType') as HTMLSelectElement
    await user.selectOptions(exitTypeSelect, 'ALUGUEL')

    await waitFor(() => {
      expect(document.getElementById('amount')).toBeInTheDocument()
    })

    const amountInput = document.getElementById('amount') as HTMLInputElement
    await user.clear(amountInput)
    fireEvent.change(amountInput, { target: { value: '300' } })

    const submitButton = document.getElementById('submit-button') || screen.getByText('Salvar Transação')
    const form = submitButton.closest('form')
    if (form) {
      fireEvent.submit(form)
    } else {
      await user.click(submitButton)
    }

    // Assert
    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Transação adicionada com sucesso!')
    })
  })

  // ============================================================================
  // TESTE 5: ERROR STATE - Exibe erro quando falha ao criar transação
  // ============================================================================
  it('deve exibir erro quando falha ao criar transação', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockUser = fixtures.user()
    mockApiError('post', '/finances', { message: 'Erro ao criar transação' })

    // Act
    renderWithProviders(<AddTransaction />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    const typeSelect = document.getElementById('type') as HTMLSelectElement
    await user.selectOptions(typeSelect, 'ENTRY')

    await waitFor(() => {
      const entryTypeSelect = document.getElementById('entryType')
      return entryTypeSelect
    })
    const entryTypeSelect = document.getElementById('entryType') as HTMLSelectElement
    await user.selectOptions(entryTypeSelect, 'OFERTA')

    await waitFor(() => {
      expect(document.getElementById('amount')).toBeInTheDocument()
    })
    const amountInput = document.getElementById('amount') as HTMLInputElement
    await user.clear(amountInput)
    fireEvent.change(amountInput, { target: { value: '100' } })

    const submitButton = document.getElementById('submit-button') || screen.getByText('Salvar Transação')
    const form = submitButton.closest('form')
    if (form) {
      fireEvent.submit(form)
    } else {
      await user.click(submitButton)
    }

    // Assert
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalled()
    })
  })

  // ============================================================================
  // TESTE 6: PRIMARY INTERACTION - Navega para lista ao clicar em Voltar
  // ============================================================================
  it('deve navegar para lista ao clicar em Voltar', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockUser = fixtures.user()

    // Act
    renderWithProviders(<AddTransaction />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    const backButton = document.getElementById('back-button') || screen.getByText('Voltar')
    await user.click(backButton)

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('/app/finances')
  })
})
