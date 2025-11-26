import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import Members from '@/pages/Members/index'
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

describe('Members Page', () => {
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
        <Members />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Membros')).toBeInTheDocument()
      expect(screen.getByText('Novo Membro')).toBeInTheDocument()
    })
  })

  it('deve exibir lista de membros', async () => {
    const mockMembers = [
      {
        id: 'member-1',
        name: 'João Silva',
        email: 'joao@example.com',
        role: 'MEMBER',
        branchId: 'branch-123',
        permissions: [],
      },
      {
        id: 'member-2',
        name: 'Maria Santos',
        email: 'maria@example.com',
        role: 'COORDINATOR',
        branchId: 'branch-123',
        permissions: [{ type: 'events_manage' }],
      },
    ]

    vi.mocked(api.get).mockResolvedValue({
      data: mockMembers,
    })

    render(
      <MemoryRouter>
        <Members />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument()
      expect(screen.getByText('Maria Santos')).toBeInTheDocument()
    })
  })

  it('deve navegar para criar membro ao clicar em Novo Membro', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [],
    })

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Members />
      </MemoryRouter>
    )

    const newButton = await screen.findByText('Novo Membro')
    await user.click(newButton)

    expect(mockNavigate).toHaveBeenCalledWith('/app/members/new')
  })

  it('deve navegar para detalhes do membro ao clicar no card', async () => {
    const mockMembers = [
      {
        id: 'member-1',
        name: 'João Silva',
        email: 'joao@example.com',
        role: 'MEMBER',
        branchId: 'branch-123',
        permissions: [],
      },
    ]

    vi.mocked(api.get).mockResolvedValue({
      data: mockMembers,
    })

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Members />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument()
    })

    const memberCard = screen.getByText('João Silva').closest('div[class*="border"]')
    if (memberCard) {
      await user.click(memberCard)
      expect(mockNavigate).toHaveBeenCalledWith('/app/members/member-1')
    }
  })

  it('deve exibir erro quando falha ao carregar membros', async () => {
    const toast = await import('react-hot-toast')
    vi.mocked(api.get).mockRejectedValue(new Error('Erro na API'))

    render(
      <MemoryRouter>
        <Members />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalledWith('Erro ao carregar membros')
    })
  })
})

