import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import Contributions from '@/pages/Contributions/index'
import api from '@/api/api'
import { useAuthStore } from '@/stores/authStore'
import { mockUser } from '@/test/mocks/mockData'

vi.mock('@/api/api')
vi.mock('react-hot-toast', () => ({
  default: {
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

describe('Contributions Page', () => {
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
        <Contributions />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Contribuições')).toBeInTheDocument()
      expect(screen.getByText('Nova Contribuição')).toBeInTheDocument()
    })
  })

  it('deve exibir lista de contribuições', async () => {
    const mockContributions = [
      {
        id: 'contrib-1',
        title: 'Campanha de Construção',
        description: 'Campanha para construção',
        goal: 50000.0,
        endDate: '2024-12-31',
        raised: 25000.0,
        isActive: true,
        PaymentMethods: [],
      },
      {
        id: 'contrib-2',
        title: 'Campanha de Missões',
        description: 'Campanha para missões',
        goal: 10000.0,
        endDate: '2024-06-30',
        raised: 5000.0,
        isActive: true,
        PaymentMethods: [],
      },
    ]

    vi.mocked(api.get).mockResolvedValue({
      data: mockContributions,
    })

    render(
      <MemoryRouter>
        <Contributions />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Campanha de Construção')).toBeInTheDocument()
      expect(screen.getByText('Campanha de Missões')).toBeInTheDocument()
    })
  })

  it('deve navegar para criar contribuição ao clicar em Nova Contribuição', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [],
    })

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Contributions />
      </MemoryRouter>
    )

    const newButton = await screen.findByText('Nova Contribuição')
    await user.click(newButton)

    expect(mockNavigate).toHaveBeenCalledWith('/app/contributions/new')
  })

  it('deve exibir erro quando falha ao carregar contribuições', async () => {
    const toast = await import('react-hot-toast')
    vi.mocked(api.get).mockRejectedValue(new Error('Erro na API'))

    render(
      <MemoryRouter>
        <Contributions />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalledWith('Erro ao carregar contribuições')
    })
  })
})

