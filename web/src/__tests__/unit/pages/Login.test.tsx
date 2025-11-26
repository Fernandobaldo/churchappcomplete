import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Login from '@/pages/Login'
import api from '@/api/api'
import { useAuthStore } from '@/stores/authStore'
import { jwtDecode } from 'jwt-decode'

vi.mock('@/api/api')
vi.mock('jwt-decode')

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('Login', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, user: null })
    vi.clearAllMocks()
    mockNavigate.mockClear()
  })

  it('deve redirecionar para /onboarding/start quando login bem-sucedido mas sem onboarding completo', async () => {
    const user = userEvent.setup()
    const mockToken = 'valid-jwt-token'
    const mockResponse = {
      data: {
        token: mockToken,
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
        type: 'user',
      },
    }

    // Mock do token decodificado sem branchId e role (onboarding incompleto)
    vi.mocked(jwtDecode).mockReturnValue({
      sub: 'user-123',
      email: 'test@example.com',
      branchId: null,
      role: null,
      iat: 1234567890,
      exp: 1234571490,
    } as any)

    vi.mocked(api.post).mockResolvedValue(mockResponse)

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/senha/i), 'password123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      })
    })

    await waitFor(() => {
      expect(jwtDecode).toHaveBeenCalledWith(mockToken)
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/start')
    })
  })

  it('deve redirecionar para /app/dashboard quando login bem-sucedido e onboarding completo', async () => {
    const user = userEvent.setup()
    const mockToken = 'valid-jwt-token'
    const mockResponse = {
      data: {
        token: mockToken,
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
        type: 'member',
      },
    }

    // Mock do token decodificado com branchId e role (onboarding completo)
    vi.mocked(jwtDecode).mockReturnValue({
      sub: 'user-123',
      email: 'test@example.com',
      branchId: 'branch-123',
      role: 'ADMINGERAL',
      iat: 1234567890,
      exp: 1234571490,
    } as any)

    vi.mocked(api.post).mockResolvedValue(mockResponse)

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/senha/i), 'password123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      })
    })

    await waitFor(() => {
      expect(jwtDecode).toHaveBeenCalledWith(mockToken)
      expect(mockNavigate).toHaveBeenCalledWith('/app/dashboard')
    })
  })

  it('deve exibir erro quando credenciais são inválidas', async () => {
    const user = userEvent.setup()
    const errorResponse = {
      response: {
        data: { message: 'Credenciais inválidas' },
      },
    }

    vi.mocked(api.post).mockRejectedValue(errorResponse)

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    await user.type(screen.getByLabelText(/email/i), 'wrong@example.com')
    await user.type(screen.getByLabelText(/senha/i), 'wrong')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalled()
    })

    // Não deve chamar jwtDecode em caso de erro
    expect(jwtDecode).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})

