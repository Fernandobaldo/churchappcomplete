import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Events from '@/pages/Events/index'
import api from '@/api/api'
import { fixtures } from '@/test/fixtures'
import { renderWithProviders } from '@/test/helpers'
import { mockApiResponse, mockApiError } from '@/test/mockApi'

vi.mock('@/api/api', async () => {
  const { apiMock } = await import('@/test/apiMock')
  return { default: apiMock }
})
const { mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}))
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

describe('Events - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // TESTE 1: BASIC RENDER - Renderiza a página corretamente
  // ============================================================================
  it('deve renderizar a página corretamente', async () => {
    // Arrange
    const mockUser = fixtures.user()
    mockApiResponse('get', '/events', [])

    // Act
    renderWithProviders(<Events />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Eventos')).toBeInTheDocument()
      expect(screen.getByText('Gerencie os eventos da igreja')).toBeInTheDocument()
      expect(screen.getByText('Novo Evento')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // TESTE 2: EMPTY STATE - Exibe mensagem quando não há eventos
  // ============================================================================
  it('deve exibir mensagem quando não há eventos', async () => {
    // Arrange
    const mockUser = fixtures.user()
    mockApiResponse('get', '/events', [])

    // Act
    renderWithProviders(<Events />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Nenhum evento cadastrado')).toBeInTheDocument()
      expect(screen.getByText('Criar Primeiro Evento')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // TESTE 3: PRIMARY INTERACTION - Exibe lista de eventos
  // ============================================================================
  it('deve exibir lista de eventos', async () => {
    // Arrange
    const mockUser = fixtures.user()
    const mockEvents = [
      {
        id: 'event-1',
        title: 'Culto de Domingo',
        description: 'Culto matutino',
        startDate: '2024-01-15T10:00:00Z',
        endDate: '2024-01-15T12:00:00Z',
        location: 'Igreja Central',
        hasDonation: false,
      },
      {
        id: 'event-2',
        title: 'Reunião de Oração',
        description: 'Reunião semanal',
        startDate: '2024-01-20T19:00:00Z',
        endDate: '2024-01-20T21:00:00Z',
        location: 'Sala de Oração',
        hasDonation: true,
      },
    ]
    mockApiResponse('get', '/events', mockEvents)

    // Act
    renderWithProviders(<Events />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Culto de Domingo')).toBeInTheDocument()
      expect(screen.getByText('Reunião de Oração')).toBeInTheDocument()
      expect(screen.getByText('Igreja Central')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // TESTE 4: PRIMARY INTERACTION - Navega para criar evento
  // ============================================================================
  it('deve navegar para criar evento ao clicar em Novo Evento', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockUser = fixtures.user()
    mockApiResponse('get', '/events', [])

    // Act
    renderWithProviders(<Events />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    const newEventButton = await screen.findByText('Novo Evento')
    await user.click(newEventButton)

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('/app/events/new')
  })

  // ============================================================================
  // TESTE 5: PRIMARY INTERACTION - Navega para detalhes do evento
  // ============================================================================
  it('deve navegar para detalhes do evento ao clicar no card', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockUser = fixtures.user()
    const mockEvents = [
      {
        id: 'event-1',
        title: 'Culto de Domingo',
        description: 'Culto matutino',
        startDate: '2024-01-15T10:00:00Z',
        endDate: '2024-01-15T12:00:00Z',
        location: 'Igreja Central',
        hasDonation: false,
      },
    ]
    mockApiResponse('get', '/events', mockEvents)

    // Act
    renderWithProviders(<Events />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    await waitFor(() => {
      expect(screen.getByText('Culto de Domingo')).toBeInTheDocument()
    })

    const eventCard = screen.getByText('Culto de Domingo').closest('.card')
    if (eventCard) {
      await user.click(eventCard)
    }

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('/app/events/event-1')
  })

  // ============================================================================
  // TESTE 6: ERROR STATE - Exibe erro quando falha ao carregar eventos
  // ============================================================================
  it('deve exibir erro quando falha ao carregar eventos', async () => {
    // Arrange
    const mockUser = fixtures.user()
    mockApiError('get', '/events', { message: 'Erro ao carregar' })

    // Act
    renderWithProviders(<Events />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Erro ao carregar eventos')
    })
  })
})

