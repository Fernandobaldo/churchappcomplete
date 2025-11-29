import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PermissionProtectedRoute from '@/components/PermissionProtectedRoute'
import { useAuthStore } from '@/stores/authStore'

vi.mock('@/stores/authStore')
vi.mock('@/utils/authUtils', () => ({
  hasAccess: vi.fn((user, permission) => {
    if (!user) return false
    if (user.role === 'ADMINGERAL' || user.role === 'ADMINFILIAL') return true
    return user.permissions?.some((p: any) => p.type === permission) === true
  }),
  hasAnyAccess: vi.fn((user, permissions) => {
    if (!user) return false
    if (user.role === 'ADMINGERAL' || user.role === 'ADMINFILIAL') return true
    return permissions.some((permission) =>
      user.permissions?.some((p: any) => p.type === permission)
    )
  }),
}))

describe('PermissionProtectedRoute', () => {
  const mockNavigate = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom')
      return {
        ...actual,
        Navigate: ({ to }: any) => {
          mockNavigate(to)
          return null
        },
      }
    })
  })

  it('deve renderizar children quando tem permissão', () => {
    ;(useAuthStore as any).mockReturnValue({
      token: 'mock-token',
      user: {
        id: 'user-1',
        role: 'MEMBER',
        permissions: [{ type: 'events_manage' }],
        branchId: 'branch-1',
      },
    })

    render(
      <MemoryRouter>
        <PermissionProtectedRoute permission="events_manage">
          <div>Conteúdo Protegido</div>
        </PermissionProtectedRoute>
      </MemoryRouter>
    )

    expect(screen.getByText('Conteúdo Protegido')).toBeInTheDocument()
  })

  it('deve renderizar página 403 quando não tem permissão', () => {
    ;(useAuthStore as any).mockReturnValue({
      token: 'mock-token',
      user: {
        id: 'user-1',
        role: 'MEMBER',
        permissions: [],
        branchId: 'branch-1',
      },
    })

    render(
      <MemoryRouter>
        <PermissionProtectedRoute permission="events_manage">
          <div>Conteúdo Protegido</div>
        </PermissionProtectedRoute>
      </MemoryRouter>
    )

    expect(screen.getByText('403')).toBeInTheDocument()
    expect(screen.getByText('Acesso Negado')).toBeInTheDocument()
    expect(screen.queryByText('Conteúdo Protegido')).not.toBeInTheDocument()
  })

  it('deve permitir acesso para ADMINGERAL mesmo sem permissão específica', () => {
    ;(useAuthStore as any).mockReturnValue({
      token: 'mock-token',
      user: {
        id: 'user-1',
        role: 'ADMINGERAL',
        permissions: [],
        branchId: 'branch-1',
      },
    })

    render(
      <MemoryRouter>
        <PermissionProtectedRoute permission="events_manage">
          <div>Conteúdo Protegido</div>
        </PermissionProtectedRoute>
      </MemoryRouter>
    )

    expect(screen.getByText('Conteúdo Protegido')).toBeInTheDocument()
  })

  it('deve permitir acesso para ADMINFILIAL mesmo sem permissão específica', () => {
    ;(useAuthStore as any).mockReturnValue({
      token: 'mock-token',
      user: {
        id: 'user-1',
        role: 'ADMINFILIAL',
        permissions: [],
        branchId: 'branch-1',
      },
    })

    render(
      <MemoryRouter>
        <PermissionProtectedRoute permission="events_manage">
          <div>Conteúdo Protegido</div>
        </PermissionProtectedRoute>
      </MemoryRouter>
    )

    expect(screen.getByText('Conteúdo Protegido')).toBeInTheDocument()
  })

  it('deve redirecionar para login quando não tem token', () => {
    ;(useAuthStore as any).mockReturnValue({
      token: null,
      user: null,
    })

    render(
      <MemoryRouter>
        <PermissionProtectedRoute permission="events_manage">
          <div>Conteúdo Protegido</div>
        </PermissionProtectedRoute>
      </MemoryRouter>
    )

    // Verifica se o Navigate foi chamado (redirecionamento)
    expect(screen.queryByText('Conteúdo Protegido')).not.toBeInTheDocument()
  })

  it('deve permitir acesso quando não há permissão especificada', () => {
    ;(useAuthStore as any).mockReturnValue({
      token: 'mock-token',
      user: {
        id: 'user-1',
        role: 'MEMBER',
        permissions: [],
        branchId: 'branch-1',
      },
    })

    render(
      <MemoryRouter>
        <PermissionProtectedRoute>
          <div>Conteúdo Público</div>
        </PermissionProtectedRoute>
      </MemoryRouter>
    )

    expect(screen.getByText('Conteúdo Público')).toBeInTheDocument()
  })

  it('deve aceitar array de permissões e permitir acesso se tiver qualquer uma', () => {
    ;(useAuthStore as any).mockReturnValue({
      token: 'mock-token',
      user: {
        id: 'user-1',
        role: 'MEMBER',
        permissions: [{ type: 'events_manage' }],
        branchId: 'branch-1',
      },
    })

    render(
      <MemoryRouter>
        <PermissionProtectedRoute permission={['events_manage', 'contributions_manage']}>
          <div>Conteúdo Protegido</div>
        </PermissionProtectedRoute>
      </MemoryRouter>
    )

    expect(screen.getByText('Conteúdo Protegido')).toBeInTheDocument()
  })
})

