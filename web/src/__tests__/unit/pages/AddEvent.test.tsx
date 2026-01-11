import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AddEvent from '@/pages/Events/AddEvent'
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

describe('AddEvent - Unit Tests', () => {
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
    renderWithProviders(<AddEvent />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    expect(screen.getByText('Novo Evento')).toBeInTheDocument()
    expect(screen.getByTestId('title-input')).toBeInTheDocument()
    expect(screen.getByTestId('location-input')).toBeInTheDocument()
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
    renderWithProviders(<AddEvent />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    const submitButton = screen.getByText('Criar Evento')
    await user.click(submitButton)

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Título é obrigatório')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // TESTE 3: PRIMARY INTERACTION - Cria evento com sucesso
  // ============================================================================
  it('deve criar evento com sucesso', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockUser = fixtures.user()
    const mockResponse = {
      id: 'event-1',
      title: 'Novo Evento',
      location: 'Local do Evento',
      startDate: '2024-12-31T10:00:00Z',
      endDate: '2024-12-31T12:00:00Z',
    }
    mockApiResponse('post', '/events', mockResponse)

    // Act
    renderWithProviders(<AddEvent />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    await user.type(screen.getByTestId('title-input'), 'Novo Evento')
    await user.type(screen.getByTestId('location-input'), 'Local do Evento')
    
    const dateInput = screen.getByTestId('date-input')
    await user.type(dateInput, '2024-12-31T10:00')

    const submitButton = screen.getByTestId('submit-button')
    await user.click(submitButton)

    // Assert
    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Evento criado com sucesso!')
    })

    expect(mockNavigate).toHaveBeenCalledWith('/app/events')
  })

  // ============================================================================
  // TESTE 4: ERROR STATE - Exibe erro quando falha ao criar evento
  // ============================================================================
  it('deve exibir erro quando falha ao criar evento', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockUser = fixtures.user()
    mockApiError('post', '/events', { message: 'Erro ao criar evento' })

    // Act
    renderWithProviders(<AddEvent />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    await user.type(screen.getByLabelText(/título/i), 'Novo Evento')
    await user.type(screen.getByLabelText(/local/i), 'Local do Evento')
    
    const dateInput = screen.getByLabelText(/data e hora/i)
    await user.type(dateInput, '2024-12-31T10:00')

    const submitButton = screen.getByText('Criar Evento')
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
    renderWithProviders(<AddEvent />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    const backButton = screen.getByTestId('back-button')
    await user.click(backButton)

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('/app/events')
  })
})


    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('/app/events')
  })
})
