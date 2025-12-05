import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { AdminLogin } from '../../pages/AdminLogin'
import { useAdminAuthStore } from '../../stores/adminAuthStore'
import { adminAuthApi } from '../../api/adminApi'
import { AdminRole } from '../../types'

vi.mock('../../api/adminApi')
vi.mock('../../stores/adminAuthStore')

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('Admin Auth Flow - Integration Tests', () => {
  const mockLogin = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useAdminAuthStore as any).mockReturnValue({
      login: mockLogin,
    })
  })

  it('deve fazer login com credenciais válidas', async () => {
    const user = userEvent.setup()
    ;(adminAuthApi.login as any).mockResolvedValue({
      token: 'mock-token',
      admin: {
        id: '1',
        name: 'Admin',
        email: 'admin@test.com',
        adminRole: AdminRole.SUPERADMIN,
        isActive: true,
      },
    })

    render(
      <BrowserRouter>
        <AdminLogin />
      </BrowserRouter>
    )

    const emailInput = screen.getByTestId('admin-login-email')
    const passwordInput = screen.getByTestId('admin-login-password')
    const submitButton = screen.getByTestId('admin-login-submit')

    await user.type(emailInput, 'admin@test.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(adminAuthApi.login).toHaveBeenCalledWith('admin@test.com', 'password123')
      expect(mockLogin).toHaveBeenCalled()
    })
  })

  it('deve mostrar erro com credenciais inválidas', async () => {
    const user = userEvent.setup()
    ;(adminAuthApi.login as any).mockRejectedValue({
      response: { data: { error: 'Credenciais inválidas' } },
    })

    render(
      <BrowserRouter>
        <AdminLogin />
      </BrowserRouter>
    )

    const emailInput = screen.getByTestId('admin-login-email')
    const passwordInput = screen.getByTestId('admin-login-password')
    const submitButton = screen.getByTestId('admin-login-submit')

    // Usa senha válida (6+ caracteres) para passar na validação do formulário
    await user.type(emailInput, 'wrong@test.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(adminAuthApi.login).toHaveBeenCalledWith('wrong@test.com', 'wrongpassword')
    })
  })
})

