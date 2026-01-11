import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EditEvent from '@/pages/Events/EditEvent'
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
const mockParams = { id: 'event-1' }
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
  }
})

describe('EditEvent - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // TESTE 1: BASIC RENDER - Renderiza o formulário corretamente
  // ============================================================================
  it('deve renderizar o formulário corretamente', async () => {
    // Arrange
    const mockUser = fixtures.user()
    const mockEvent = {
      id: 'event-1',
      title: 'Evento Original',
      description: 'Descrição original',
      location: 'Local original',
      startDate: '2024-12-31T10:00:00Z',
      endDate: '2024-12-31T12:00:00Z',
      hasDonation: false,
    }
    mockApiResponse('get', '/events/event-1', mockEvent)

    // Act
    renderWithProviders(<EditEvent />, {
      initialEntries: ['/app/events/event-1/edit'],
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Editar Evento')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Evento Original')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // TESTE 2: LOADING STATE - Carrega dados do evento
  // ============================================================================
  it('deve carregar dados do evento', async () => {
    // Arrange
    const mockUser = fixtures.user()
    const mockEvent = {
      id: 'event-1',
      title: 'Evento Teste',
      description: 'Descrição teste',
      location: 'Local teste',
      startDate: '2024-12-31T10:00:00Z',
      endDate: '2024-12-31T12:00:00Z',
      hasDonation: true,
      donationReason: 'Construção',
      donationLink: 'https://example.com',
      imageUrl: 'https://example.com/image.jpg',
    }
    mockApiResponse('get', '/events/event-1', mockEvent)

    // Act
    renderWithProviders(<EditEvent />, {
      initialEntries: ['/app/events/event-1/edit'],
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      expect(screen.getByDisplayValue('Evento Teste')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Local teste')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // TESTE 3: PRIMARY INTERACTION - Atualiza evento com sucesso
  // ============================================================================
  it('deve atualizar evento com sucesso', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockUser = fixtures.user()
    const mockEvent = {
      id: 'event-1',
      title: 'Evento Original',
      description: 'Descrição original',
      location: 'Local original',
      startDate: '2024-12-31T10:00:00Z',
      endDate: '2024-12-31T12:00:00Z',
      hasDonation: false,
    }
    mockApiResponse('get', '/events/event-1', mockEvent)
    mockApiResponse('put', '/events/event-1', { ...mockEvent, title: 'Evento Atualizado' })

    // Act
    renderWithProviders(<EditEvent />, {
      initialEntries: ['/app/events/event-1/edit'],
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    await waitFor(() => {
      expect(screen.getByDisplayValue('Evento Original')).toBeInTheDocument()
    })

    const titleInput = screen.getByDisplayValue('Evento Original')
    await user.clear(titleInput)
    await user.type(titleInput, 'Evento Atualizado')

    const submitButton = screen.getByText('Salvar Alterações')
    await user.click(submitButton)

    // Assert
    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Evento atualizado com sucesso!')
    })

    expect(mockNavigate).toHaveBeenCalledWith('/app/events/event-1')
  })

  // ============================================================================
  // TESTE 4: ERROR STATE - Exibe erro quando falha ao carregar evento
  // ============================================================================
  it('deve exibir erro quando falha ao carregar evento', async () => {
    // Arrange
    const mockUser = fixtures.user()
    mockApiError('get', '/events/event-1', { message: 'Erro ao carregar' })

    // Act
    renderWithProviders(<EditEvent />, {
      initialEntries: ['/app/events/event-1/edit'],
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Erro ao carregar evento')
      expect(mockNavigate).toHaveBeenCalledWith('/app/events')
    })
  })

  // ============================================================================
  // TESTE 5: ERROR STATE - Exibe erro quando falha ao atualizar evento
  // ============================================================================
  it('deve exibir erro quando falha ao atualizar evento', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockUser = fixtures.user()
    const mockEvent = {
      id: 'event-1',
      title: 'Evento Original',
      location: 'Local original',
      startDate: '2024-12-31T10:00:00Z',
      endDate: '2024-12-31T12:00:00Z',
    }
    mockApiResponse('get', '/events/event-1', mockEvent)
    mockApiError('put', '/events/event-1', { message: 'Erro ao atualizar evento' })

    // Act
    renderWithProviders(<EditEvent />, {
      initialEntries: ['/app/events/event-1/edit'],
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    await waitFor(() => {
      expect(screen.getByDisplayValue('Evento Original')).toBeInTheDocument()
    })

    const submitButton = screen.getByText('Salvar Alterações')
    await user.click(submitButton)

    // Assert
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalled()
    })
  })

  // ============================================================================
  // TESTE 6: PRIMARY INTERACTION - Navega para detalhes ao clicar em Voltar
  // ============================================================================
  it('deve navegar para detalhes ao clicar em Voltar', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockUser = fixtures.user()
    const mockEvent = {
      id: 'event-1',
      title: 'Evento Original',
      location: 'Local original',
      startDate: '2024-12-31T10:00:00Z',
      endDate: '2024-12-31T12:00:00Z',
    }
    mockApiResponse('get', '/events/event-1', mockEvent)

    // Act
    renderWithProviders(<EditEvent />, {
      initialEntries: ['/app/events/event-1/edit'],
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
    expect(mockNavigate).toHaveBeenCalledWith('/app/events/event-1')
  })
})

      id: 'event-1',
      title: 'Evento Original',
      location: 'Local original',
      startDate: '2024-12-31T10:00:00Z',
      endDate: '2024-12-31T12:00:00Z',
    }
    mockApiResponse('get', '/events/event-1', mockEvent)

    // Act
    renderWithProviders(<EditEvent />, {
      initialEntries: ['/app/events/event-1/edit'],
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
    expect(mockNavigate).toHaveBeenCalledWith('/app/events/event-1')
  })
})
