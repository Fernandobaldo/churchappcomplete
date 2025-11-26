import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import Dashboard from '@/pages/Dashboard'
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

describe('Dashboard Cards Navigation', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: mockUser, token: 'token' })
    vi.clearAllMocks()
    ;(api.get as any).mockResolvedValue({ data: null })
  })

  it('deve navegar para /app/events ao clicar no card de Eventos', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    await screen.findByText('Eventos')
    const eventsCard = screen.getByText('Eventos').closest('button')
    await user.click(eventsCard!)

    expect(mockNavigate).toHaveBeenCalledWith('/app/events')
  })

  it('deve navegar para /app/contributions ao clicar no card de Contribuições', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    await screen.findByText('Contribuições')
    const contributionsCard = screen.getByText('Contribuições').closest('button')
    await user.click(contributionsCard!)

    expect(mockNavigate).toHaveBeenCalledWith('/app/contributions')
  })

  it('deve navegar para /app/devotionals ao clicar no card de Devocionais', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    await screen.findByText('Devocionais')
    const devotionalsCard = screen.getByText('Devocionais').closest('button')
    await user.click(devotionalsCard!)

    expect(mockNavigate).toHaveBeenCalledWith('/app/devotionals')
  })

  it('deve navegar para /app/members ao clicar no card de Membros', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    await screen.findByText('Membros')
    const membersCard = screen.getByText('Membros').closest('button')
    await user.click(membersCard!)

    expect(mockNavigate).toHaveBeenCalledWith('/app/members')
  })

  it('deve navegar para /app/events/new ao clicar em "Criar Novo Evento"', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    await screen.findByText('Criar Novo Evento')
    const createEventButton = screen.getByText('Criar Novo Evento')
    await user.click(createEventButton)

    expect(mockNavigate).toHaveBeenCalledWith('/app/events/new')
  })

  it('deve navegar para /app/contributions/new ao clicar em "Adicionar Contribuição"', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    await screen.findByText('Adicionar Contribuição')
    const addContributionButton = screen.getByText('Adicionar Contribuição')
    await user.click(addContributionButton)

    expect(mockNavigate).toHaveBeenCalledWith('/app/contributions/new')
  })

  it('deve navegar para /app/devotionals/new ao clicar em "Criar Devocional"', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    await screen.findByText('Criar Devocional')
    const createDevotionalButton = screen.getByText('Criar Devocional')
    await user.click(createDevotionalButton)

    expect(mockNavigate).toHaveBeenCalledWith('/app/devotionals/new')
  })
})


