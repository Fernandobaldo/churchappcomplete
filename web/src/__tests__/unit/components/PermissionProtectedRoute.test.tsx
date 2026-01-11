import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen } from '@testing-library/react'
import PermissionProtectedRoute from '@/components/PermissionProtectedRoute'
import { useAuthStore } from '@/stores/authStore'
import { fixtures } from '@/test/fixtures'
import { renderWithProviders } from '@/test/helpers'

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
  hasRole: vi.fn((user, role) => user?.role === role),
  hasAnyRole: vi.fn((user, roles) => roles.includes(user?.role)),
}))

describe('PermissionProtectedRoute - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // TESTE 1: BASIC RENDER - Renderiza children quando tem permissão
  // ============================================================================
  it('deve renderizar children quando tem permissão', () => {
    // Arrange
    const mockUser = fixtures.user({
      role: 'MEMBER',
      permissions: [{ type: 'events_manage' }],
      branchId: 'branch-1',
    })
    ;(useAuthStore as any).mockReturnValue({
      token: 'mock-token',
      user: mockUser,
    })

    // Act
    renderWithProviders(
      <PermissionProtectedRoute permission="events_manage">
        <div>Conteúdo Protegido</div>
      </PermissionProtectedRoute>
    )

    // Assert
    expect(screen.getByText('Conteúdo Protegido')).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 2: ERROR STATE - Renderiza página 403 quando não tem permissão
  // ============================================================================
  it('deve renderizar página 403 quando não tem permissão', () => {
    // Arrange
    const mockUser = fixtures.user({
      role: 'MEMBER',
      permissions: [],
      branchId: 'branch-1',
    })
    ;(useAuthStore as any).mockReturnValue({
      token: 'mock-token',
      user: mockUser,
    })

    // Act
    renderWithProviders(
      <PermissionProtectedRoute permission="events_manage">
        <div>Conteúdo Protegido</div>
      </PermissionProtectedRoute>
    )

    // Assert
    expect(screen.getByText('403')).toBeInTheDocument()
    expect(screen.getByText('Acesso Negado')).toBeInTheDocument()
    expect(screen.queryByText('Conteúdo Protegido')).not.toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 3: EDGE CASE - ADMINGERAL tem acesso total
  // ============================================================================
  it('deve permitir acesso para ADMINGERAL mesmo sem permissão específica', () => {
    // Arrange
    const mockUser = fixtures.user({
      role: 'ADMINGERAL',
      permissions: [],
      branchId: 'branch-1',
    })
    ;(useAuthStore as any).mockReturnValue({
      token: 'mock-token',
      user: mockUser,
    })

    // Act
    renderWithProviders(
      <PermissionProtectedRoute permission="events_manage">
        <div>Conteúdo Protegido</div>
      </PermissionProtectedRoute>
    )

    // Assert
    expect(screen.getByText('Conteúdo Protegido')).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 4: EDGE CASE - ADMINFILIAL tem acesso total
  // ============================================================================
  it('deve permitir acesso para ADMINFILIAL mesmo sem permissão específica', () => {
    // Arrange
    const mockUser = fixtures.user({
      role: 'ADMINFILIAL',
      permissions: [],
      branchId: 'branch-1',
    })
    ;(useAuthStore as any).mockReturnValue({
      token: 'mock-token',
      user: mockUser,
    })

    // Act
    renderWithProviders(
      <PermissionProtectedRoute permission="events_manage">
        <div>Conteúdo Protegido</div>
      </PermissionProtectedRoute>
    )

    // Assert
    expect(screen.getByText('Conteúdo Protegido')).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 5: REDIRECT - Redireciona para login quando não tem token
  // ============================================================================
  it('deve redirecionar para login quando não tem token', () => {
    // Arrange
    ;(useAuthStore as any).mockReturnValue({
      token: null,
      user: null,
    })

    // Act
    renderWithProviders(
      <PermissionProtectedRoute permission="events_manage">
        <div>Conteúdo Protegido</div>
      </PermissionProtectedRoute>
    )

    // Assert
    expect(screen.queryByText('Conteúdo Protegido')).not.toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 6: DEFAULT BEHAVIOR - Permite acesso quando não há permissão especificada
  // ============================================================================
  it('deve permitir acesso quando não há permissão especificada', () => {
    // Arrange
    const mockUser = fixtures.user({
      role: 'MEMBER',
      permissions: [],
      branchId: 'branch-1',
    })
    ;(useAuthStore as any).mockReturnValue({
      token: 'mock-token',
      user: mockUser,
    })

    // Act
    renderWithProviders(
      <PermissionProtectedRoute>
        <div>Conteúdo Público</div>
      </PermissionProtectedRoute>
    )

    // Assert
    expect(screen.getByText('Conteúdo Público')).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 7: ARRAY PERMISSIONS - Aceita array de permissões
  // ============================================================================
  it('deve aceitar array de permissões e permitir acesso se tiver qualquer uma', () => {
    // Arrange
    const mockUser = fixtures.user({
      role: 'MEMBER',
      permissions: [{ type: 'events_manage' }],
      branchId: 'branch-1',
    })
    ;(useAuthStore as any).mockReturnValue({
      token: 'mock-token',
      user: mockUser,
    })

    // Act
    renderWithProviders(
      <PermissionProtectedRoute permission={['events_manage', 'contributions_manage']}>
        <div>Conteúdo Protegido</div>
      </PermissionProtectedRoute>
    )

    // Assert
    expect(screen.getByText('Conteúdo Protegido')).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 8: ONBOARDING CHECK - Redireciona quando onboarding não completo
  // ============================================================================
  it('deve redirecionar para onboarding quando não tem branchId', () => {
    // Arrange
    const mockUser = fixtures.user({
      role: 'MEMBER',
      permissions: [{ type: 'events_manage' }],
      branchId: '',
    })
    ;(useAuthStore as any).mockReturnValue({
      token: 'mock-token',
      user: mockUser,
    })

    // Act
    renderWithProviders(
      <PermissionProtectedRoute permission="events_manage">
        <div>Conteúdo Protegido</div>
      </PermissionProtectedRoute>
    )

    // Assert
    expect(screen.queryByText('Conteúdo Protegido')).not.toBeInTheDocument()
  })
})


    ;(useAuthStore as any).mockReturnValue({
      token: 'mock-token',
      user: mockUser,
    })

    // Act
    renderWithProviders(
      <PermissionProtectedRoute permission={['events_manage', 'contributions_manage']}>
        <div>Conteúdo Protegido</div>
      </PermissionProtectedRoute>
    )

    // Assert
    expect(screen.getByText('Conteúdo Protegido')).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 8: ONBOARDING CHECK - Redireciona quando onboarding não completo
  // ============================================================================
  it('deve redirecionar para onboarding quando não tem branchId', () => {
    // Arrange
    const mockUser = fixtures.user({
      role: 'MEMBER',
      permissions: [{ type: 'events_manage' }],
      branchId: '',
    })
    ;(useAuthStore as any).mockReturnValue({
      token: 'mock-token',
      user: mockUser,
    })

    // Act
    renderWithProviders(
      <PermissionProtectedRoute permission="events_manage">
        <div>Conteúdo Protegido</div>
      </PermissionProtectedRoute>
    )

    // Assert
    expect(screen.queryByText('Conteúdo Protegido')).not.toBeInTheDocument()
  })
})

