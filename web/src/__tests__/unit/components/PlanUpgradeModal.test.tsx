import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PlanUpgradeModal from '@/components/PlanUpgradeModal'

const mockOnClose = vi.fn()

// Mock dos planos esperados pelos testes
const mockPlans = [
  {
    id: '1',
    name: 'Free',
    price: 0,
    maxMembers: 10,
    maxBranches: 1,
    features: ['Até 10 membros', '1 filial'],
    isActive: true,
  },
  {
    id: '2',
    name: 'Básico',
    price: 29.9,
    maxMembers: 50,
    maxBranches: 3,
    features: ['Até 50 membros', '3 filiais'],
    isActive: true,
  },
  {
    id: '3',
    name: 'Premium',
    price: 79.9,
    maxMembers: 200,
    maxBranches: 10,
    features: ['Até 200 membros', '10 filiais'],
    isActive: true,
  },
  {
    id: '4',
    name: 'Enterprise',
    price: 199.9,
    maxMembers: null,
    maxBranches: null,
    features: ['Membros ilimitados', 'Filiais ilimitadas'],
    isActive: true,
  },
]

// Mock da API
vi.mock('@/api/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
  plansApi: {
    getAll: vi.fn(() => Promise.resolve(mockPlans)),
  },
  subscriptionApi: {
    checkout: vi.fn(() => Promise.resolve({ subscription: { checkoutUrl: null } })),
  },
}))

describe('PlanUpgradeModal - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
      value: {
        reload: vi.fn(),
        href: '',
      },
      writable: true,
    })
  })

  // ============================================================================
  // TESTE 1: EMPTY STATE - Não renderiza quando isOpen é false
  // ============================================================================
  it('não deve renderizar quando isOpen é false', () => {
    // Arrange & Act
    render(<PlanUpgradeModal isOpen={false} onClose={mockOnClose} />)

    // Assert
    expect(screen.queryByText('Upgrade do Plano')).not.toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 2: BASIC RENDER - Renderiza quando isOpen é true
  // ============================================================================
  it('deve renderizar quando isOpen é true', () => {
    // Arrange & Act
    render(<PlanUpgradeModal isOpen={true} onClose={mockOnClose} />)

    // Assert
    expect(screen.getByText('Upgrade do Plano')).toBeInTheDocument()
    expect(
      screen.getByText(/Seu plano atual atingiu o limite de membros/)
    ).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 3: BASIC RENDER - Exibe informações do plano atual quando fornecido
  // ============================================================================
  it('deve exibir informações do plano atual quando fornecido', () => {
    // Arrange
    const currentPlan = {
      name: 'Free',
      maxMembers: 10,
    }

    // Act
    render(
      <PlanUpgradeModal
        isOpen={true}
        onClose={mockOnClose}
        currentPlan={currentPlan}
      />
    )

    // Assert
    expect(screen.getByText('Plano Atual:')).toBeInTheDocument()
    const freeElements = screen.getAllByText('Free')
    expect(freeElements.length).toBeGreaterThan(0)
    expect(screen.getByText(/Limite: 10 membros/)).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 4: PRIMARY INTERACTION - Exibe todos os planos disponíveis
  // ============================================================================
  it('deve exibir todos os planos disponíveis', async () => {
    // Arrange & Act
    render(<PlanUpgradeModal isOpen={true} onClose={mockOnClose} />)

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Free')).toBeInTheDocument()
    })

    expect(screen.getByText('Básico')).toBeInTheDocument()
    expect(screen.getByText('Premium')).toBeInTheDocument()
    expect(screen.getByText('Enterprise')).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 5: UI FEATURE - Destaca plano popular com badge
  // ============================================================================
  it('deve destacar plano popular com badge', async () => {
    // Arrange & Act
    render(<PlanUpgradeModal isOpen={true} onClose={mockOnClose} />)

    // Assert
    await waitFor(() => {
      expect(screen.getByText('POPULAR')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // TESTE 6: STATE CHECK - Marca plano atual como desabilitado
  // ============================================================================
  it('deve marcar plano atual como desabilitado', async () => {
    // Arrange
    const currentPlan = {
      name: 'Free',
      maxMembers: 10,
    }

    // Act
    render(
      <PlanUpgradeModal
        isOpen={true}
        onClose={mockOnClose}
        currentPlan={currentPlan}
      />
    )

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Free')).toBeInTheDocument()
    })

    const freePlanHeading = screen.getByRole('heading', { name: 'Free' })
    expect(freePlanHeading).toBeInTheDocument()
    
    const freePlanCard = freePlanHeading.closest('div[class*="border"]')
    expect(freePlanCard).toBeInTheDocument()
    
    const freePlanButton = freePlanCard?.querySelector('button')
    expect(freePlanButton).toBeInTheDocument()
    expect(freePlanButton).toHaveTextContent('Plano Atual')
    expect(freePlanButton).toBeDisabled()
  })

  // ============================================================================
  // TESTE 7: PRIMARY INTERACTION - Fecha modal ao clicar no botão de fechar
  // ============================================================================
  it('deve fechar modal ao clicar no botão de fechar', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<PlanUpgradeModal isOpen={true} onClose={mockOnClose} />)

    // Act
    const closeButtons = screen.getAllByRole('button')
    const closeButton = closeButtons.find(button => {
      const buttonText = button.textContent || ''
      return buttonText === '' || buttonText.trim() === ''
    })
    
    expect(closeButton).toBeInTheDocument()
    
    if (closeButton) {
      await user.click(closeButton)
    }

    // Assert
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  // ============================================================================
  // TESTE 8: BASIC RENDER - Exibe preços dos planos corretamente
  // ============================================================================
  it('deve exibir preços dos planos corretamente', async () => {
    // Arrange & Act
    render(<PlanUpgradeModal isOpen={true} onClose={mockOnClose} />)

    // Assert
    await waitFor(() => {
      expect(screen.getByText('R$ 0.00')).toBeInTheDocument()
    })

    expect(screen.getByText('R$ 29.90')).toBeInTheDocument()
    expect(screen.getByText('R$ 79.90')).toBeInTheDocument()
    expect(screen.getByText('R$ 199.90')).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 9: BASIC RENDER - Exibe features de cada plano
  // ============================================================================
  it('deve exibir features de cada plano', async () => {
    // Arrange & Act
    render(<PlanUpgradeModal isOpen={true} onClose={mockOnClose} />)

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Até 10 membros')).toBeInTheDocument()
    })

    expect(screen.getByText('Até 50 membros')).toBeInTheDocument()
    expect(screen.getByText('Até 200 membros')).toBeInTheDocument()
    expect(screen.getByText('Membros ilimitados')).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 10: PRIMARY INTERACTION - Permite selecionar um plano diferente do atual
  // ============================================================================
  it('deve permitir selecionar um plano diferente do atual', async () => {
    // Arrange
    const user = userEvent.setup()
    const currentPlan = {
      name: 'Free',
      maxMembers: 10,
    }

    render(
      <PlanUpgradeModal
        isOpen={true}
        onClose={mockOnClose}
        currentPlan={currentPlan}
      />
    )

    // Act
    await waitFor(() => {
      expect(screen.getByText('Básico')).toBeInTheDocument()
    })

    const basicPlanHeading = screen.getByRole('heading', { name: 'Básico' })
    expect(basicPlanHeading).toBeInTheDocument()
    
    const basicPlanCard = basicPlanHeading.closest('div[class*="border"]')
    expect(basicPlanCard).toBeInTheDocument()
    
    const basicPlanButton = basicPlanCard?.querySelector('button:not([disabled])')
    
    expect(basicPlanButton).toBeInTheDocument()
    expect(basicPlanButton).toHaveTextContent('Escolher Plano')
    
    if (basicPlanButton) {
      await user.click(basicPlanButton)
    }

    // Assert
    expect(basicPlanButton).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 11: BASIC RENDER - Exibe mensagem de dica no footer
  // ============================================================================
  it('deve exibir mensagem de dica no footer', () => {
    // Arrange & Act
    render(<PlanUpgradeModal isOpen={true} onClose={mockOnClose} />)

    // Assert
    expect(
      screen.getByText(/Você pode fazer upgrade a qualquer momento/)
    ).toBeInTheDocument()
  })
})




    })

    const freePlanHeading = screen.getByRole('heading', { name: 'Free' })
    expect(freePlanHeading).toBeInTheDocument()
    
    const freePlanCard = freePlanHeading.closest('div[class*="border"]')
    expect(freePlanCard).toBeInTheDocument()
    
    const freePlanButton = freePlanCard?.querySelector('button')
    expect(freePlanButton).toBeInTheDocument()
    expect(freePlanButton).toHaveTextContent('Plano Atual')
    expect(freePlanButton).toBeDisabled()
  })

  // ============================================================================
  // TESTE 7: PRIMARY INTERACTION - Fecha modal ao clicar no botão de fechar
  // ============================================================================
  it('deve fechar modal ao clicar no botão de fechar', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<PlanUpgradeModal isOpen={true} onClose={mockOnClose} />)

    // Act
    const closeButtons = screen.getAllByRole('button')
    const closeButton = closeButtons.find(button => {
      const buttonText = button.textContent || ''
      return buttonText === '' || buttonText.trim() === ''
    })
    
    expect(closeButton).toBeInTheDocument()
    
    if (closeButton) {
      await user.click(closeButton)
    }

    // Assert
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  // ============================================================================
  // TESTE 8: BASIC RENDER - Exibe preços dos planos corretamente
  // ============================================================================
  it('deve exibir preços dos planos corretamente', async () => {
    // Arrange & Act
    render(<PlanUpgradeModal isOpen={true} onClose={mockOnClose} />)

    // Assert
    await waitFor(() => {
      expect(screen.getByText('R$ 0.00')).toBeInTheDocument()
    })

    expect(screen.getByText('R$ 29.90')).toBeInTheDocument()
    expect(screen.getByText('R$ 79.90')).toBeInTheDocument()
    expect(screen.getByText('R$ 199.90')).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 9: BASIC RENDER - Exibe features de cada plano
  // ============================================================================
  it('deve exibir features de cada plano', async () => {
    // Arrange & Act
    render(<PlanUpgradeModal isOpen={true} onClose={mockOnClose} />)

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Até 10 membros')).toBeInTheDocument()
    })

    expect(screen.getByText('Até 50 membros')).toBeInTheDocument()
    expect(screen.getByText('Até 200 membros')).toBeInTheDocument()
    expect(screen.getByText('Membros ilimitados')).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 10: PRIMARY INTERACTION - Permite selecionar um plano diferente do atual
  // ============================================================================
  it('deve permitir selecionar um plano diferente do atual', async () => {
    // Arrange
    const user = userEvent.setup()
    const currentPlan = {
      name: 'Free',
      maxMembers: 10,
    }

    render(
      <PlanUpgradeModal
        isOpen={true}
        onClose={mockOnClose}
        currentPlan={currentPlan}
      />
    )

    // Act
    await waitFor(() => {
      expect(screen.getByText('Básico')).toBeInTheDocument()
    })

    const basicPlanHeading = screen.getByRole('heading', { name: 'Básico' })
    expect(basicPlanHeading).toBeInTheDocument()
    
    const basicPlanCard = basicPlanHeading.closest('div[class*="border"]')
    expect(basicPlanCard).toBeInTheDocument()
    
    const basicPlanButton = basicPlanCard?.querySelector('button:not([disabled])')
    
    expect(basicPlanButton).toBeInTheDocument()
    expect(basicPlanButton).toHaveTextContent('Escolher Plano')
    
    if (basicPlanButton) {
      await user.click(basicPlanButton)
    }

    // Assert
    expect(basicPlanButton).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 11: BASIC RENDER - Exibe mensagem de dica no footer
  // ============================================================================
  it('deve exibir mensagem de dica no footer', () => {
    // Arrange & Act
    render(<PlanUpgradeModal isOpen={true} onClose={mockOnClose} />)

    // Assert
    expect(
      screen.getByText(/Você pode fazer upgrade a qualquer momento/)
    ).toBeInTheDocument()
  })
})



