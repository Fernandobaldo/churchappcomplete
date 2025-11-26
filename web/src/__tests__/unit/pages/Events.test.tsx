import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import Events from '@/pages/Events/index'
import api from '@/api/api'
import { useAuthStore } from '@/stores/authStore'
import { mockUser } from '@/test/mocks/mockData'

vi.mock('@/api/api')
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
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

describe('Events Page', () => {
  beforeEach(() => {
    useAuthStore.setState({
      token: 'token',
      user: mockUser,
    })
    vi.clearAllMocks()
  })

  it('deve renderizar a página corretamente', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [],
    })

    render(
      <MemoryRouter>
        <Events />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Eventos')).toBeInTheDocument()
      expect(screen.getByText('Gerencie os eventos da igreja')).toBeInTheDocument()
      expect(screen.getByText('Novo Evento')).toBeInTheDocument()
    })
  })

  it('deve exibir mensagem quando não há eventos', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [],
    })

    render(
      <MemoryRouter>
        <Events />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Nenhum evento cadastrado')).toBeInTheDocument()
      expect(screen.getByText('Criar Primeiro Evento')).toBeInTheDocument()
    })
  })

  it('deve exibir lista de eventos', async () => {
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

    vi.mocked(api.get).mockResolvedValue({
      data: mockEvents,
    })

    render(
      <MemoryRouter>
        <Events />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Culto de Domingo')).toBeInTheDocument()
      expect(screen.getByText('Reunião de Oração')).toBeInTheDocument()
      expect(screen.getByText('Igreja Central')).toBeInTheDocument()
    })
  })

  it('deve navegar para criar evento ao clicar em Novo Evento', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [],
    })

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Events />
      </MemoryRouter>
    )

    const newEventButton = await screen.findByText('Novo Evento')
    await user.click(newEventButton)

    expect(mockNavigate).toHaveBeenCalledWith('/app/events/new')
  })

  it('deve navegar para detalhes do evento ao clicar no card', async () => {
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

    vi.mocked(api.get).mockResolvedValue({
      data: mockEvents,
    })

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Events />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Culto de Domingo')).toBeInTheDocument()
    })

    const eventCard = screen.getByText('Culto de Domingo').closest('.card')
    if (eventCard) {
      await user.click(eventCard)
      expect(mockNavigate).toHaveBeenCalledWith('/app/events/event-1')
    }
  })

  it('deve exibir erro quando falha ao carregar eventos', async () => {
    const toast = await import('react-hot-toast')
    vi.mocked(api.get).mockRejectedValue(new Error('Erro ao carregar'))

    render(
      <MemoryRouter>
        <Events />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalledWith('Erro ao carregar eventos')
    })
  })
})

