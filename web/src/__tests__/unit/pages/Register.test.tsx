import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Register from '@/pages/Register'
import { fixtures } from '@/test/fixtures'
import { renderWithProviders, generateMockToken } from '@/test/helpers'
import { mockApiResponse, mockApiError } from '@/test/mockApi'

vi.mock('@/api/api', async () => {
  const { apiMock } = await import('@/test/apiMock')
  return { default: apiMock }
})
const { mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}))
vi.mock('react-hot-toast', () => ({
  default: {
    success: mockToastSuccess,
    error: mockToastError,
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

const mockSetUserFromToken = vi.fn()
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    setUserFromToken: mockSetUserFromToken,
  })),
}))

describe('Register - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // TESTE 1: BASIC RENDER - Renderiza o formulário de registro
  // ============================================================================
  it('deve renderizar o formulário de registro', () => {
    // Arrange & Act
    renderWithProviders(<Register />)

    // Assert
    expect(screen.getByLabelText(/nome completo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/nome da igreja/i)).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 2: PRIMARY INTERACTION - Permite selecionar arquivo de avatar
  // ============================================================================
  it('deve permitir selecionar arquivo de avatar', async () => {
    // Arrange
    const user = userEvent.setup()
    const file = new File(['test'], 'test.png', { type: 'image/png' })

    // Act
    renderWithProviders(<Register />)

    const avatarInput = screen.getByLabelText(/foto de perfil/i)
    await user.upload(avatarInput, file)

    // Assert
    await waitFor(() => {
      const preview = document.querySelector('img[alt="Preview"]')
      expect(preview).toBeInTheDocument()
    })
  })

  // ============================================================================
  // TESTE 3: PRIMARY INTERACTION - Faz upload de avatar após criar conta
  // ============================================================================
  it('deve fazer upload de avatar após criar conta', async () => {
    // Arrange
    const user = userEvent.setup()
    const file = new File(['test'], 'test.png', { type: 'image/png' })
    const mockToken = generateMockToken({
      sub: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
    })

    mockApiResponse('post', '/register', { token: mockToken })
    mockApiResponse('post', '/upload/avatar', { url: '/uploads/avatars/test.png' })

    // Act
    renderWithProviders(<Register />)

    await user.type(screen.getByLabelText(/nome completo/i), 'Test User')
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/senha/i), 'password123')
    await user.type(screen.getByLabelText(/nome da igreja/i), 'Igreja Teste')

    const avatarInput = screen.getByLabelText(/foto de perfil/i)
    await user.upload(avatarInput, file)

    const submitButton = screen.getByRole('button', { name: /criar conta/i })
    await user.click(submitButton)

    // Assert
    await waitFor(() => {
      expect(mockSetUserFromToken).toHaveBeenCalled()
    })
  })

  // ============================================================================
  // TESTE 4: VALIDATION - Valida tamanho máximo do arquivo de avatar
  // ============================================================================
  it('deve validar tamanho máximo do arquivo de avatar', async () => {
    // Arrange
    const user = userEvent.setup()
    // Criar arquivo maior que 5MB
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.png', { type: 'image/png' })

    // Act
    renderWithProviders(<Register />)

    const avatarInput = screen.getByLabelText(/foto de perfil/i)
    await user.upload(avatarInput, largeFile)

    // Assert
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('A imagem deve ter no máximo 5MB')
    })
  })

  // ============================================================================
  // TESTE 5: ERROR STATE - Exibe erro ao falhar registro
  // ============================================================================
  it('deve exibir erro quando falha ao criar conta', async () => {
    // Arrange
    const user = userEvent.setup()
    mockApiError('post', '/register', {
      message: 'Este email já está cadastrado',
      status: 409,
    })

    // Act
    renderWithProviders(<Register />)

    await user.type(screen.getByLabelText(/nome completo/i), 'Test User')
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/senha/i), 'password123')
    await user.type(screen.getByLabelText(/nome da igreja/i), 'Igreja Teste')

    const submitButton = screen.getByRole('button', { name: /criar conta/i })
    await user.click(submitButton)

    // Assert
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalled()
    })
  })
})

