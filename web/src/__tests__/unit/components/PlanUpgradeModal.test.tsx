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

describe('PlanUpgradeModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('não deve renderizar quando isOpen é false', () => {
    render(<PlanUpgradeModal isOpen={false} onClose={mockOnClose} />)
    expect(screen.queryByText('Upgrade do Plano')).not.toBeInTheDocument()
  })

  it('deve renderizar quando isOpen é true', () => {
    render(<PlanUpgradeModal isOpen={true} onClose={mockOnClose} />)
    expect(screen.getByText('Upgrade do Plano')).toBeInTheDocument()
    expect(
      screen.getByText(/Seu plano atual atingiu o limite de membros/)
    ).toBeInTheDocument()
  })

  it('deve exibir informações do plano atual quando fornecido', () => {
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

    // O texto está quebrado em múltiplos elementos, então vamos verificar cada parte
    expect(screen.getByText('Plano Atual:')).toBeInTheDocument()
    // "Free" aparece múltiplas vezes, então vamos verificar que pelo menos uma existe
    const freeElements = screen.getAllByText('Free')
    expect(freeElements.length).toBeGreaterThan(0)
    expect(screen.getByText(/Limite: 10 membros/)).toBeInTheDocument()
  })

  it('deve exibir todos os planos disponíveis', async () => {
    render(<PlanUpgradeModal isOpen={true} onClose={mockOnClose} />)

    // Aguardar o carregamento dos planos
    await waitFor(() => {
      expect(screen.getByText('Free')).toBeInTheDocument()
    })

    expect(screen.getByText('Básico')).toBeInTheDocument()
    expect(screen.getByText('Premium')).toBeInTheDocument()
    expect(screen.getByText('Enterprise')).toBeInTheDocument()
  })

  it('deve destacar plano popular com badge', async () => {
    render(<PlanUpgradeModal isOpen={true} onClose={mockOnClose} />)

    // Aguardar o carregamento dos planos
    await waitFor(() => {
      expect(screen.getByText('POPULAR')).toBeInTheDocument()
    })
  })

  it('deve marcar plano atual como desabilitado', async () => {
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

    // Aguardar o carregamento dos planos
    await waitFor(() => {
      expect(screen.getByText('Free')).toBeInTheDocument()
    })

    // Encontrar o heading do plano Free dentro do card
    const freePlanHeading = screen.getByRole('heading', { name: 'Free' })
    expect(freePlanHeading).toBeInTheDocument()
    
    // Encontrar o card do plano Free (o div pai que contém o heading)
    const freePlanCard = freePlanHeading.closest('div[class*="border"]')
    expect(freePlanCard).toBeInTheDocument()
    
    // Encontrar o botão dentro do card
    const freePlanButton = freePlanCard?.querySelector('button')
    expect(freePlanButton).toBeInTheDocument()
    expect(freePlanButton).toHaveTextContent('Plano Atual')
    expect(freePlanButton).toBeDisabled()
  })

  it('deve fechar modal ao clicar no botão de fechar', async () => {
    const user = userEvent.setup()
    render(<PlanUpgradeModal isOpen={true} onClose={mockOnClose} />)

    // O botão de fechar não tem nome acessível, então vamos procurar pelo botão sem nome
    const closeButtons = screen.getAllByRole('button')
    const closeButton = closeButtons.find(button => {
      const buttonText = button.textContent || ''
      return buttonText === '' || buttonText.trim() === ''
    })
    
    expect(closeButton).toBeInTheDocument()
    
    if (closeButton) {
      await user.click(closeButton)
    }

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('deve exibir preços dos planos corretamente', async () => {
    render(<PlanUpgradeModal isOpen={true} onClose={mockOnClose} />)

    // Aguardar o carregamento dos planos
    await waitFor(() => {
      expect(screen.getByText('R$ 0.00')).toBeInTheDocument()
    })

    expect(screen.getByText('R$ 29.90')).toBeInTheDocument()
    expect(screen.getByText('R$ 79.90')).toBeInTheDocument()
    expect(screen.getByText('R$ 199.90')).toBeInTheDocument()
  })

  it('deve exibir features de cada plano', async () => {
    render(<PlanUpgradeModal isOpen={true} onClose={mockOnClose} />)

    // Aguardar o carregamento dos planos
    await waitFor(() => {
      expect(screen.getByText('Até 10 membros')).toBeInTheDocument()
    })

    expect(screen.getByText('Até 50 membros')).toBeInTheDocument()
    expect(screen.getByText('Até 200 membros')).toBeInTheDocument()
    expect(screen.getByText('Membros ilimitados')).toBeInTheDocument()
  })

  it('deve permitir selecionar um plano diferente do atual', async () => {
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

    // Aguardar o carregamento dos planos
    await waitFor(() => {
      expect(screen.getByText('Básico')).toBeInTheDocument()
    })

    // Encontrar o heading do plano Básico
    const basicPlanHeading = screen.getByRole('heading', { name: 'Básico' })
    expect(basicPlanHeading).toBeInTheDocument()
    
    // Encontrar o card do plano Básico (o div pai que contém o heading)
    const basicPlanCard = basicPlanHeading.closest('div[class*="border"]')
    expect(basicPlanCard).toBeInTheDocument()
    
    // Encontrar o botão dentro do card do plano Básico
    // O botão deve ter o texto "Escolher Plano" e não estar desabilitado
    const basicPlanButton = basicPlanCard?.querySelector('button:not([disabled])')
    
    expect(basicPlanButton).toBeInTheDocument()
    expect(basicPlanButton).toHaveTextContent('Escolher Plano')
    
    if (basicPlanButton) {
      await user.click(basicPlanButton)
    }

    // Verificar que o botão foi clicado (mock do upgrade será chamado)
    // Como é mockado, apenas verificamos que não há erro
    expect(basicPlanButton).toBeInTheDocument()
  })

  it('deve exibir mensagem de dica no footer', () => {
    render(<PlanUpgradeModal isOpen={true} onClose={mockOnClose} />)

    expect(
      screen.getByText(/Você pode fazer upgrade a qualquer momento/)
    ).toBeInTheDocument()
  })
})



