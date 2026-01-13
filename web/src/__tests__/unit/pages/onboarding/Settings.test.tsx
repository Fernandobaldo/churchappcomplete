import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Settings from '@/pages/onboarding/Settings'
import { renderWithProviders } from '@/test/helpers'
import { mockApiResponse, resetApiMocks } from '@/test/mockApi'

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

describe('Settings - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetApiMocks()
    localStorage.clear()
  })

  // ============================================================================
  // TESTE 1: BASIC RENDER - Renderiza o step 1 (Roles e Permissões)
  // ============================================================================
  it('deve renderizar o step 1 (Roles e Permissões)', () => {
    // Arrange & Act
    renderWithProviders(<Settings />)

    // Assert
    const step1Elements = screen.getAllByText(/roles e permissões/i)
    expect(step1Elements.length).toBeGreaterThan(0)
    expect(screen.getByText(/administrador geral/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /criar roles/i })).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 2: PRIMARY INTERACTION - Avança para step 2 após criar roles
  // ============================================================================
  it('deve avançar para step 2 após criar roles', async () => {
    // Arrange
    const user = userEvent.setup()

    // Act
    renderWithProviders(<Settings />)

    const createRolesButton = screen.getByRole('button', { name: /criar roles/i })
    await user.click(createRolesButton)

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/ativar módulos/i)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // TESTE 3: PRIMARY INTERACTION - Permite selecionar/deselecionar módulos no step 2
  // ============================================================================
  it('deve permitir selecionar/deselecionar módulos no step 2', async () => {
    // Arrange
    const user = userEvent.setup()

    // Act
    renderWithProviders(<Settings />)

    await user.click(screen.getByRole('button', { name: /criar roles/i }))
    await waitFor(() => {
      expect(screen.getByText(/ativar módulos/i)).toBeInTheDocument()
    })

    const eventsCheckbox = screen.getByLabelText(/eventos/i)
    expect(eventsCheckbox).toBeChecked()

    await user.click(eventsCheckbox)

    // Assert
    expect(eventsCheckbox).not.toBeChecked()
  })

  // ============================================================================
  // TESTE 4: PRIMARY INTERACTION - Avança para step 3 (Convites) após selecionar módulos
  // ============================================================================
  it('deve avançar para step 3 (Convites) após selecionar módulos', async () => {
    // Arrange
    const user = userEvent.setup()

    // Act
    renderWithProviders(<Settings />)

    await user.click(screen.getByRole('button', { name: /criar roles/i }))
    await waitFor(() => {
      expect(screen.getByText(/ativar módulos/i)).toBeInTheDocument()
    }, { timeout: 2000 })

    await new Promise(resolve => setTimeout(resolve, 100))

    const continueButtons = screen.getAllByRole('button', { name: /continuar/i })
    const lastContinueButton = continueButtons[continueButtons.length - 1]
    await user.click(lastContinueButton)

    // Assert
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /enviar convites/i })).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  // ============================================================================
  // TESTE 5: PRIMARY INTERACTION - Navega para dashboard ao concluir
  // ============================================================================
  it('deve navegar para dashboard ao concluir onboarding', async () => {
    // Arrange
    const user = userEvent.setup()
    mockApiResponse('post', '/onboarding/progress/settings', { success: true })

    // Act
    renderWithProviders(<Settings />)

    // Step 1
    await user.click(screen.getByRole('button', { name: /criar roles/i }))
    await waitFor(() => {
      expect(screen.getByText(/ativar módulos/i)).toBeInTheDocument()
    }, { timeout: 2000 })

    // Step 2
    await new Promise(resolve => setTimeout(resolve, 100))
    const continueButtons = screen.getAllByRole('button', { name: /continuar/i })
    await user.click(continueButtons[continueButtons.length - 1])

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /enviar convites/i })).toBeInTheDocument()
    }, { timeout: 2000 })

    // Step 3 - Pular convites
    const skipButton = screen.getByRole('button', { name: /pular/i })
    await user.click(skipButton)

    // Assert
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/concluido')
    }, { timeout: 3000 })
  })
})
