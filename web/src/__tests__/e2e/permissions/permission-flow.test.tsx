import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '@/App'
import { useAuthStore } from '@/stores/authStore'
import api from '@/api/api'

// Variável global para controlar a rota inicial nos testes
let testInitialEntries = ['/']

// Mock do BrowserRouter para usar MemoryRouter nos testes
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    BrowserRouter: ({ children }: any) => {
      const { MemoryRouter } = actual as any
      return <MemoryRouter initialEntries={testInitialEntries}>{children}</MemoryRouter>
    },
  }
})

vi.mock('@/api/api')
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: () => null,
}))

describe('Fluxo de Permissões E2E', () => {
  // Simula um membro criado via link de convite (com members_view automaticamente)
  const memberCreatedViaInvite = {
    id: 'member-invite-1',
    name: 'Membro Via Convite',
    email: 'invite@test.com',
    role: 'MEMBER',
    branchId: 'branch-1',
    permissions: [{ type: 'members_view' }], // Membros criados via link recebem members_view automaticamente
    token: 'mock-token',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    testInitialEntries = ['/']
    ;(api.get as any).mockResolvedValue({ data: [] })
  })

  it('membro criado via link de convite não deve ter acesso a páginas protegidas', async () => {
    ;(useAuthStore as any).mockReturnValue({
      user: memberCreatedViaInvite,
      token: memberCreatedViaInvite.token,
      setUserFromToken: vi.fn(),
      setToken: vi.fn(),
    })

    testInitialEntries = ['/app/events/new']
    render(<App />)

    // Tenta acessar página de criar evento (protegida por permissão)
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
    testInitialEntries = ['/app/dashboard']
    render(<App />)

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

    testInitialEntries = ['/app/members']
    render(<App />)

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

    testInitialEntries = ['/app/members']
    render(<App />)

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

    testInitialEntries = ['/app/members/new']
    render(<App />)

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

    // Tenta acessar criar evento (protegido por permissão)
    testInitialEntries = ['/app/events/new']
    const { rerender } = render(<App />)

    await waitFor(() => {
      expect(screen.getByText('403')).toBeInTheDocument()
    })

    // Tenta acessar criar contribuição (protegido por permissão)
    testInitialEntries = ['/app/contributions/new']
    rerender(<App />)

    await waitFor(() => {
      expect(screen.getByText('403')).toBeInTheDocument()
    })

    // Tenta acessar criar devocional (protegido por permissão)
    testInitialEntries = ['/app/devotionals/new']
    rerender(<App />)

    await waitFor(() => {
      expect(screen.getByText('403')).toBeInTheDocument()
    })

    // Tenta acessar criar transação financeira (protegido por permissão)
    testInitialEntries = ['/app/finances/new']
    rerender(<App />)

    await waitFor(() => {
      expect(screen.getByText('403')).toBeInTheDocument()
    })
  })
})

