import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import Events from '@/pages/Events'
import Contributions from '@/pages/Contributions'
import Devotionals from '@/pages/Devotionals'
import Members from '@/pages/Members'
import { useAuthStore } from '@/stores/authStore'
import { mockUser } from '@/test/mocks/mockData'
import api from '@/api/api'

// Mock do useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock da API
vi.mock('@/api/api', () => ({
  default: {
    get: vi.fn(),
  },
}))

// Mock do toast
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
  },
}))

describe('Pages Cards Navigation', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: mockUser, token: 'token' })
    vi.clearAllMocks()
  })

  describe('Events Page', () => {
    it('deve navegar para /app/events/new ao clicar em "Novo Evento"', async () => {
      const user = userEvent.setup()
      ;(api.get as any).mockResolvedValue({ data: [] })

      render(
        <MemoryRouter>
          <Events />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Novo Evento')).toBeInTheDocument()
      })

      const newEventButton = screen.getByText('Novo Evento')
      await user.click(newEventButton)

      expect(mockNavigate).toHaveBeenCalledWith('/app/events/new')
    })

    it('deve navegar para /app/events/:id ao clicar em um card de evento', async () => {
      const user = userEvent.setup()
      const mockEvent = {
        id: 'event-123',
        title: 'Evento Teste',
        description: 'Descrição do evento',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        location: 'Localização',
        hasDonation: false,
      }
      ;(api.get as any).mockResolvedValue({ data: [mockEvent] })

      render(
        <MemoryRouter>
          <Events />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Evento Teste')).toBeInTheDocument()
      })

      const eventCard = screen.getByText('Evento Teste').closest('.card')
      if (eventCard) {
        await user.click(eventCard)
        expect(mockNavigate).toHaveBeenCalledWith('/app/events/event-123')
      }
    })
  })

  describe('Contributions Page', () => {
    it('deve navegar para /app/contributions/new ao clicar em "Nova Contribuição"', async () => {
      const user = userEvent.setup()
      ;(api.get as any).mockResolvedValue({ data: [] })

      render(
        <MemoryRouter>
          <Contributions />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Nova Contribuição')).toBeInTheDocument()
      })

      const newContributionButton = screen.getByText('Nova Contribuição')
      await user.click(newContributionButton)

      expect(mockNavigate).toHaveBeenCalledWith('/app/contributions/new')
    })

    it('deve navegar para /app/contributions/:id ao clicar em "Ver Detalhes"', async () => {
      const user = userEvent.setup()
      const mockContribution = {
        id: 'contribution-123',
        title: 'Contribuição Teste',
        description: 'Descrição',
        value: 100,
        date: new Date().toISOString(),
        type: 'OFERTA' as const,
      }
      ;(api.get as any).mockResolvedValue({ data: [mockContribution] })

      render(
        <MemoryRouter>
          <Contributions />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Ver Detalhes')).toBeInTheDocument()
      })

      const viewDetailsButton = screen.getByText('Ver Detalhes')
      await user.click(viewDetailsButton)

      expect(mockNavigate).toHaveBeenCalledWith('/app/contributions/contribution-123')
    })
  })

  describe('Devotionals Page', () => {
    it('deve navegar para /app/devotionals/new ao clicar em "Novo Devocional"', async () => {
      const user = userEvent.setup()
      ;(api.get as any).mockResolvedValue({ data: [] })

      render(
        <MemoryRouter>
          <Devotionals />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Novo Devocional')).toBeInTheDocument()
      })

      const newDevotionalButton = screen.getByText('Novo Devocional')
      await user.click(newDevotionalButton)

      expect(mockNavigate).toHaveBeenCalledWith('/app/devotionals/new')
    })

    it('deve navegar para /app/devotionals/:id ao clicar em um card de devocional', async () => {
      const user = userEvent.setup()
      const mockDevotional = {
        id: 'devotional-123',
        title: 'Devocional Teste',
        content: 'Conteúdo',
        passage: 'João 3:16',
        author: { id: 'author-1', name: 'Autor' },
        likes: 0,
        createdAt: new Date().toISOString(),
      }
      ;(api.get as any).mockResolvedValue({ data: [mockDevotional] })

      render(
        <MemoryRouter>
          <Devotionals />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Devocional Teste')).toBeInTheDocument()
      })

      const devotionalCard = screen.getByText('Devocional Teste').closest('div')
      await user.click(devotionalCard!)

      expect(mockNavigate).toHaveBeenCalledWith('/app/devotionals/devotional-123')
    })
  })

  describe('Members Page', () => {
    it('deve navegar para /app/members/new ao clicar em "Novo Membro"', async () => {
      const user = userEvent.setup()
      ;(api.get as any).mockResolvedValue({ data: [] })

      render(
        <MemoryRouter>
          <Members />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Novo Membro')).toBeInTheDocument()
      })

      const newMemberButton = screen.getByText('Novo Membro')
      await user.click(newMemberButton)

      expect(mockNavigate).toHaveBeenCalledWith('/app/members/new')
    })

    it('deve navegar para /app/members/:id ao clicar em um card de membro', async () => {
      const user = userEvent.setup()
      const mockMember = {
        id: 'member-123',
        name: 'Membro Teste',
        email: 'membro@test.com',
        role: 'MEMBER',
      }
      ;(api.get as any).mockResolvedValue({ data: [mockMember] })

      render(
        <MemoryRouter>
          <Members />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Membro Teste')).toBeInTheDocument()
      })

      const memberCard = screen.getByText('Membro Teste').closest('div')
      await user.click(memberCard!)

      expect(mockNavigate).toHaveBeenCalledWith('/app/members/member-123')
    })
  })
})


