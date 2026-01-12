import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Header from '@/components/Header'
import { useAuthStore } from '@/stores/authStore'
import { fixtures } from '@/test/fixtures'
import { renderWithProviders } from '@/test/helpers'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const { mockToastSuccess } = vi.hoisted(() => ({
  mockToastSuccess: vi.fn(),
}))
vi.mock('react-hot-toast', () => ({
  default: {
    success: mockToastSuccess,
    error: vi.fn(),
  },
}))

describe('Header - Unit Tests', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null })
    vi.clearAllMocks()
  })

  // ============================================================================
  // TESTE 1: BASIC RENDER - Renderiza nome da aplicação
  // ============================================================================
  it('deve renderizar o nome da aplicação', () => {
    // Arrange
    const mockUser = fixtures.user()

    // Act
    renderWithProviders(<Header />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    expect(screen.getByText('ChurchPulse')).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 2: BASIC RENDER - Exibe nome do usuário quando logado
  // ============================================================================
  it('deve exibir o nome do usuário quando logado', () => {
    // Arrange
    const mockUser = fixtures.user({ name: 'João Silva' })

    // Act
    renderWithProviders(<Header />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    expect(screen.getByText('João Silva')).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 3: BASIC RENDER - Exibe botão de logout
  // ============================================================================
  it('deve exibir botão de logout', () => {
    // Arrange
    const mockUser = fixtures.user()

    // Act
    renderWithProviders(<Header />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    const logoutButton = screen.getByTitle('Sair')
    expect(logoutButton).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 4: PRIMARY INTERACTION - Faz logout ao clicar no botão
  // ============================================================================
  it('deve fazer logout ao clicar no botão', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockUser = fixtures.user()
    useAuthStore.setState({ user: mockUser, token: 'token' })

    renderWithProviders(<Header />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Act
    const logoutButton = screen.getByTitle('Sair')
    await user.click(logoutButton)

    // Assert
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().token).toBeNull()
    expect(mockNavigate).toHaveBeenCalledWith('/login')
    expect(mockToastSuccess).toHaveBeenCalledWith('Logout realizado com sucesso!')
  })

  // ============================================================================
  // TESTE 5: ERROR STATE - Não exibe nome quando não há usuário
  // ============================================================================
  it('não deve exibir nome do usuário quando não há usuário logado', () => {
    // Arrange & Act
    renderWithProviders(<Header />, {
      authState: {
        user: null,
        token: null,
      },
    })

    // Assert
    expect(screen.getByText('ChurchPulse')).toBeInTheDocument()
    // O nome do usuário não deve estar visível
    const userNameElements = screen.queryAllByText(/João|Silva|Test User/i)
    expect(userNameElements.length).toBe(0)
  })
})



