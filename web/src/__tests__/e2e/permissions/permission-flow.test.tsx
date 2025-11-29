import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '@/App'
import { useAuthStore } from '@/stores/authStore'
import api from '@/api/api'

vi.mock('@/api/api')
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('Fluxo de Permissões E2E', () => {
  // Simula um membro criado via link de convite (sem permissões)
  const memberCreatedViaInvite = {
    id: 'member-invite-1',
    name: 'Membro Via Convite',
    email: 'invite@test.com',
    role: 'MEMBER',
    branchId: 'branch-1',
    permissions: [], // Membros criados via link não têm permissões
    token: 'mock-token',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(api.get as any).mockResolvedValue({ data: [] })
  })

  it('membro criado via link de convite não deve ter acesso a páginas protegidas', async () => {
    ;(useAuthStore as any).mockReturnValue({
      user: memberCreatedViaInvite,
      token: memberCreatedViaInvite.token,
      setUserFromToken: vi.fn(),
      setToken: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/app']}>
        <App />
      </MemoryRouter>
    )

    // Tenta acessar página de eventos (protegida)
    await waitFor(() => {
      expect(screen.getByText('403')).toBeInTheDocument()
      expect(screen.getByText('Acesso Negado')).toBeInTheDocument()
    })
  })

  it('membro criado via link de convite não deve ver botões protegidos', async () => {
    ;(useAuthStore as any).mockReturnValue({
      user: memberCreatedViaInvite,
      token: memberCreatedViaInvite.token,
      setUserFromToken: vi.fn(),
      setToken: vi.fn(),
    })

    // Acessa dashboard (página pública)
    render(
      <MemoryRouter initialEntries={['/app/dashboard']}>
        <App />
      </MemoryRouter>
    )

    await waitFor(() => {
      // Verifica que não há botões de criar eventos, membros, etc no dashboard
      // (assumindo que o dashboard tem links para essas páginas)
      expect(screen.queryByText(/Novo Evento/i)).not.toBeInTheDocument()
    })
  })

  it('membro criado via link de convite deve poder ver lista de membros com dados básicos', async () => {
    ;(useAuthStore as any).mockReturnValue({
      user: {
        ...memberCreatedViaInvite,
        permissions: [{ type: 'members_view' }], // Apenas visualização
      },
      token: memberCreatedViaInvite.token,
      setUserFromToken: vi.fn(),
      setToken: vi.fn(),
    })

    ;(api.get as any).mockResolvedValue({
      data: [
        {
          id: 'member-1',
          name: 'João Silva',
          email: 'joao@test.com',
          phone: '123456789',
          role: 'MEMBER',
          birthDate: '1990-01-01',
        },
      ],
    })

    render(
      <MemoryRouter initialEntries={['/app/members']}>
        <App />
      </MemoryRouter>
    )

    await waitFor(() => {
      // Deve ver nome e cargo
      expect(screen.getByText('João Silva')).toBeInTheDocument()
      expect(screen.getByText('Membro')).toBeInTheDocument()
      
      // NÃO deve ver dados sensíveis
      expect(screen.queryByText('joao@test.com')).not.toBeInTheDocument()
      expect(screen.queryByText('123456789')).not.toBeInTheDocument()
    })
  })

  it('membro criado via link de convite não deve poder criar novos membros', async () => {
    ;(useAuthStore as any).mockReturnValue({
      user: {
        ...memberCreatedViaInvite,
        permissions: [{ type: 'members_view' }], // Apenas visualização
      },
      token: memberCreatedViaInvite.token,
      setUserFromToken: vi.fn(),
      setToken: vi.fn(),
    })

    ;(api.get as any).mockResolvedValue({
      data: [],
    })

    render(
      <MemoryRouter initialEntries={['/app/members']}>
        <App />
      </MemoryRouter>
    )

    await waitFor(() => {
      // Não deve ver botão de criar membro
      expect(screen.queryByText(/Novo Membro/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Links de Convite/i)).not.toBeInTheDocument()
    })
  })

  it('membro criado via link de convite deve ver página 403 ao tentar acessar /app/members/new diretamente', async () => {
    ;(useAuthStore as any).mockReturnValue({
      user: memberCreatedViaInvite,
      token: memberCreatedViaInvite.token,
      setUserFromToken: vi.fn(),
      setToken: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/app/members/new']}>
        <App />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('403')).toBeInTheDocument()
      expect(screen.getByText('Acesso Negado')).toBeInTheDocument()
    })
  })

  it('fluxo completo: membro sem permissões tenta acessar várias páginas protegidas', async () => {
    ;(useAuthStore as any).mockReturnValue({
      user: memberCreatedViaInvite,
      token: memberCreatedViaInvite.token,
      setUserFromToken: vi.fn(),
      setToken: vi.fn(),
    })

    const { rerender } = render(
      <MemoryRouter initialEntries={['/app/events']}>
        <App />
      </MemoryRouter>
    )

    // Tenta acessar eventos
    await waitFor(() => {
      expect(screen.getByText('403')).toBeInTheDocument()
    })

    // Tenta acessar contribuições
    rerender(
      <MemoryRouter initialEntries={['/app/contributions']}>
        <App />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('403')).toBeInTheDocument()
    })

    // Tenta acessar devocionais
    rerender(
      <MemoryRouter initialEntries={['/app/devotionals']}>
        <App />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('403')).toBeInTheDocument()
    })

    // Tenta acessar finanças
    rerender(
      <MemoryRouter initialEntries={['/app/finances']}>
        <App />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('403')).toBeInTheDocument()
    })
  })
})

