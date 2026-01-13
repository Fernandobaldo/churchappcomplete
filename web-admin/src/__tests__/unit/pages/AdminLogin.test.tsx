import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { AdminLogin } from '../../../pages/AdminLogin'
import { useAdminAuthStore } from '../../../stores/adminAuthStore'
import { adminAuthApi } from '../../../api/adminApi'

// Mock do store
vi.mock('../../../stores/adminAuthStore')
vi.mock('../../../api/adminApi')
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('AdminLogin - Unit Tests', () => {
  const mockLogin = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useAdminAuthStore as any).mockReturnValue({
      login: mockLogin,
    })
  })

  it('deve renderizar o formulário de login', () => {
    render(
      <BrowserRouter>
        <AdminLogin />
      </BrowserRouter>
    )

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()
  })

  it('deve fazer login com credenciais válidas', async () => {
    const user = userEvent.setup()
    const mockResponse = {
      token: 'test-token',
      admin: {
        id: '1',
        name: 'Admin',
        email: 'admin@test.com',
        adminRole: 'SUPERADMIN',
      },
    }

    ;(adminAuthApi.login as any).mockResolvedValue(mockResponse)

    render(
      <BrowserRouter>
        <AdminLogin />
      </BrowserRouter>
    )

    await user.type(screen.getByLabelText(/email/i), 'admin@test.com')
    await user.type(screen.getByLabelText(/senha/i), 'password123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(adminAuthApi.login).toHaveBeenCalledWith('admin@test.com', 'password123')
      expect(mockLogin).toHaveBeenCalledWith(mockResponse.token, mockResponse.admin)
      expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard')
    })
  })

  it('deve exibir erro quando login falha', async () => {
    const user = userEvent.setup()
    const error = {
      response: {
        data: {
          message: 'Credenciais inválidas',
        },
      },
    }

    ;(adminAuthApi.login as any).mockRejectedValue(error)

    render(
      <BrowserRouter>
        <AdminLogin />
      </BrowserRouter>
    )

    await user.type(screen.getByLabelText(/email/i), 'admin@test.com')
    await user.type(screen.getByLabelText(/senha/i), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(adminAuthApi.login).toHaveBeenCalled()
      expect(mockLogin).not.toHaveBeenCalled()
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })
})








