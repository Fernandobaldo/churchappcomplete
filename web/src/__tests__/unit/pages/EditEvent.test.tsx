import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import EditEvent from '@/pages/Events/EditEvent'
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
const mockParams = { id: 'event-1' }
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
  }
})

describe('EditEvent Page', () => {
  beforeEach(() => {
    useAuthStore.setState({
      token: 'token',
      user: mockUser,
    })
    vi.clearAllMocks()
  })

  it('deve renderizar o formulário corretamente', async () => {
    const mockEvent = {
      id: 'event-1',
      title: 'Evento Original',
      description: 'Descrição original',
      location: 'Local original',
      startDate: '2024-12-31T10:00:00Z',
      endDate: '2024-12-31T12:00:00Z',
      hasDonation: false,
    }

    vi.mocked(api.get).mockResolvedValue({ data: mockEvent })

    render(
      <MemoryRouter>
        <EditEvent />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Editar Evento')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Evento Original')).toBeInTheDocument()
    })
  })

  it('deve carregar dados do evento', async () => {
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

    vi.mocked(api.get).mockResolvedValue({ data: mockEvent })

    render(
      <MemoryRouter>
        <EditEvent />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/events/event-1')
      expect(screen.getByDisplayValue('Evento Teste')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Local teste')).toBeInTheDocument()
    })
  })

  it('deve atualizar evento com sucesso', async () => {
    const toast = await import('react-hot-toast')
    const mockEvent = {
      id: 'event-1',
      title: 'Evento Original',
      description: 'Descrição original',
      location: 'Local original',
      startDate: '2024-12-31T10:00:00Z',
      endDate: '2024-12-31T12:00:00Z',
      hasDonation: false,
    }

    vi.mocked(api.get).mockResolvedValue({ data: mockEvent })
    vi.mocked(api.put).mockResolvedValue({ data: { ...mockEvent, title: 'Evento Atualizado' } })

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <EditEvent />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('Evento Original')).toBeInTheDocument()
    })

    const titleInput = screen.getByDisplayValue('Evento Original')
    await user.clear(titleInput)
    await user.type(titleInput, 'Evento Atualizado')

    const submitButton = screen.getByText('Salvar Alterações')
    await user.click(submitButton)

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/events/event-1', expect.objectContaining({
        title: 'Evento Atualizado',
      }))
    })

    await waitFor(() => {
      expect(toast.default.success).toHaveBeenCalledWith('Evento atualizado com sucesso!')
    })

    expect(mockNavigate).toHaveBeenCalledWith('/app/events/event-1')
  })

  it('deve exibir erro quando falha ao carregar evento', async () => {
    const toast = await import('react-hot-toast')
    vi.mocked(api.get).mockRejectedValue(new Error('Erro ao carregar'))

    render(
      <MemoryRouter>
        <EditEvent />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalledWith('Erro ao carregar evento')
      expect(mockNavigate).toHaveBeenCalledWith('/app/events')
    })
  })

  it('deve exibir erro quando falha ao atualizar evento', async () => {
    const toast = await import('react-hot-toast')
    const mockEvent = {
      id: 'event-1',
      title: 'Evento Original',
      location: 'Local original',
      startDate: '2024-12-31T10:00:00Z',
      endDate: '2024-12-31T12:00:00Z',
    }

    vi.mocked(api.get).mockResolvedValue({ data: mockEvent })
    vi.mocked(api.put).mockRejectedValue({
      response: {
        data: {
          message: 'Erro ao atualizar evento',
        },
      },
    })

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <EditEvent />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('Evento Original')).toBeInTheDocument()
    })

    const submitButton = screen.getByText('Salvar Alterações')
    await user.click(submitButton)

    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalledWith('Erro ao atualizar evento')
    })
  })

  it('deve navegar para detalhes ao clicar em Voltar', async () => {
    const mockEvent = {
      id: 'event-1',
      title: 'Evento Original',
      location: 'Local original',
      startDate: '2024-12-31T10:00:00Z',
      endDate: '2024-12-31T12:00:00Z',
    }

    vi.mocked(api.get).mockResolvedValue({ data: mockEvent })

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <EditEvent />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Voltar')).toBeInTheDocument()
    })

    const backButton = screen.getByText('Voltar')
    await user.click(backButton)

    expect(mockNavigate).toHaveBeenCalledWith('/app/events/event-1')
  })
})

