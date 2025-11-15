import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Events from '@/pages/Events'
import AddEvent from '@/pages/Events/AddEvent'
import api from '@/api/api'
import { useAuthStore } from '@/stores/authStore'
import { mockUser, mockEvents } from '@/test/mocks/mockData'

vi.mock('@/api/api')
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('Events CRUD Integration', () => {
  beforeEach(() => {
    useAuthStore.setState({
      token: 'token',
      user: mockUser,
    })
    vi.clearAllMocks()
  })

  describe('Listar Eventos', () => {
    it('deve carregar e exibir lista de eventos', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: mockEvents })

      render(
        <MemoryRouter>
          <Events />
        </MemoryRouter>
      )

      // Verifica loading
      expect(screen.getByText(/carregando eventos/i)).toBeInTheDocument()

      // Verifica eventos carregados
      await waitFor(() => {
        expect(screen.getByText('Culto de Domingo')).toBeInTheDocument()
        expect(screen.getByText('Reunião de Oração')).toBeInTheDocument()
      })

      expect(api.get).toHaveBeenCalledWith('/events')
    })

    it('deve exibir mensagem quando não há eventos', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: [] })

      render(
        <MemoryRouter>
          <Events />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.queryByText(/carregando eventos/i)).not.toBeInTheDocument()
      })
    })

    it('deve exibir erro quando falha ao carregar', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Erro na API'))

      render(
        <MemoryRouter>
          <Events />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(api.get).toHaveBeenCalled()
      })
    })
  })

  describe('Criar Evento', () => {
    it('deve criar evento com sucesso', async () => {
      const user = userEvent.setup()
      const mockEvent = {
        id: 'event-new',
        title: 'Novo Evento',
        description: 'Descrição',
        startDate: '2024-02-01T10:00:00Z',
        endDate: '2024-02-01T12:00:00Z',
        time: '10:00',
        location: 'Local',
        hasDonation: false,
      }

      vi.mocked(api.post).mockResolvedValue({ data: mockEvent })
      vi.mocked(api.get).mockResolvedValue({ data: [] })

      render(
        <MemoryRouter>
          <AddEvent />
        </MemoryRouter>
      )

      // Preenche formulário
      const titleInput = screen.getByLabelText(/título/i)
      const descriptionInput = screen.getByLabelText(/descrição/i)
      const dateInput = screen.getByLabelText(/data e hora/i)
      const locationInput = screen.getByLabelText(/local/i)

      await user.type(titleInput, 'Novo Evento')
      await user.type(descriptionInput, 'Descrição')
      // Preenche data no formato datetime-local (YYYY-MM-DDTHH:mm)
      await user.type(dateInput, '2024-02-01T10:00')
      await user.type(locationInput, 'Local')

      // Procura botão de submit
      const submitButton = screen.getByRole('button', { name: /criar evento/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(api.post).toHaveBeenCalled()
      })
    })
  })
})


