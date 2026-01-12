import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Profile from '@/pages/Profile'
import { fixtures } from '@/test/fixtures'
import { renderWithProviders } from '@/test/renderWithProviders'
import { mockApiResponse, mockApiError, resetApiMocks } from '@/test/mockApi'
import api from '@/api/api'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'

vi.mock('@/api/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    defaults: {
      baseURL: 'http://localhost',
    },
  },
}))
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    info: vi.fn(),
  },
  Toaster: () => null,
}))

vi.mock('@/utils/authUtils', () => ({
  hasAccess: vi.fn(),
}))

const { mockUseAuthStore, mockSetUserFromToken, mockUpdateUser } = vi.hoisted(() => {
  const mockSetUserFromToken = vi.fn()
  const mockUpdateUser = vi.fn()
  const mockUseAuthStore = vi.fn(() => ({
    user: null,
    setUserFromToken: mockSetUserFromToken,
    updateUser: mockUpdateUser,
  }))
  ;(mockUseAuthStore as any).setState = vi.fn()
  return { mockUseAuthStore, mockSetUserFromToken, mockUpdateUser }
})

vi.mock('@/stores/authStore', () => ({
  useAuthStore: mockUseAuthStore,
}))

const mockPositions = [
  { id: 'pos-1', name: 'Pastor', isDefault: true },
  { id: 'pos-2', name: 'Obreiro', isDefault: true },
  { id: 'pos-3', name: 'Tesoureiro', isDefault: true },
]

const mockProfile = {
  id: 'member-123',
  name: 'Test User',
  email: 'test@example.com',
  phone: '11999999999',
  address: 'Rua Teste, 123',
  birthDate: '01/01/1990',
  positionId: null,
  position: null,
}

describe('Profile - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetApiMocks()
    ;(useAuthStore as any).mockReturnValue({
      user: fixtures.user(),
      setUserFromToken: mockSetUserFromToken,
      updateUser: mockUpdateUser,
    })

    mockApiResponse('get', '/members/me', mockProfile)
    mockApiResponse('get', '/positions', mockPositions)
    mockApiResponse('put', '/members/me', mockProfile)
  })

  // ============================================================================
  // TESTE 1: BASIC RENDER - Renderiza o formulário de perfil
  // ============================================================================
  it('deve renderizar o formulário de perfil', async () => {
    // Arrange & Act
    renderWithProviders(<Profile />, {
      authState: {
        user: fixtures.user(),
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      expect(screen.getByLabelText(/nome/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/telefone/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/endereço/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/cargo na igreja/i)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // TESTE 2: LOADING STATE - Carrega cargos disponíveis
  // ============================================================================
  it('deve carregar cargos disponíveis', async () => {
    // Arrange & Act
    renderWithProviders(<Profile />, {
      authState: {
        user: fixtures.user(),
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/positions')
    })

    await waitFor(() => {
      const select = screen.getByLabelText(/cargo na igreja/i)
      expect(select).toBeInTheDocument()
      expect(screen.getByText(/pastor/i)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // TESTE 3: VALIDATION - Valida campos obrigatórios
  // ============================================================================
  it('deve validar campos obrigatórios', async () => {
    // Arrange
    const user = userEvent.setup()

    // Act
    renderWithProviders(<Profile />, {
      authState: {
        user: fixtures.user(),
        token: 'token',
      },
    })

    await waitFor(() => {
      expect(screen.getByLabelText(/nome/i)).toBeInTheDocument()
    })

    const nameInput = screen.getByLabelText(/nome/i) as HTMLInputElement
    await user.tripleClick(nameInput)
    await user.keyboard('{Delete}')

    await waitFor(() => {
      expect(nameInput.value).toBe('')
    })

    const submitButton = screen.getByRole('button', { name: /salvar/i })
    await user.click(submitButton)

    // Assert
    await waitFor(() => {
      expect(api.put).not.toHaveBeenCalled()
    }, { timeout: 2000 })
  })

  // ============================================================================
  // TESTE 4: PRIMARY INTERACTION - Atualiza perfil com sucesso
  // ============================================================================
  it('deve atualizar perfil com sucesso', async () => {
    // Arrange
    const user = userEvent.setup()
    const updatedProfile = {
      ...mockProfile,
      name: 'Nome Atualizado',
    }
    mockApiResponse('put', '/members/me', updatedProfile)

    // Act
    renderWithProviders(<Profile />, {
      authState: {
        user: fixtures.user(),
        token: 'token',
      },
    })

    await waitFor(() => {
      expect(screen.getByLabelText(/nome/i)).toBeInTheDocument()
    })

    const nameInput = screen.getByLabelText(/nome/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Nome Atualizado')

    const submitButton = screen.getByRole('button', { name: /salvar/i })
    await user.click(submitButton)

    // Assert
    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalled()
    })
  })

  // ============================================================================
  // TESTE 5: PRIMARY INTERACTION - Permite fazer upload de avatar
  // ============================================================================
  it('deve permitir fazer upload de avatar', async () => {
    // Arrange
    const user = userEvent.setup()
    const file = new File(['test'], 'test.png', { type: 'image/png' })
    mockApiResponse('post', '/upload/avatar', { url: '/uploads/avatars/test.png' })
    mockApiResponse('put', '/members/me', { ...mockProfile, avatarUrl: '/uploads/avatars/test.png' })

    // Act
    renderWithProviders(<Profile />, {
      authState: {
        user: fixtures.user(),
        token: 'token',
      },
    })

    await waitFor(() => {
      expect(screen.getByLabelText(/foto de perfil/i)).toBeInTheDocument()
    })

    const avatarInput = document.querySelector('input[type="file"]')
    if (avatarInput) {
      await user.upload(avatarInput, file)

      const submitButton = screen.getByRole('button', { name: /salvar/i })
      await user.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/upload/avatar', expect.any(FormData), expect.any(Object))
      })
    }
  })
})
