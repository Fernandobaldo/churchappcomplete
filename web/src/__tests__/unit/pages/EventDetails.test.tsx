import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import EventDetails from '@/pages/Events/EventDetails'
import api from '@/api/api'
import { useAuthStore } from '@/stores/authStore'
import { mockUser } from '@/test/mocks/mockData'

vi.mock('@/api/api')
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
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

describe('EventDetails Page', () => {
  beforeEach(() => {
    useAuthStore.setState({
      token: 'token',
      user: mockUser,
    })
    vi.clearAllMocks()
  })

  it('deve renderizar detalhes do evento', async () => {
    const mockEvent = {
      id: 'event-1',
      title: 'Culto de Domingo',
      description: 'Culto matutino',
      location: 'Igreja Central',
      startDate: '2024-12-31T10:00:00Z',
      endDate: '2024-12-31T12:00:00Z',
      hasDonation: false,
    }

    vi.mocked(api.get).mockResolvedValue({ data: mockEvent })

    render(
      <MemoryRouter>
        <EventDetails />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Culto de Domingo')).toBeInTheDocument()
      expect(screen.getByText('Culto matutino')).toBeInTheDocument()
      expect(screen.getByText('Igreja Central')).toBeInTheDocument()
    })
  })

  it('deve exibir informações de doação quando hasDonation é true', async () => {
    const mockEvent = {
      id: 'event-1',
      title: 'Evento com Doação',
      description: 'Descrição',
      location: 'Local',
      startDate: '2024-12-31T10:00:00Z',
      endDate: '2024-12-31T12:00:00Z',
      hasDonation: true,
      donationReason: 'Construção do templo',
      donationLink: 'https://example.com/doacao',
    }

    vi.mocked(api.get).mockResolvedValue({ data: mockEvent })

    render(
      <MemoryRouter>
        <EventDetails />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Doações')).toBeInTheDocument()
      expect(screen.getByText('Construção do templo')).toBeInTheDocument()
      expect(screen.getByText('https://example.com/doacao')).toBeInTheDocument()
    })
  })

  it('deve exibir botões de editar e excluir para usuário com permissão', async () => {
    const adminUser = {
      ...mockUser,
      role: 'ADMINGERAL',
      permissions: [{ type: 'MANAGE_EVENTS' }],
    }

    useAuthStore.setState({ user: adminUser })

    const mockEvent = {
      id: 'event-1',
      title: 'Evento Teste',
      location: 'Local',
      startDate: '2024-12-31T10:00:00Z',
      endDate: '2024-12-31T12:00:00Z',
      hasDonation: false,
    }

    vi.mocked(api.get).mockResolvedValue({ data: mockEvent })

    render(
      <MemoryRouter>
        <EventDetails />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Editar')).toBeInTheDocument()
      expect(screen.getByText('Excluir')).toBeInTheDocument()
    })
  })

  it('deve deletar evento com confirmação', async () => {
    const toast = await import('react-hot-toast')
    const adminUser = {
      ...mockUser,
      role: 'ADMINGERAL',
      permissions: [{ type: 'MANAGE_EVENTS' }],
    }

    useAuthStore.setState({ user: adminUser })

    const mockEvent = {
      id: 'event-1',
      title: 'Evento para Deletar',
      location: 'Local',
      startDate: '2024-12-31T10:00:00Z',
      endDate: '2024-12-31T12:00:00Z',
      hasDonation: false,
    }

    vi.mocked(api.get).mockResolvedValue({ data: mockEvent })
    vi.mocked(api.delete).mockResolvedValue({})

    // Mock window.confirm
    window.confirm = vi.fn(() => true)

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <EventDetails />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Excluir')).toBeInTheDocument()
    })

    const deleteButton = screen.getByText('Excluir')
    await user.click(deleteButton)

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/events/event-1')
      expect(toast.default.success).toHaveBeenCalledWith('Evento excluído com sucesso!')
      expect(mockNavigate).toHaveBeenCalledWith('/app/events')
    })
  })

  it('deve navegar para editar ao clicar em Editar', async () => {
    const adminUser = {
      ...mockUser,
      role: 'ADMINGERAL',
      permissions: [{ type: 'MANAGE_EVENTS' }],
    }

    useAuthStore.setState({ user: adminUser })

    const mockEvent = {
      id: 'event-1',
      title: 'Evento Teste',
      location: 'Local',
      startDate: '2024-12-31T10:00:00Z',
      endDate: '2024-12-31T12:00:00Z',
      hasDonation: false,
    }

    vi.mocked(api.get).mockResolvedValue({ data: mockEvent })

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <EventDetails />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Editar')).toBeInTheDocument()
    })

    const editButton = screen.getByText('Editar')
    await user.click(editButton)

    expect(mockNavigate).toHaveBeenCalledWith('/app/events/event-1/edit')
  })

  it('deve exibir erro quando falha ao carregar evento', async () => {
    const toast = await import('react-hot-toast')
    vi.mocked(api.get).mockRejectedValue(new Error('Erro ao carregar'))

    render(
      <MemoryRouter>
        <EventDetails />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalledWith('Erro ao carregar evento')
      expect(mockNavigate).toHaveBeenCalledWith('/app/events')
    })
  })

  it('deve navegar para lista ao clicar em Voltar', async () => {
    const mockEvent = {
      id: 'event-1',
      title: 'Evento Teste',
      location: 'Local',
      startDate: '2024-12-31T10:00:00Z',
      endDate: '2024-12-31T12:00:00Z',
      hasDonation: false,
    }

    vi.mocked(api.get).mockResolvedValue({ data: mockEvent })

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <EventDetails />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Voltar')).toBeInTheDocument()
    })

    const backButton = screen.getByText('Voltar')
    await user.click(backButton)

    expect(mockNavigate).toHaveBeenCalledWith('/app/events')
  })
})

