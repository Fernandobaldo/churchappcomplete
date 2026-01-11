import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Start from '@/pages/onboarding/Start'
import { renderWithProviders } from '@/test/helpers'
import { mockApiResponse, resetApiMocks } from '@/test/mockApi'

vi.mock('@/api/api')
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('Start - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetApiMocks() // Resetar mocks antes de configurar novos
    localStorage.clear()
    // Mock da chamada API /onboarding/state que é feita no useEffect do componente
    mockApiResponse('get', '/onboarding/state', { status: 'NEW' })
  })

  // ============================================================================
  // TESTE 1: BASIC RENDER - Renderiza as três opções de estrutura
  // ============================================================================
  it('deve renderizar as três opções de estrutura', async () => {
    // Arrange & Act
    renderWithProviders(<Start />)

    // Assert - Aguardar componente sair do estado de loading após useEffect completar
    await waitFor(() => {
      expect(screen.getByText('Criar uma igreja')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Criar igreja com filiais')).toBeInTheDocument()
    expect(screen.getByText('Entrar em uma igreja existente')).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 2: PRIMARY INTERACTION - Permite selecionar estrutura simples
  // ============================================================================
  it('deve permitir selecionar estrutura simples', async () => {
    // Arrange
    const user = userEvent.setup()

    // Act
    renderWithProviders(<Start />)

    // Aguardar componente sair do estado de loading antes de interagir
    await waitFor(() => {
      expect(screen.getByText('Criar uma igreja')).toBeInTheDocument()
    })

    const simpleOption = screen.getByText('Criar uma igreja').closest('button')
    await user.click(simpleOption!)

    const continueButton = screen.getByRole('button', { name: /continuar/i })
    expect(continueButton).not.toBeDisabled()
    await user.click(continueButton)

    // Assert
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/church')
    }, { timeout: 2000 })

    expect(localStorage.getItem('onboarding_structure')).toBe('simple')
  })

  // ============================================================================
  // TESTE 3: PRIMARY INTERACTION - Permite selecionar estrutura com filiais
  // ============================================================================
  it('deve permitir selecionar estrutura com filiais', async () => {
    // Arrange
    const user = userEvent.setup()

    // Act
    renderWithProviders(<Start />)

    // Aguardar componente sair do estado de loading antes de interagir
    await waitFor(() => {
      expect(screen.getByText('Criar igreja com filiais')).toBeInTheDocument()
    })

    const branchesOption = screen.getByText('Criar igreja com filiais').closest('button')
    await user.click(branchesOption!)

    const continueButton = screen.getByRole('button', { name: /continuar/i })
    await user.click(continueButton)

    // Assert
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/church')
    }, { timeout: 2000 })

    expect(localStorage.getItem('onboarding_structure')).toBe('branches')
  })

  // ============================================================================
  // TESTE 4: EMPTY STATE - Desabilita botão continuar quando nenhuma opção está selecionada
  // ============================================================================
  it('deve desabilitar botão continuar quando nenhuma opção está selecionada', async () => {
    // Arrange & Act
    renderWithProviders(<Start />)

    // Assert - Aguardar componente sair do estado de loading antes de verificar botão
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continuar/i })).toBeInTheDocument()
    })

    const continueButton = screen.getByRole('button', { name: /continuar/i })
    expect(continueButton).toBeDisabled()
  })

  // ============================================================================
  // TESTE 5: PRIMARY INTERACTION - Navega de volta ao clicar em voltar
  // ============================================================================
  it('deve navegar de volta ao clicar em voltar', async () => {
    // Arrange
    const user = userEvent.setup()

    // Act
    renderWithProviders(<Start />)

    // Aguardar componente sair do estado de loading antes de interagir
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /voltar/i })).toBeInTheDocument()
    })

    const backButton = screen.getByRole('button', { name: /voltar/i })
    await user.click(backButton)

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('/onboarding/bem-vindo')
  })
})
