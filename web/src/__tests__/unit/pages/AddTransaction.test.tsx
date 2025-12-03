import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import AddTransaction from '@/pages/Finances/AddTransaction'
import api from '@/api/api'
import { useAuthStore } from '@/stores/authStore'
import { mockUser } from '@/test/mocks/mockData'

vi.mock('@/api/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/components/MemberSearch', () => ({
  default: ({ value, onChange, placeholder }: any) => (
    <div>
      <input
        data-testid="member-search-input"
        value={value || ''}
        onChange={(e) => onChange && onChange(e.target.value, e.target.value)}
        placeholder={placeholder}
      />
    </div>
  ),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('AddTransaction Page', () => {
  beforeEach(() => {
    useAuthStore.setState({
      token: 'token',
      user: mockUser,
    })
    vi.clearAllMocks()
    vi.mocked(api.post).mockResolvedValue({ data: {} })
  })

  it('deve renderizar o formulário corretamente', () => {
    render(
      <MemoryRouter>
        <AddTransaction />
      </MemoryRouter>
    )

    expect(screen.getByText('Nova Transação')).toBeInTheDocument()
    // Usar IDs em vez de labels para ser mais robusto
    expect(document.getElementById('title')).toBeInTheDocument()
    expect(document.getElementById('amount')).toBeInTheDocument()
    expect(document.getElementById('type')).toBeInTheDocument()
  })

  it('deve validar campos obrigatórios', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AddTransaction />
      </MemoryRouter>
    )

    const submitButton = document.getElementById('submit-button') || screen.getByText('Salvar Transação')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/título é obrigatório/i)).toBeInTheDocument()
    })
  })

  it('deve criar transação de entrada (Oferta) com sucesso', async () => {
    const toast = await import('react-hot-toast')
    const mockResponse = {
      data: {
        id: 'trans-1',
        title: 'Oferta',
        amount: 500.0,
        type: 'ENTRY',
        entryType: 'OFERTA',
        category: 'Oferta',
      },
    }

    vi.mocked(api.post).mockResolvedValue(mockResponse)

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AddTransaction />
      </MemoryRouter>
    )

    // Preencher título usando ID
    const titleInput = document.getElementById('title') as HTMLInputElement
    await user.type(titleInput, 'Oferta')

    // Preencher valor usando ID
    const amountInput = document.getElementById('amount') as HTMLInputElement
    await user.clear(amountInput)
    fireEvent.change(amountInput, { target: { value: '500' } })

    // Selecionar tipo ENTRY usando ID
    const typeSelect = document.getElementById('type') as HTMLSelectElement
    await user.selectOptions(typeSelect, 'ENTRY')

    // Aguardar campo entryType aparecer
    await waitFor(() => {
      expect(document.getElementById('entryType')).toBeInTheDocument()
    })

    // Selecionar entryType OFERTA usando ID
    const entryTypeSelect = document.getElementById('entryType') as HTMLSelectElement
    await user.selectOptions(entryTypeSelect, 'OFERTA')

    // Preencher categoria usando ID
    const categoryInput = document.getElementById('category') as HTMLInputElement
    await user.type(categoryInput, 'Oferta')

    // Submeter usando ID
    const submitButton = document.getElementById('submit-button') || screen.getByText('Salvar Transação')
    const form = submitButton.closest('form')
    if (form) {
      fireEvent.submit(form)
    } else {
      await user.click(submitButton)
    }

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/finances', expect.objectContaining({
        title: 'Oferta',
        amount: 500,
        type: 'ENTRY',
        entryType: 'OFERTA',
        category: 'Oferta',
      }))
    })

    await waitFor(() => {
      expect(toast.default.success).toHaveBeenCalledWith('Transação adicionada com sucesso!')
    })

    expect(mockNavigate).toHaveBeenCalledWith('/app/finances')
  })

  it('deve criar transação de saída com sucesso', async () => {
    const toast = await import('react-hot-toast')
    const mockResponse = {
      data: {
        id: 'trans-1',
        title: 'Pagamento',
        amount: 300.0,
        type: 'EXIT',
        exitType: 'ALUGUEL',
        category: 'Despesas',
      },
    }

    vi.mocked(api.post).mockResolvedValue(mockResponse)

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AddTransaction />
      </MemoryRouter>
    )

    // Preencher título usando ID
    const titleInput = document.getElementById('title') as HTMLInputElement
    await user.type(titleInput, 'Pagamento')

    // Preencher valor usando ID
    const amountInput = document.getElementById('amount') as HTMLInputElement
    await user.clear(amountInput)
    fireEvent.change(amountInput, { target: { value: '300' } })

    // Selecionar tipo EXIT usando ID
    const typeSelect = document.getElementById('type') as HTMLSelectElement
    await user.selectOptions(typeSelect, 'EXIT')

    // Aguardar campo exitType aparecer (obrigatório para EXIT)
    await waitFor(() => {
      const exitTypeSelect = document.getElementById('exitType')
      expect(exitTypeSelect).toBeInTheDocument()
    })

    // Selecionar exitType usando ID
    const exitTypeSelect = document.getElementById('exitType') as HTMLSelectElement
    await user.selectOptions(exitTypeSelect, 'ALUGUEL')

    // Preencher categoria usando ID
    const categoryInput = document.getElementById('category') as HTMLInputElement
    await user.type(categoryInput, 'Despesas')

    // Submeter usando ID
    const submitButton = document.getElementById('submit-button') || screen.getByText('Salvar Transação')
    const form = submitButton.closest('form')
    if (form) {
      fireEvent.submit(form)
    } else {
      await user.click(submitButton)
    }

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/finances', expect.objectContaining({
        title: 'Pagamento',
        amount: 300,
        type: 'EXIT',
        exitType: 'ALUGUEL',
        category: 'Despesas',
      }))
    })

    await waitFor(() => {
      expect(toast.default.success).toHaveBeenCalledWith('Transação adicionada com sucesso!')
    })
  })

  it('deve exibir campos de dizimista quando entryType é DIZIMO', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AddTransaction />
      </MemoryRouter>
    )

    // Selecionar tipo ENTRY usando ID
    const typeSelect = document.getElementById('type') as HTMLSelectElement
    await user.selectOptions(typeSelect, 'ENTRY')

    // Aguardar campo entryType aparecer
    await waitFor(() => {
      expect(document.getElementById('entryType')).toBeInTheDocument()
    })

    // Selecionar entryType DIZIMO usando ID
    const entryTypeSelect = document.getElementById('entryType') as HTMLSelectElement
    await user.selectOptions(entryTypeSelect, 'DIZIMO')

    // Aguardar campos de dizimista aparecerem
    await waitFor(() => {
      const checkbox = document.getElementById('isTithePayerMember')
      expect(checkbox).toBeInTheDocument()
    })
  })

  it('deve exibir MemberSearch quando dizimista é membro', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AddTransaction />
      </MemoryRouter>
    )

    // Selecionar tipo ENTRY usando ID
    const typeSelect = document.getElementById('type') as HTMLSelectElement
    await user.selectOptions(typeSelect, 'ENTRY')

    // Selecionar entryType DIZIMO usando ID
    await waitFor(() => {
      const entryTypeSelect = document.getElementById('entryType')
      return entryTypeSelect
    })
    const entryTypeSelect = document.getElementById('entryType') as HTMLSelectElement
    await user.selectOptions(entryTypeSelect, 'DIZIMO')

    // Aguardar checkbox aparecer usando ID
    await waitFor(() => {
      const checkbox = document.getElementById('isTithePayerMember')
      expect(checkbox).toBeInTheDocument()
    })

    // Verificar que MemberSearch aparece (checkbox está marcado por padrão)
    await waitFor(() => {
      const memberSearchContainer = document.getElementById('tithePayerMemberSearch')
      expect(memberSearchContainer).toBeInTheDocument()
      expect(screen.getByTestId('member-search-input')).toBeInTheDocument()
    })
  })

  it('deve exibir campo de nome quando dizimista não é membro', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AddTransaction />
      </MemoryRouter>
    )

    // Selecionar tipo ENTRY usando ID
    const typeSelect = document.getElementById('type') as HTMLSelectElement
    await user.selectOptions(typeSelect, 'ENTRY')

    // Selecionar entryType DIZIMO usando ID
    await waitFor(() => {
      const entryTypeSelect = document.getElementById('entryType')
      return entryTypeSelect
    })
    const entryTypeSelect = document.getElementById('entryType') as HTMLSelectElement
    await user.selectOptions(entryTypeSelect, 'DIZIMO')

    // Aguardar checkbox aparecer usando ID
    await waitFor(() => {
      const checkbox = document.getElementById('isTithePayerMember')
      return checkbox
    })

    // Desmarcar checkbox usando ID
    const checkbox = document.getElementById('isTithePayerMember') as HTMLInputElement
    await user.click(checkbox)

    // Aguardar campo de nome aparecer usando ID
    await waitFor(() => {
      const nameInput = document.getElementById('tithePayerName')
      expect(nameInput).toBeInTheDocument()
    })
  })

  it('deve navegar para lista ao clicar em Voltar', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AddTransaction />
      </MemoryRouter>
    )

    const backButton = document.getElementById('back-button') || screen.getByText('Voltar')
    await user.click(backButton)

    expect(mockNavigate).toHaveBeenCalledWith('/app/finances')
  })

  it('deve navegar para lista ao clicar em Cancelar', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AddTransaction />
      </MemoryRouter>
    )

    const cancelButton = document.getElementById('cancel-button') || screen.getByText('Cancelar')
    await user.click(cancelButton)

    expect(mockNavigate).toHaveBeenCalledWith('/app/finances')
  })

  it('deve exibir erro quando falha ao criar transação', async () => {
    const toast = await import('react-hot-toast')
    
    vi.clearAllMocks()
    vi.mocked(api.post).mockRejectedValue({
      response: {
        data: {
          message: 'Erro ao criar transação',
        },
      },
    })

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AddTransaction />
      </MemoryRouter>
    )

    // Preencher formulário usando IDs
    const titleInput = document.getElementById('title') as HTMLInputElement
    await user.type(titleInput, 'Transação')

    const amountInput = document.getElementById('amount') as HTMLInputElement
    await user.clear(amountInput)
    fireEvent.change(amountInput, { target: { value: '100' } })

    const typeSelect = document.getElementById('type') as HTMLSelectElement
    await user.selectOptions(typeSelect, 'ENTRY')

    await waitFor(() => {
      const entryTypeSelect = document.getElementById('entryType')
      return entryTypeSelect
    })
    const entryTypeSelect = document.getElementById('entryType') as HTMLSelectElement
    await user.selectOptions(entryTypeSelect, 'OFERTA')

    // Submeter usando ID
    const submitButton = document.getElementById('submit-button') || screen.getByText('Salvar Transação')
    const form = submitButton.closest('form')
    if (form) {
      fireEvent.submit(form)
    } else {
      await user.click(submitButton)
    }

    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalledWith('Erro ao criar transação')
    })
  })

  it('deve exibir campo exitType quando tipo é EXIT', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AddTransaction />
      </MemoryRouter>
    )

    const typeSelect = document.getElementById('type') as HTMLSelectElement
    await user.selectOptions(typeSelect, 'EXIT')

    await waitFor(() => {
      const exitTypeSelect = document.getElementById('exitType')
      expect(exitTypeSelect).toBeInTheDocument()
    })
  })

  it('deve exibir campo exitTypeOther quando exitType é OUTROS', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AddTransaction />
      </MemoryRouter>
    )

    const typeSelect = document.getElementById('type') as HTMLSelectElement
    await user.selectOptions(typeSelect, 'EXIT')

    await waitFor(() => {
      const exitTypeSelect = document.getElementById('exitType')
      expect(exitTypeSelect).toBeInTheDocument()
    })

    const exitTypeSelect = document.getElementById('exitType') as HTMLSelectElement
    await user.selectOptions(exitTypeSelect, 'OUTROS')

    await waitFor(() => {
      const exitTypeOtherInput = document.getElementById('exitTypeOther')
      expect(exitTypeOtherInput).toBeInTheDocument()
    })
  })

  it('deve criar transação de saída com exitType', async () => {
    const toast = await import('react-hot-toast')
    const mockResponse = {
      data: {
        id: 'trans-1',
        title: 'Aluguel',
        amount: 1500.0,
        type: 'EXIT',
        exitType: 'ALUGUEL',
        category: 'Despesas',
      },
    }

    vi.mocked(api.post).mockResolvedValue(mockResponse)

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AddTransaction />
      </MemoryRouter>
    )

    const titleInput = document.getElementById('title') as HTMLInputElement
    await user.type(titleInput, 'Aluguel')

    const amountInput = document.getElementById('amount') as HTMLInputElement
    await user.clear(amountInput)
    fireEvent.change(amountInput, { target: { value: '1500' } })

    const typeSelect = document.getElementById('type') as HTMLSelectElement
    await user.selectOptions(typeSelect, 'EXIT')

    await waitFor(() => {
      const exitTypeSelect = document.getElementById('exitType')
      expect(exitTypeSelect).toBeInTheDocument()
    })

    const exitTypeSelect = document.getElementById('exitType') as HTMLSelectElement
    await user.selectOptions(exitTypeSelect, 'ALUGUEL')

    const submitButton = document.getElementById('submit-button') || screen.getByText('Salvar Transação')
    const form = submitButton.closest('form')
    if (form) {
      fireEvent.submit(form)
    } else {
      await user.click(submitButton)
    }

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/finances', expect.objectContaining({
        title: 'Aluguel',
        amount: 1500,
        type: 'EXIT',
        exitType: 'ALUGUEL',
      }))
    })

    await waitFor(() => {
      expect(toast.default.success).toHaveBeenCalledWith('Transação adicionada com sucesso!')
    })
  })

  it('deve exibir campo de contribuição quando entryType é CONTRIBUICAO', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [
        { id: 'contrib-1', title: 'Contribuição Teste', description: 'Descrição' },
      ],
    })

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AddTransaction />
      </MemoryRouter>
    )

    const typeSelect = document.getElementById('type') as HTMLSelectElement
    await user.selectOptions(typeSelect, 'ENTRY')

    await waitFor(() => {
      const entryTypeSelect = document.getElementById('entryType')
      expect(entryTypeSelect).toBeInTheDocument()
    })

    const entryTypeSelect = document.getElementById('entryType') as HTMLSelectElement
    await user.selectOptions(entryTypeSelect, 'CONTRIBUICAO')

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/contributions')
      const contributionSelect = document.getElementById('contributionId')
      expect(contributionSelect).toBeInTheDocument()
    })
  })

  it('deve criar transação de entrada com tipo CONTRIBUICAO', async () => {
    const toast = await import('react-hot-toast')
    vi.mocked(api.get).mockResolvedValue({
      data: [
        { id: 'contrib-1', title: 'Contribuição Teste', description: 'Descrição' },
      ],
    })

    const mockResponse = {
      data: {
        id: 'trans-1',
        title: 'Transação de Contribuição',
        amount: 500.0,
        type: 'ENTRY',
        entryType: 'CONTRIBUICAO',
        contributionId: 'contrib-1',
      },
    }

    vi.mocked(api.post).mockResolvedValue(mockResponse)

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AddTransaction />
      </MemoryRouter>
    )

    const titleInput = document.getElementById('title') as HTMLInputElement
    await user.type(titleInput, 'Transação de Contribuição')

    const amountInput = document.getElementById('amount') as HTMLInputElement
    await user.clear(amountInput)
    fireEvent.change(amountInput, { target: { value: '500' } })

    const typeSelect = document.getElementById('type') as HTMLSelectElement
    await user.selectOptions(typeSelect, 'ENTRY')

    await waitFor(() => {
      const entryTypeSelect = document.getElementById('entryType')
      expect(entryTypeSelect).toBeInTheDocument()
    })

    const entryTypeSelect = document.getElementById('entryType') as HTMLSelectElement
    await user.selectOptions(entryTypeSelect, 'CONTRIBUICAO')

    await waitFor(() => {
      const contributionSelect = document.getElementById('contributionId')
      expect(contributionSelect).toBeInTheDocument()
    })

    const contributionSelect = document.getElementById('contributionId') as HTMLSelectElement
    await user.selectOptions(contributionSelect, 'contrib-1')

    const submitButton = document.getElementById('submit-button') || screen.getByText('Salvar Transação')
    const form = submitButton.closest('form')
    if (form) {
      fireEvent.submit(form)
    } else {
      await user.click(submitButton)
    }

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/finances', expect.objectContaining({
        title: 'Transação de Contribuição',
        amount: 500,
        type: 'ENTRY',
        entryType: 'CONTRIBUICAO',
        contributionId: 'contrib-1',
      }))
    })
  })
})

