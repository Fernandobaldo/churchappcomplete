import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AdminProtectedRoute } from '../../../components/AdminProtectedRoute'
import { useAdminAuthStore } from '../../../stores/adminAuthStore'
import { AdminRole } from '../../../types'

vi.mock('../../../stores/adminAuthStore')
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate">Navigate to {to}</div>,
  }
})

describe('AdminProtectedRoute - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve renderizar children quando autenticado e sem restrição de role', () => {
    ;(useAdminAuthStore as any).mockReturnValue({
      isAuthenticated: true,
      adminUser: {
        id: '1',
        name: 'Admin',
        email: 'admin@test.com',
        adminRole: AdminRole.SUPERADMIN,
        isActive: true,
      },
      checkAuth: () => true,
    })

    render(
      <BrowserRouter>
        <AdminProtectedRoute>
          <div>Conteúdo Protegido</div>
        </AdminProtectedRoute>
      </BrowserRouter>
    )

    expect(screen.getByText('Conteúdo Protegido')).toBeInTheDocument()
  })

  it('deve redirecionar para login quando não autenticado', () => {
    ;(useAdminAuthStore as any).mockReturnValue({
      isAuthenticated: false,
      adminUser: null,
      checkAuth: () => false,
    })

    render(
      <BrowserRouter>
        <AdminProtectedRoute>
          <div>Conteúdo Protegido</div>
        </AdminProtectedRoute>
      </BrowserRouter>
    )

    expect(screen.getByTestId('navigate')).toBeInTheDocument()
    expect(screen.getByText(/Navigate to \/admin\/login/)).toBeInTheDocument()
  })

  it('deve redirecionar para forbidden quando role não permitida', () => {
    ;(useAdminAuthStore as any).mockReturnValue({
      isAuthenticated: true,
      adminUser: {
        id: '1',
        name: 'Support',
        email: 'support@test.com',
        adminRole: AdminRole.SUPPORT,
        isActive: true,
      },
      checkAuth: () => true,
    })

    render(
      <BrowserRouter>
        <AdminProtectedRoute allowedRoles={[AdminRole.SUPERADMIN]}>
          <div>Conteúdo Protegido</div>
        </AdminProtectedRoute>
      </BrowserRouter>
    )

    expect(screen.getByTestId('navigate')).toBeInTheDocument()
    expect(screen.getByText(/Navigate to \/admin\/forbidden/)).toBeInTheDocument()
  })

  it('deve permitir acesso quando role está na lista permitida', () => {
    ;(useAdminAuthStore as any).mockReturnValue({
      isAuthenticated: true,
      adminUser: {
        id: '1',
        name: 'Support',
        email: 'support@test.com',
        adminRole: AdminRole.SUPPORT,
        isActive: true,
      },
      checkAuth: () => true,
    })

    render(
      <BrowserRouter>
        <AdminProtectedRoute allowedRoles={[AdminRole.SUPERADMIN, AdminRole.SUPPORT]}>
          <div>Conteúdo Protegido</div>
        </AdminProtectedRoute>
      </BrowserRouter>
    )

    expect(screen.getByText('Conteúdo Protegido')).toBeInTheDocument()
  })
})






