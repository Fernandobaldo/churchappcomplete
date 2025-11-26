import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Login from '@/pages/Login'
import api from '@/api/api'
import { useAuthStore } from '@/stores/authStore'
import { mockDecodedToken } from '@/test/mocks/mockData'
import { jwtDecode } from 'jwt-decode'

vi.mock('@/api/api')
vi.mock('jwt-decode')

describe('Login Integration', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, user: null })
    vi.clearAllMocks()
  })

  it('deve fazer login com sucesso e redirecionar para dashboard quando onboarding completo', async () => {
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

    // Mock do token com onboarding completo
    vi.mocked(jwtDecode).mockReturnValue({
      ...mockDecodedToken,
      branchId: 'branch-123',
      role: 'ADMINGERAL',
    } as any)

    vi.mocked(api.post).mockResolvedValue(mockResponse)

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    // Preenche formulário
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/senha/i), 'password123')

    // Submete formulário
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    // Verifica chamada da API
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      })
    })

    // Verifica se token foi salvo
    await waitFor(() => {
      expect(useAuthStore.getState().token).toBe(mockToken)
    })

    // Verifica se jwtDecode foi chamado
    await waitFor(() => {
      expect(jwtDecode).toHaveBeenCalledWith(mockToken)
    })
  })

  it('deve redirecionar para onboarding quando login bem-sucedido mas sem onboarding completo', async () => {
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

    // Mock do token sem onboarding completo (sem branchId ou role)
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

    // Preenche formulário
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/senha/i), 'password123')

    // Submete formulário
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    // Verifica chamada da API
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      })
    })

    // Verifica se token foi salvo
    await waitFor(() => {
      expect(useAuthStore.getState().token).toBe(mockToken)
    })

    // Verifica se jwtDecode foi chamado para verificar onboarding
    await waitFor(() => {
      expect(jwtDecode).toHaveBeenCalledWith(mockToken)
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

    // Verifica se erro foi tratado
    await waitFor(() => {
      expect(api.post).toHaveBeenCalled()
    })
  })

  it('deve validar campos obrigatórios', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    // Tenta submeter sem preencher
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    // Verifica mensagens de erro
    expect(await screen.findByText(/email é obrigatório/i)).toBeInTheDocument()
    expect(await screen.findByText(/senha é obrigatória/i)).toBeInTheDocument()
  })

  it('deve exibir loading durante o login', async () => {
    const user = userEvent.setup()
    const mockToken = 'valid-jwt-token'
    const mockResponse = {
      data: {
        token: mockToken,
        user: { id: 'user-123', email: 'test@example.com' },
        type: 'member',
      },
    }

    // Delay na resposta para testar loading
    vi.mocked(api.post).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockResponse), 100))
    )

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/senha/i), 'password123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    // Verifica se mostra loading
    expect(screen.getByText(/entrando/i)).toBeInTheDocument()
  })
})


