import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PermissionGuard from '@/components/PermissionGuard'
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

describe('PermissionGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve renderizar children quando tem permissão', () => {
    ;(useAuthStore as any).mockReturnValue({
      user: {
        id: 'user-1',
        role: 'MEMBER',
        permissions: [{ type: 'events_manage' }],
      },
    })

    render(
      <PermissionGuard permission="events_manage">
        <button>Novo Evento</button>
      </PermissionGuard>
    )

    expect(screen.getByText('Novo Evento')).toBeInTheDocument()
  })

  it('deve ocultar children quando não tem permissão', () => {
    ;(useAuthStore as any).mockReturnValue({
      user: {
        id: 'user-1',
        role: 'MEMBER',
        permissions: [],
      },
    })

    render(
      <PermissionGuard permission="events_manage">
        <button>Novo Evento</button>
      </PermissionGuard>
    )

    expect(screen.queryByText('Novo Evento')).not.toBeInTheDocument()
  })

  it('deve renderizar fallback quando não tem permissão', () => {
    ;(useAuthStore as any).mockReturnValue({
      user: {
        id: 'user-1',
        role: 'MEMBER',
        permissions: [],
      },
    })

    render(
      <PermissionGuard permission="events_manage" fallback={<div>Sem permissão</div>}>
        <button>Novo Evento</button>
      </PermissionGuard>
    )

    expect(screen.queryByText('Novo Evento')).not.toBeInTheDocument()
    expect(screen.getByText('Sem permissão')).toBeInTheDocument()
  })

  it('deve permitir acesso para ADMINGERAL mesmo sem permissão específica', () => {
    ;(useAuthStore as any).mockReturnValue({
      user: {
        id: 'user-1',
        role: 'ADMINGERAL',
        permissions: [],
      },
    })

    render(
      <PermissionGuard permission="events_manage">
        <button>Novo Evento</button>
      </PermissionGuard>
    )

    expect(screen.getByText('Novo Evento')).toBeInTheDocument()
  })

  it('deve permitir acesso para ADMINFILIAL mesmo sem permissão específica', () => {
    ;(useAuthStore as any).mockReturnValue({
      user: {
        id: 'user-1',
        role: 'ADMINFILIAL',
        permissions: [],
      },
    })

    render(
      <PermissionGuard permission="events_manage">
        <button>Novo Evento</button>
      </PermissionGuard>
    )

    expect(screen.getByText('Novo Evento')).toBeInTheDocument()
  })

  it('deve ocultar children quando não há usuário', () => {
    ;(useAuthStore as any).mockReturnValue({
      user: null,
    })

    render(
      <PermissionGuard permission="events_manage">
        <button>Novo Evento</button>
      </PermissionGuard>
    )

    expect(screen.queryByText('Novo Evento')).not.toBeInTheDocument()
  })

  it('deve aceitar array de permissões e permitir acesso se tiver qualquer uma', () => {
    ;(useAuthStore as any).mockReturnValue({
      user: {
        id: 'user-1',
        role: 'MEMBER',
        permissions: [{ type: 'events_manage' }],
      },
    })

    render(
      <PermissionGuard permission={['events_manage', 'contributions_manage']}>
        <button>Novo Evento</button>
      </PermissionGuard>
    )

    expect(screen.getByText('Novo Evento')).toBeInTheDocument()
  })
})

