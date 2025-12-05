import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PermissionGuard } from '../../../components/PermissionGuard'
import { useAdminAuthStore } from '../../../stores/adminAuthStore'
import { AdminRole } from '../../../types'

vi.mock('../../../stores/adminAuthStore')

describe('PermissionGuard - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve renderizar children quando admin tem role permitida', () => {
    ;(useAdminAuthStore as any).mockReturnValue({
      adminUser: {
        id: '1',
        name: 'Admin',
        email: 'admin@test.com',
        adminRole: AdminRole.SUPERADMIN,
        isActive: true,
      },
    })

    render(
      <PermissionGuard allowedRoles={[AdminRole.SUPERADMIN]}>
        <div>Conteúdo Protegido</div>
      </PermissionGuard>
    )

    expect(screen.getByText('Conteúdo Protegido')).toBeInTheDocument()
  })

  it('deve renderizar fallback quando admin não tem role permitida', () => {
    ;(useAdminAuthStore as any).mockReturnValue({
      adminUser: {
        id: '1',
        name: 'Support',
        email: 'support@test.com',
        adminRole: AdminRole.SUPPORT,
        isActive: true,
      },
    })

    render(
      <PermissionGuard
        allowedRoles={[AdminRole.SUPERADMIN]}
        fallback={<div>Acesso Negado</div>}
      >
        <div>Conteúdo Protegido</div>
      </PermissionGuard>
    )

    expect(screen.queryByText('Conteúdo Protegido')).not.toBeInTheDocument()
    expect(screen.getByText('Acesso Negado')).toBeInTheDocument()
  })

  it('deve renderizar null quando não há fallback e role não permitida', () => {
    ;(useAdminAuthStore as any).mockReturnValue({
      adminUser: {
        id: '1',
        name: 'Finance',
        email: 'finance@test.com',
        adminRole: AdminRole.FINANCE,
        isActive: true,
      },
    })

    const { container } = render(
      <PermissionGuard allowedRoles={[AdminRole.SUPERADMIN]}>
        <div>Conteúdo Protegido</div>
      </PermissionGuard>
    )

    // Quando não há fallback, retorna um fragmento vazio
    expect(container.firstChild).toBeNull()
  })

  it('deve renderizar fallback quando adminUser é null', () => {
    ;(useAdminAuthStore as any).mockReturnValue({
      adminUser: null,
    })

    render(
      <PermissionGuard
        allowedRoles={[AdminRole.SUPERADMIN]}
        fallback={<div>Não autenticado</div>}
      >
        <div>Conteúdo Protegido</div>
      </PermissionGuard>
    )

    expect(screen.getByText('Não autenticado')).toBeInTheDocument()
  })
})

