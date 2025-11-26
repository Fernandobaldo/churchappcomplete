import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import AddEvent from '@/pages/Events/AddEvent'
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

describe('AddEvent Page', () => {
  beforeEach(() => {
    useAuthStore.setState({
      token: 'token',
      user: mockUser,
    })
    vi.clearAllMocks()
  })

  it('deve renderizar o formulário corretamente', () => {
    render(
      <MemoryRouter>
        <AddEvent />
      </MemoryRouter>
    )

    expect(screen.getByText('Novo Evento')).toBeInTheDocument()
    expect(screen.getByTestId('title-input')).toBeInTheDocument()
    expect(screen.getByTestId('location-input')).toBeInTheDocument()
    expect(screen.getByTestId('submit-button')).toBeInTheDocument()
  })

  it('deve validar campos obrigatórios', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AddEvent />
      </MemoryRouter>
    )

    const submitButton = screen.getByText('Criar Evento')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Título é obrigatório')).toBeInTheDocument()
    })
  })

  it('deve criar evento com sucesso', async () => {
    const toast = await import('react-hot-toast')
    const mockResponse = {
      data: {
        id: 'event-1',
        title: 'Novo Evento',
        location: 'Local do Evento',
        startDate: '2024-12-31T10:00:00Z',
        endDate: '2024-12-31T12:00:00Z',
      },
    }

    vi.mocked(api.post).mockResolvedValue(mockResponse)

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AddEvent />
      </MemoryRouter>
    )

    await user.type(screen.getByTestId('title-input'), 'Novo Evento')
    await user.type(screen.getByTestId('location-input'), 'Local do Evento')
    
    // Preencher data
    const dateInput = screen.getByTestId('date-input')
    await user.type(dateInput, '2024-12-31T10:00')

    const submitButton = screen.getByTestId('submit-button')
    await user.click(submitButton)

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/events', expect.objectContaining({
        title: 'Novo Evento',
        location: 'Local do Evento',
      }))
    })

    await waitFor(() => {
      expect(toast.default.success).toHaveBeenCalledWith('Evento criado com sucesso!')
    })

    expect(mockNavigate).toHaveBeenCalledWith('/app/events')
  })

  it('deve exibir erro quando falha ao criar evento', async () => {
    const toast = await import('react-hot-toast')
    vi.mocked(api.post).mockRejectedValue({
      response: {
        data: {
          message: 'Erro ao criar evento',
        },
      },
    })

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AddEvent />
      </MemoryRouter>
    )

    await user.type(screen.getByLabelText(/título/i), 'Novo Evento')
    await user.type(screen.getByLabelText(/local/i), 'Local do Evento')
    
    const dateInput = screen.getByLabelText(/data e hora/i)
    await user.type(dateInput, '2024-12-31T10:00')

    const submitButton = screen.getByText('Criar Evento')
    await user.click(submitButton)

    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalledWith('Erro ao criar evento')
    })
  })

  it('deve navegar para lista ao clicar em Voltar', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AddEvent />
      </MemoryRouter>
    )

    const backButton = screen.getByTestId('back-button')
    await user.click(backButton)

    expect(mockNavigate).toHaveBeenCalledWith('/app/events')
  })

  it('deve navegar para lista ao clicar em Cancelar', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AddEvent />
      </MemoryRouter>
    )

    const cancelButton = screen.getByTestId('cancel-button')
    await user.click(cancelButton)

    expect(mockNavigate).toHaveBeenCalledWith('/app/events')
  })
})

