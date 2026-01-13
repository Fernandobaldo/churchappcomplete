import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PermissionGuard from '@/components/PermissionGuard'
import { useAuthStore } from '@/stores/authStore'
import { fixtures } from '@/test/fixtures'

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

describe('PermissionGuard - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // TESTE 1: BASIC RENDER - Renderiza quando tem permissão
  // ============================================================================
  it('deve renderizar children quando tem permissão', () => {
    // Arrange
    const mockUser = fixtures.user({
      role: 'MEMBER',
      permissions: [{ type: 'events_manage' }],
    })
    ;(useAuthStore as any).mockReturnValue({
      user: mockUser,
    })

    // Act
    render(
      <PermissionGuard permission="events_manage">
        <button>Novo Evento</button>
      </PermissionGuard>
    )

    // Assert
    expect(screen.getByText('Novo Evento')).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 2: EMPTY STATE - Oculta quando não tem permissão
  // ============================================================================
  it('deve ocultar children quando não tem permissão', () => {
    // Arrange
    const mockUser = fixtures.user({
      role: 'MEMBER',
      permissions: [],
    })
    ;(useAuthStore as any).mockReturnValue({
      user: mockUser,
    })

    // Act
    render(
      <PermissionGuard permission="events_manage">
        <button>Novo Evento</button>
      </PermissionGuard>
    )

    // Assert
    expect(screen.queryByText('Novo Evento')).not.toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 3: FALLBACK - Renderiza fallback quando não tem permissão
  // ============================================================================
  it('deve renderizar fallback quando não tem permissão', () => {
    // Arrange
    const mockUser = fixtures.user({
      role: 'MEMBER',
      permissions: [],
    })
    ;(useAuthStore as any).mockReturnValue({
      user: mockUser,
    })

    // Act
    render(
      <PermissionGuard permission="events_manage" fallback={<div>Sem permissão</div>}>
        <button>Novo Evento</button>
      </PermissionGuard>
    )

    // Assert
    expect(screen.queryByText('Novo Evento')).not.toBeInTheDocument()
    expect(screen.getByText('Sem permissão')).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 4: EDGE CASE - ADMINGERAL tem acesso total
  // ============================================================================
  it('deve permitir acesso para ADMINGERAL mesmo sem permissão específica', () => {
    // Arrange
    const mockUser = fixtures.user({
      role: 'ADMINGERAL',
      permissions: [],
    })
    ;(useAuthStore as any).mockReturnValue({
      user: mockUser,
    })

    // Act
    render(
      <PermissionGuard permission="events_manage">
        <button>Novo Evento</button>
      </PermissionGuard>
    )

    // Assert
    expect(screen.getByText('Novo Evento')).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 5: EDGE CASE - ADMINFILIAL tem acesso total
  // ============================================================================
  it('deve permitir acesso para ADMINFILIAL mesmo sem permissão específica', () => {
    // Arrange
    const mockUser = fixtures.user({
      role: 'ADMINFILIAL',
      permissions: [],
    })
    ;(useAuthStore as any).mockReturnValue({
      user: mockUser,
    })

    // Act
    render(
      <PermissionGuard permission="events_manage">
        <button>Novo Evento</button>
      </PermissionGuard>
    )

    // Assert
    expect(screen.getByText('Novo Evento')).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 6: ERROR STATE - Oculta quando não há usuário
  // ============================================================================
  it('deve ocultar children quando não há usuário', () => {
    // Arrange
    ;(useAuthStore as any).mockReturnValue({
      user: null,
    })

    // Act
    render(
      <PermissionGuard permission="events_manage">
        <button>Novo Evento</button>
      </PermissionGuard>
    )

    // Assert
    expect(screen.queryByText('Novo Evento')).not.toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 7: PRIMARY INTERACTION - Array de permissões (hasAnyAccess)
  // ============================================================================
  it('deve aceitar array de permissões e permitir acesso se tiver qualquer uma', () => {
    // Arrange
    const mockUser = fixtures.user({
      role: 'MEMBER',
      permissions: [{ type: 'events_manage' }],
    })
    ;(useAuthStore as any).mockReturnValue({
      user: mockUser,
    })

    // Act
    render(
      <PermissionGuard permission={['events_manage', 'contributions_manage']}>
        <button>Novo Evento</button>
      </PermissionGuard>
    )

    // Assert
    expect(screen.getByText('Novo Evento')).toBeInTheDocument()
  })
})

