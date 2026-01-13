import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Login from '@/pages/Login'
import { renderWithProviders } from '@/test/renderWithProviders'
import { mockApiResponse, mockApiError, resetApiMocks } from '@/test/mockApi'
import { jwtDecode } from 'jwt-decode'

// Mock jwt-decode
vi.mock('jwt-decode', () => ({
  jwtDecode: vi.fn(),
}))

// Mock api
vi.mock('@/api/api', async () => {
  const { apiMock } = await import('@/test/apiMock')
  return { default: apiMock }
})

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('Login - Unit Tests', () => {
  beforeEach(() => {
    resetApiMocks()
    mockNavigate.mockClear()
    vi.clearAllMocks()
  })

  // ============================================================================
  // TESTE 1: BASIC RENDER - Renderização básica
  // ============================================================================
  it('deve renderizar campos de email e senha corretamente', () => {
    // Arrange
    // Act
    renderWithProviders(<Login />)

    // Assert
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 2: PRIMARY INTERACTION - Login com onboarding incompleto
  // ============================================================================
  it('deve redirecionar para /onboarding/start quando login bem-sucedido mas sem onboarding completo', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockToken = 'valid-jwt-token'
    mockApiResponse('post', '/auth/login', {
        token: mockToken,
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
        type: 'user',
    })

    vi.mocked(jwtDecode).mockReturnValue({
      sub: 'user-123',
      email: 'test@example.com',
      branchId: null,
      role: null,
      iat: 1234567890,
      exp: 1234571490,
    } as any)

    // Act
    renderWithProviders(<Login />)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/senha/i), 'password123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    // Assert
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/start')
    })
  })

  // ============================================================================
  // TESTE 3: PRIMARY INTERACTION - Login com onboarding completo
  // ============================================================================
  it('deve redirecionar para /app/dashboard quando login bem-sucedido e onboarding completo', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockToken = 'valid-jwt-token'
    mockApiResponse('post', '/auth/login', {
        token: mockToken,
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
        type: 'member',
    })

    vi.mocked(jwtDecode).mockReturnValue({
      sub: 'user-123',
      email: 'test@example.com',
      branchId: 'branch-123',
      role: 'ADMINGERAL',
      iat: 1234567890,
      exp: 1234571490,
    } as any)

    // Act
    renderWithProviders(<Login />)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/senha/i), 'password123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    // Assert
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/app/dashboard')
    })
  })

  // ============================================================================
  // TESTE 4: ERROR STATE - Erro ao fazer login
  // ============================================================================
  it('deve exibir erro quando credenciais são inválidas', async () => {
    // Arrange
    const user = userEvent.setup()
    mockApiError('post', '/auth/login', {
      status: 401,
      message: 'Credenciais inválidas',
        data: { message: 'Credenciais inválidas' },
    })

    // Act
    renderWithProviders(<Login />)

    await user.type(screen.getByLabelText(/email/i), 'wrong@example.com')
    await user.type(screen.getByLabelText(/senha/i), 'wrong')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    // Assert
    await waitFor(() => {
    // Não deve chamar jwtDecode em caso de erro
    expect(jwtDecode).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})

  // ============================================================================
  // TESTE 5: LOADING STATE - Estado de carregamento durante login
  // ============================================================================
  it('deve mostrar estado de loading durante o login', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockToken = 'valid-jwt-token'

    // Mock com delay para testar loading
    const { default: api } = await import('@/api/api')
    ;(api.post as any).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({
        data: {
          token: mockToken,
          user: { id: 'user-123', email: 'test@example.com' },
          type: 'member',
        },
      }), 100))
    )

    vi.mocked(jwtDecode).mockReturnValue({
      sub: 'user-123',
      email: 'test@example.com',
      branchId: 'branch-123',
      role: 'ADMINGERAL',
      iat: 1234567890,
      exp: 1234571490,
    } as any)

    // Act
    renderWithProviders(<Login />)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/senha/i), 'password123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    // Assert
    // Verifica se botão está desabilitado ou mostra loading
    const submitButton = screen.getByRole('button', { name: /entrando/i })
    expect(submitButton).toBeDisabled()

    // Aguarda conclusão
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled()
    }, { timeout: 200 })
  })
})
