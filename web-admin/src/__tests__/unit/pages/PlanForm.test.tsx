import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { PlanForm } from '../../../pages/Plans/PlanForm'
import { plansApi } from '../../../api/adminApi'
import toast from 'react-hot-toast'

vi.mock('../../../api/adminApi')
vi.mock('react-hot-toast')
const mockNavigate = vi.fn()
const mockUseParams = vi.fn(() => ({}))
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockUseParams(),
  }
})

describe('PlanForm - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseParams.mockReturnValue({})
    ;(plansApi.getAll as any).mockResolvedValue({
      plans: [],
      availableFeatures: [
        { id: 'events', label: 'Eventos', description: 'Gerencie eventos' },
        { id: 'members', label: 'Membros', description: 'Gerencie membros' },
      ],
    })
  })

  it('deve renderizar formulário de criação', async () => {
    render(
      <BrowserRouter>
        <PlanForm />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Criar Novo Plano')).toBeInTheDocument()
    })

    expect(screen.getByTestId('plan-form-name')).toBeInTheDocument()
    expect(screen.getByTestId('plan-form-price')).toBeInTheDocument()
  })

  it('deve validar nome obrigatório', async () => {
    const user = userEvent.setup()
    render(
      <BrowserRouter>
        <PlanForm />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Criar Novo Plano')).toBeInTheDocument()
    })

    // Preenche apenas o preço, mas não o nome
    const priceInput = screen.getByTestId('plan-form-price')
    await user.clear(priceInput)
    await user.type(priceInput, '99.99')

    // Seleciona uma feature para passar na validação de features
    const featureCheckbox = screen.getByLabelText(/eventos/i)
    await user.click(featureCheckbox)

    // Remove required e desabilita validação HTML5 para testar validação JavaScript
    const nameInput = screen.getByTestId('plan-form-name') as HTMLInputElement
    nameInput.removeAttribute('required')
    nameInput.value = '' // Garante que está vazio

    // Desabilita validação HTML5 no formulário
    const form = screen.getByTestId('plan-form') as HTMLFormElement
    form.noValidate = true

    const submitButton = screen.getByTestId('plan-form-submit')
    await user.click(submitButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Nome do plano é obrigatório')
    }, { timeout: 3000 })
  })

  it('deve validar preço não negativo', async () => {
    const user = userEvent.setup()
    render(
      <BrowserRouter>
        <PlanForm />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Criar Novo Plano')).toBeInTheDocument()
    })

    const nameInput = screen.getByTestId('plan-form-name')
    const priceInput = screen.getByTestId('plan-form-price') as HTMLInputElement

    await user.type(nameInput, 'Test Plan')
    
    // Seleciona uma feature primeiro para passar na validação de features
    const featureCheckbox = screen.getByLabelText(/eventos/i)
    await user.click(featureCheckbox)

    // Desabilita validação HTML5 no formulário e no input
    const form = screen.getByTestId('plan-form') as HTMLFormElement
    form.noValidate = true
    priceInput.removeAttribute('min')
    
    // Limpa o input e define valor negativo usando fireEvent
    await user.clear(priceInput)
    fireEvent.change(priceInput, { target: { value: '-10' } })
    fireEvent.input(priceInput, { target: { value: '-10' } })

    const submitButton = screen.getByTestId('plan-form-submit')
    await user.click(submitButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Preço deve ser maior ou igual a zero')
    }, { timeout: 3000 })
  })

  it('deve validar que pelo menos uma feature é selecionada', async () => {
    const user = userEvent.setup()
    render(
      <BrowserRouter>
        <PlanForm />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Criar Novo Plano')).toBeInTheDocument()
    })

    const nameInput = screen.getByTestId('plan-form-name')
    const priceInput = screen.getByTestId('plan-form-price')

    await user.type(nameInput, 'Test Plan')
    await user.type(priceInput, '99.99')

    const submitButton = screen.getByTestId('plan-form-submit')
    await user.click(submitButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Selecione pelo menos uma feature')
    })
  })

  it('deve criar plano quando formulário é válido', async () => {
    const user = userEvent.setup()
    ;(plansApi.create as any).mockResolvedValue({
      id: 'new-id',
      name: 'Test Plan',
      price: 99.99,
    })

    render(
      <BrowserRouter>
        <PlanForm />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Criar Novo Plano')).toBeInTheDocument()
    })

    const nameInput = screen.getByTestId('plan-form-name')
    const priceInput = screen.getByTestId('plan-form-price')

    await user.type(nameInput, 'Test Plan')
    await user.type(priceInput, '99.99')

    // Seleciona uma feature
    const featureCheckbox = screen.getByLabelText(/eventos/i)
    await user.click(featureCheckbox)

    const submitButton = screen.getByTestId('plan-form-submit')
    await user.click(submitButton)

    await waitFor(() => {
      expect(plansApi.create).toHaveBeenCalledWith({
        name: 'Test Plan',
        price: 99.99,
        features: ['events'],
        maxBranches: undefined,
        maxMembers: undefined,
      })
    })
  })

  describe('Edição de Plano', () => {
    const mockPlan = {
      id: 'plan-123',
      name: 'Plano Original',
      price: 49.99,
      features: ['events', 'members'],
      maxBranches: 5,
      maxMembers: 100,
      isActive: true,
    }

    beforeEach(() => {
      vi.clearAllMocks()
      ;(plansApi.getAll as any).mockResolvedValue({
        plans: [],
        availableFeatures: [
          { id: 'events', label: 'Eventos', description: 'Gerencie eventos' },
          { id: 'members', label: 'Membros', description: 'Gerencie membros' },
          { id: 'finances', label: 'Finanças', description: 'Controle financeiro' },
          { id: 'advanced_reports', label: 'Relatórios Avançados', description: 'Relatórios detalhados' },
        ],
      })
      ;(plansApi.getById as any).mockResolvedValue(mockPlan)
    })

    it('deve carregar dados do plano ao editar', async () => {
      mockUseParams.mockReturnValue({ id: 'plan-123' })

      render(
        <BrowserRouter>
          <PlanForm />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Editar Plano')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(plansApi.getById).toHaveBeenCalledWith('plan-123')
      })

      expect(screen.getByTestId('plan-form-name')).toHaveValue('Plano Original')
      expect(screen.getByTestId('plan-form-price')).toHaveValue(49.99)
      expect(screen.getByTestId('plan-form-max-branches')).toHaveValue(5)
      expect(screen.getByTestId('plan-form-max-members')).toHaveValue(100)
      expect(screen.getByTestId('plan-form-is-active')).toBeChecked()
    })

    it('deve editar todos os campos do plano e validar atualização', async () => {
      const user = userEvent.setup()
      const updatedPlan = {
        ...mockPlan,
        name: 'Plano Atualizado',
        price: 99.99,
        features: ['events', 'members', 'finances'],
        maxBranches: 10,
        maxMembers: 500,
        isActive: false,
      }

      ;(plansApi.update as any).mockResolvedValue(updatedPlan)
      mockUseParams.mockReturnValue({ id: 'plan-123' })

      render(
        <BrowserRouter>
          <PlanForm />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Editar Plano')).toBeInTheDocument()
      })

      // Aguarda carregar os dados
      await waitFor(() => {
        expect(screen.getByTestId('plan-form-name')).toHaveValue('Plano Original')
      })

      // Edita nome
      const nameInput = screen.getByTestId('plan-form-name')
      await user.clear(nameInput)
      await user.type(nameInput, 'Plano Atualizado')

      // Edita preço
      const priceInput = screen.getByTestId('plan-form-price')
      await user.clear(priceInput)
      await user.type(priceInput, '99.99')

      // Edita máximo de filiais
      const maxBranchesInput = screen.getByTestId('plan-form-max-branches')
      await user.clear(maxBranchesInput)
      await user.type(maxBranchesInput, '10')

      // Edita máximo de membros
      const maxMembersInput = screen.getByTestId('plan-form-max-members')
      await user.clear(maxMembersInput)
      await user.type(maxMembersInput, '500')

      // Desmarca checkbox de ativo
      const isActiveCheckbox = screen.getByTestId('plan-form-is-active')
      await user.click(isActiveCheckbox)

      // Adiciona nova feature
      const financesCheckbox = screen.getByLabelText(/finanças/i)
      await user.click(financesCheckbox)

      // Submete o formulário
      const submitButton = screen.getByTestId('plan-form-submit')
      await user.click(submitButton)

      // Valida que a API foi chamada com todos os campos atualizados
      await waitFor(() => {
        expect(plansApi.update).toHaveBeenCalledWith('plan-123', {
          name: 'Plano Atualizado',
          price: 99.99,
          features: ['events', 'members', 'finances'],
          maxBranches: 10,
          maxMembers: 500,
          isActive: false,
        })
      })

      // Valida que o toast de sucesso foi exibido
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Plano atualizado com sucesso')
      })

      // Valida que navegou para a lista
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/admin/plans-subscriptions')
      })
    })

    it('deve remover features ao editar plano', async () => {
      const user = userEvent.setup()
      const updatedPlan = {
        ...mockPlan,
        features: ['events'],
      }

      ;(plansApi.update as any).mockResolvedValue(updatedPlan)
      mockUseParams.mockReturnValue({ id: 'plan-123' })

      render(
        <BrowserRouter>
          <PlanForm />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Editar Plano')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByTestId('plan-form-name')).toHaveValue('Plano Original')
      })

      // Remove feature 'members' (desmarca o checkbox)
      const membersCheckbox = screen.getByLabelText(/membros/i)
      await user.click(membersCheckbox)

      const submitButton = screen.getByTestId('plan-form-submit')
      await user.click(submitButton)

      await waitFor(() => {
        expect(plansApi.update).toHaveBeenCalledWith('plan-123', expect.objectContaining({
          features: ['events'],
        }))
      })
    })

    it('deve limpar campos opcionais ao editar', async () => {
      const user = userEvent.setup()
      const updatedPlan = {
        ...mockPlan,
        maxBranches: undefined,
        maxMembers: undefined,
      }

      ;(plansApi.update as any).mockResolvedValue(updatedPlan)
      mockUseParams.mockReturnValue({ id: 'plan-123' })

      render(
        <BrowserRouter>
          <PlanForm />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Editar Plano')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByTestId('plan-form-max-branches')).toHaveValue(5)
      })

      // Limpa máximo de filiais
      const maxBranchesInput = screen.getByTestId('plan-form-max-branches')
      await user.clear(maxBranchesInput)

      // Limpa máximo de membros
      const maxMembersInput = screen.getByTestId('plan-form-max-members')
      await user.clear(maxMembersInput)

      const submitButton = screen.getByTestId('plan-form-submit')
      await user.click(submitButton)

      await waitFor(() => {
        expect(plansApi.update).toHaveBeenCalledWith('plan-123', expect.objectContaining({
          maxBranches: undefined,
          maxMembers: undefined,
        }))
      })
    })

    it('deve mostrar erro quando falhar ao atualizar plano', async () => {
      const user = userEvent.setup()
      const error = {
        response: {
          data: { error: 'Erro ao atualizar plano' },
        },
      }

      ;(plansApi.update as any).mockRejectedValue(error)
      mockUseParams.mockReturnValue({ id: 'plan-123' })

      render(
        <BrowserRouter>
          <PlanForm />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Editar Plano')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByTestId('plan-form-name')).toHaveValue('Plano Original')
      })

      const submitButton = screen.getByTestId('plan-form-submit')
      await user.click(submitButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Erro ao atualizar plano')
      })
    })
  })
})

