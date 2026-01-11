import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AddDevotional from '@/pages/Devotionals/AddDevotional'
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

describe('AddDevotional - Unit Tests', () => {
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
    renderWithProviders(<AddDevotional />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    expect(screen.getByText('Novo Devocional')).toBeInTheDocument()
    expect(screen.getByTestId('title-input')).toBeInTheDocument()
    expect(screen.getByTestId('passage-input')).toBeInTheDocument()
    expect(screen.getByTestId('content-input')).toBeInTheDocument()
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
    renderWithProviders(<AddDevotional />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    const submitButton = screen.getByTestId('submit-button')
    await user.click(submitButton)

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Título é obrigatório')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // TESTE 3: PRIMARY INTERACTION - Cria devocional com sucesso
  // ============================================================================
  it('deve criar devocional com sucesso', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockUser = fixtures.user()
    const mockResponse = {
      id: 'devotional-1',
      title: 'Novo Devocional',
      passage: 'João 3:16',
      content: 'Conteúdo do devocional',
    }
    mockApiResponse('post', '/devotionals', mockResponse)

    // Act
    renderWithProviders(<AddDevotional />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    await user.type(screen.getByTestId('title-input'), 'Novo Devocional')
    await user.type(screen.getByTestId('passage-input'), 'João 3:16')
    await user.type(screen.getByTestId('content-input'), 'Conteúdo do devocional')

    const submitButton = screen.getByText('Criar Devocional')
    await user.click(submitButton)

    // Assert
    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Devocional criado com sucesso!')
    })

    expect(mockNavigate).toHaveBeenCalledWith('/app/devotionals')
  })

  // ============================================================================
  // TESTE 4: ERROR STATE - Exibe erro quando falha ao criar devocional
  // ============================================================================
  it('deve exibir erro quando falha ao criar devocional', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockUser = fixtures.user()
    mockApiError('post', '/devotionals', { message: 'Erro ao criar devocional' })

    // Act
    renderWithProviders(<AddDevotional />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    await user.type(screen.getByTestId('title-input'), 'Novo Devocional')
    await user.type(screen.getByTestId('passage-input'), 'João 3:16')
    await user.type(screen.getByTestId('content-input'), 'Conteúdo do devocional')

    const submitButton = screen.getByText('Criar Devocional')
    await user.click(submitButton)

    // Assert
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalled()
    })
  })

  // ============================================================================
  // TESTE 5: LOADING STATE - Exibe loading durante criação
  // ============================================================================
  it('deve exibir loading durante criação', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockUser = fixtures.user()
    // Mock que nunca resolve para simular loading
    mockApiResponse('post', '/devotionals', new Promise(() => {}))

    // Act
    renderWithProviders(<AddDevotional />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    await user.type(screen.getByTestId('title-input'), 'Novo Devocional')
    await user.type(screen.getByTestId('passage-input'), 'João 3:16')
    await user.type(screen.getByTestId('content-input'), 'Conteúdo do devocional')

    const submitButton = screen.getByText('Criar Devocional')
    await user.click(submitButton)

    // Assert
    await waitFor(() => {
      // Botão deve estar desabilitado durante loading
      expect(submitButton).toBeDisabled()
    })
  })
})

    await user.type(screen.getByTestId('content-input'), 'Conteúdo do devocional')

    const submitButton = screen.getByText('Criar Devocional')
    await user.click(submitButton)

    // Assert
    await waitFor(() => {
      // Botão deve estar desabilitado durante loading
      expect(submitButton).toBeDisabled()
    })
  })
})
