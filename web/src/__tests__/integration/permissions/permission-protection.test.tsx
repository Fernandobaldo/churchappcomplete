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

describe('Proteção de Permissões - Integração', () => {
  const mockUserWithoutPermissions = {
    id: 'user-1',
    name: 'Membro Sem Permissões',
    email: 'member@test.com',
    role: 'MEMBER',
    branchId: 'branch-1',
    permissions: [], // Sem permissões
    token: 'mock-token',
  }

  const mockUserWithPermissions = {
    id: 'user-2',
    name: 'Membro Com Permissões',
    email: 'admin@test.com',
    role: 'MEMBER',
    branchId: 'branch-1',
    permissions: [
      { type: 'events_manage' },
      { type: 'members_view' },
      { type: 'members_manage' },
    ],
    token: 'mock-token',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(api.get as any).mockResolvedValue({ data: [] })
  })

  it('usuário sem permissão não deve ver botões protegidos na página de eventos', async () => {
    ;(useAuthStore as any).mockReturnValue({
      user: mockUserWithoutPermissions,
      token: mockUserWithoutPermissions.token,
      setUserFromToken: vi.fn(),
      setToken: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/app/events']}>
        <App />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.queryByText(/Novo Evento/i)).not.toBeInTheDocument()
    })
  })

  it('usuário sem permissão não deve acessar rotas protegidas (deve ver 403)', async () => {
    ;(useAuthStore as any).mockReturnValue({
      user: mockUserWithoutPermissions,
      token: mockUserWithoutPermissions.token,
      setUserFromToken: vi.fn(),
      setToken: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/app/events']}>
        <App />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('403')).toBeInTheDocument()
      expect(screen.getByText('Acesso Negado')).toBeInTheDocument()
    })
  })

  it('usuário com permissão deve ver botões e acessar rotas', async () => {
    ;(useAuthStore as any).mockReturnValue({
      user: mockUserWithPermissions,
      token: mockUserWithPermissions.token,
      setUserFromToken: vi.fn(),
      setToken: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/app/events']}>
        <App />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Novo Evento/i)).toBeInTheDocument()
    })
  })

  it('ADMINGERAL deve ter acesso a tudo', async () => {
    const adminUser = {
      ...mockUserWithoutPermissions,
      role: 'ADMINGERAL',
    }

    ;(useAuthStore as any).mockReturnValue({
      user: adminUser,
      token: adminUser.token,
      setUserFromToken: vi.fn(),
      setToken: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/app/events']}>
        <App />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Novo Evento/i)).toBeInTheDocument()
    })
  })

  it('ADMINFILIAL deve ter acesso a tudo', async () => {
    const adminUser = {
      ...mockUserWithoutPermissions,
      role: 'ADMINFILIAL',
    }

    ;(useAuthStore as any).mockReturnValue({
      user: adminUser,
      token: adminUser.token,
      setUserFromToken: vi.fn(),
      setToken: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/app/events']}>
        <App />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Novo Evento/i)).toBeInTheDocument()
    })
  })

  it('usuário com members_view deve ver lista de membros mas não dados sensíveis', async () => {
    const userWithViewOnly = {
      ...mockUserWithoutPermissions,
      permissions: [{ type: 'members_view' }],
    }

    ;(useAuthStore as any).mockReturnValue({
      user: userWithViewOnly,
      token: userWithViewOnly.token,
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
        },
      ],
    })

    render(
      <MemoryRouter initialEntries={['/app/members']}>
        <App />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument()
      // Email e telefone não devem estar visíveis
      expect(screen.queryByText('joao@test.com')).not.toBeInTheDocument()
      expect(screen.queryByText('123456789')).not.toBeInTheDocument()
    })
  })

  it('usuário com members_manage deve ver todos os dados de membros', async () => {
    const userWithManage = {
      ...mockUserWithoutPermissions,
      permissions: [{ type: 'members_manage' }],
    }

    ;(useAuthStore as any).mockReturnValue({
      user: userWithManage,
      token: userWithManage.token,
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
        },
      ],
    })

    render(
      <MemoryRouter initialEntries={['/app/members']}>
        <App />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument()
      expect(screen.getByText('joao@test.com')).toBeInTheDocument()
      expect(screen.getByText('123456789')).toBeInTheDocument()
    })
  })
})

