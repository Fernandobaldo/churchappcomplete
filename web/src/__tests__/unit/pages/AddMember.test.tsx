import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AddMember from '@/pages/Members/AddMember'
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

describe('AddMember - Unit Tests', () => {
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
    renderWithProviders(<AddMember />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    expect(screen.getByText('Novo Membro')).toBeInTheDocument()
    expect(screen.getByTestId('name-input')).toBeInTheDocument()
    expect(screen.getByTestId('email-input')).toBeInTheDocument()
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
    renderWithProviders(<AddMember />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    const submitButton = screen.getByText('Criar Membro')
    await user.click(submitButton)

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Nome é obrigatório')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // TESTE 3: PRIMARY INTERACTION - Cria membro com sucesso
  // ============================================================================
  it('deve criar membro com sucesso', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockUser = fixtures.user()
    const mockResponse = {
      id: 'member-1',
      name: 'Novo Membro',
      email: 'novo@example.com',
      role: 'MEMBER',
    }
    mockApiResponse('post', '/register', mockResponse)

    // Act
    renderWithProviders(<AddMember />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    await user.type(screen.getByTestId('name-input'), 'Novo Membro')
    await user.type(screen.getByTestId('email-input'), 'novo@example.com')
    
    const passwordInput = screen.getByTestId('password-input')
    await user.type(passwordInput, 'password123')

    const submitButton = screen.getByText('Criar Membro')
    await user.click(submitButton)

    // Assert
    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Membro criado com sucesso!')
    })

    expect(mockNavigate).toHaveBeenCalledWith('/app/members')
  })

  // ============================================================================
  // TESTE 4: ERROR STATE - Exibe erro quando falha ao criar membro
  // ============================================================================
  it('deve exibir erro quando falha ao criar membro', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockUser = fixtures.user()
    mockApiError('post', '/register', { message: 'Erro ao criar membro' })

    // Act
    renderWithProviders(<AddMember />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    await user.type(screen.getByTestId('name-input'), 'Novo Membro')
    await user.type(screen.getByTestId('email-input'), 'novo@example.com')
    
    const passwordInput = screen.getByTestId('password-input')
    await user.type(passwordInput, 'password123')

    const submitButton = screen.getByText('Criar Membro')
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
    renderWithProviders(<AddMember />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    const backButton = screen.getByTestId('back-button')
    await user.click(backButton)

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('/app/members')
  })
})


    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('/app/members')
  })
})
