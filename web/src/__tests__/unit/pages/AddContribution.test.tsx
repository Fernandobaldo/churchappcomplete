import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AddContribution from '@/pages/Contributions/AddContribution'
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

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('AddContribution - Unit Tests', () => {
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
    renderWithProviders(<AddContribution />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    expect(screen.getByText('Nova Campanha de Contribuição')).toBeInTheDocument()
    expect(screen.getByTestId('title-input')).toBeInTheDocument()
    expect(screen.getByTestId('submit-button')).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 2: VALIDATION - Valida campos obrigatórios
  // ============================================================================
  it('deve validar campos obrigatórios', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockUser = fixtures.user()

    // Act
    renderWithProviders(<AddContribution />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    const submitButton = screen.getByText('Criar Campanha')
    await user.click(submitButton)

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Título é obrigatório')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // TESTE 3: PRIMARY INTERACTION - Cria campanha com sucesso
  // ============================================================================
  it('deve criar campanha com sucesso', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockUser = fixtures.user()
    const mockResponse = {
      id: 'contrib-1',
      title: 'Campanha de Construção',
      goal: 50000.0,
      endDate: '2024-12-31',
      isActive: true,
      PaymentMethods: [],
    }
    mockApiResponse('post', '/contributions', mockResponse)

    // Act
    renderWithProviders(<AddContribution />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    await waitFor(() => {
      expect(screen.getByTestId('title-input')).toBeInTheDocument()
    })

    await user.type(screen.getByTestId('title-input'), 'Campanha de Construção')

    const submitButton = screen.getByText('Criar Campanha')
    await user.click(submitButton)

    // Assert
    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Campanha criada com sucesso!')
    })

    expect(mockNavigate).toHaveBeenCalledWith('/app/contributions')
  })

  // ============================================================================
  // TESTE 4: ERROR STATE - Exibe erro quando falha ao criar campanha
  // ============================================================================
  it('deve exibir erro quando falha ao criar campanha', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockUser = fixtures.user()
    mockApiError('post', '/contributions', { message: 'Erro ao criar campanha' })

    // Act
    renderWithProviders(<AddContribution />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    await waitFor(() => {
      expect(screen.getByTestId('title-input')).toBeInTheDocument()
    })

    await user.type(screen.getByTestId('title-input'), 'Campanha de Construção')

    const submitButton = screen.getByText('Criar Campanha')
    await user.click(submitButton)

    // Assert
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalled()
    })
  })

  // ============================================================================
  // TESTE 5: PRIMARY INTERACTION - Navega para lista ao clicar em Voltar
  // ============================================================================
  it('deve navegar para lista ao clicar em Voltar', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockUser = fixtures.user()

    // Act
    renderWithProviders(<AddContribution />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    const backButton = screen.getByTestId('back-button')
    await user.click(backButton)

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('/app/contributions')
  })
})
