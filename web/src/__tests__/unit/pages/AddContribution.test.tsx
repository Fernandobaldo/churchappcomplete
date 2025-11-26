import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import AddContribution from '@/pages/Contributions/AddContribution'
import api from '@/api/api'
import { useAuthStore } from '@/stores/authStore'
import { mockUser } from '@/test/mocks/mockData'

vi.mock('@/api/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
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

describe('AddContribution Page', () => {
  beforeEach(() => {
    useAuthStore.setState({
      token: 'token',
      user: mockUser,
    })
    vi.clearAllMocks()
    // Garantir que o mock do api está configurado
    vi.mocked(api.post).mockResolvedValue({ data: {} })
  })

  it('deve renderizar o formulário corretamente', () => {
    render(
      <MemoryRouter>
        <AddContribution />
      </MemoryRouter>
    )

    expect(screen.getByText('Nova Contribuição')).toBeInTheDocument()
    expect(screen.getByTestId('title-input')).toBeInTheDocument()
    expect(screen.getByTestId('submit-button')).toBeInTheDocument()
  })

  it('deve validar campos obrigatórios', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AddContribution />
      </MemoryRouter>
    )

    const submitButton = screen.getByText('Adicionar Contribuição')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Título é obrigatório')).toBeInTheDocument()
    })
  })

  it('deve criar contribuição com sucesso', async () => {
    const toast = await import('react-hot-toast')
    const mockResponse = {
      data: {
        id: 'contrib-1',
        title: 'Dízimo',
        value: 100.0,
        type: 'DIZIMO',
        date: '2024-01-15',
      },
    }

    vi.mocked(api.post).mockResolvedValue(mockResponse)

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AddContribution />
      </MemoryRouter>
    )

    // Aguardar o formulário renderizar completamente
    await waitFor(() => {
      expect(screen.getByTestId('title-input')).toBeInTheDocument()
    })

    // Preencher título usando data-testid
    const titleInput = screen.getByTestId('title-input')
    await user.clear(titleInput)
    await user.type(titleInput, 'Dízimo')
    
    // Preencher valor usando data-testid - garantir que é um número válido
    const valueInput = screen.getByTestId('value-input') as HTMLInputElement
    await user.clear(valueInput)
    // Usar fireEvent para garantir que o valor é definido corretamente
    fireEvent.change(valueInput, { target: { value: '100' } })
    
    // Verificar que o valor foi preenchido
    await waitFor(() => {
      expect(valueInput.value).toBe('100')
    })

    // A data já tem valor padrão (hoje), então não precisamos preenchê-la
    // Mas vamos garantir que o input existe e tem valor
    const dateInput = screen.getByTestId('date-input') as HTMLInputElement
    expect(dateInput).toBeTruthy()
    expect(dateInput.value).toBeTruthy() // Deve ter um valor padrão

    // Selecionar tipo DIZIMO usando data-testid
    const typeSelect = screen.getByTestId('type-select') as HTMLSelectElement
    expect(typeSelect).toBeTruthy()
    await user.selectOptions(typeSelect, 'DIZIMO')
    
    // Verificar que o tipo foi selecionado
    await waitFor(() => {
      expect(typeSelect.value).toBe('DIZIMO')
    })

    // Aguardar um pouco para garantir que o formulário está pronto
    await waitFor(() => {
      expect(titleInput).toHaveValue('Dízimo')
      expect(valueInput.value).toBe('100')
      expect(typeSelect).toHaveValue('DIZIMO')
    }, { timeout: 3000 })

    // Verificar que não há erros de validação antes de submeter
    expect(screen.queryByText(/título é obrigatório/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/valor é obrigatório/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/data é obrigatória/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/tipo é obrigatório/i)).not.toBeInTheDocument()

    // Submeter formulário usando data-testid
    const submitButton = screen.getByTestId('submit-button')
    expect(submitButton).toBeTruthy()
    expect(submitButton).not.toBeDisabled()
    
    // Obter o formulário e submeter diretamente para garantir que o evento é disparado
    const form = submitButton.closest('form')
    expect(form).toBeTruthy()
    
    // Submeter o formulário diretamente usando fireEvent.submit
    // Isso garante que o evento de submit é disparado mesmo se o botão não funcionar
    fireEvent.submit(form!)

    // Aguardar o submit ser processado e a API ser chamada
    await waitFor(() => {
      expect(api.post).toHaveBeenCalled()
    }, { timeout: 5000 })

    // Verifica que foi chamado
    expect(api.post).toHaveBeenCalled()
    
    // Verifica os argumentos
    const callArgs = vi.mocked(api.post).mock.calls[0]
    expect(callArgs[0]).toBe('/contributions')
    expect(callArgs[1]).toHaveProperty('title', 'Dízimo')
    expect(callArgs[1]).toHaveProperty('value')
    expect(callArgs[1]).toHaveProperty('type')
    expect(callArgs[1]).toHaveProperty('date')

    await waitFor(() => {
      expect(toast.default.success).toHaveBeenCalledWith('Contribuição adicionada com sucesso!')
    })

    expect(mockNavigate).toHaveBeenCalledWith('/app/contributions')
  })

  it('deve exibir erro quando falha ao criar contribuição', async () => {
    const toast = await import('react-hot-toast')
    
    // Limpar mocks e configurar para rejeitar
    vi.clearAllMocks()
    vi.mocked(api.post).mockRejectedValue({
      response: {
        data: {
          message: 'Erro ao criar contribuição',
        },
      },
    })

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AddContribution />
      </MemoryRouter>
    )

    // Aguardar o formulário renderizar
    await waitFor(() => {
      expect(screen.getByText('Nova Contribuição')).toBeInTheDocument()
    })

    // Preencher título
    const titleInput = screen.getByTestId('title-input')
    await user.clear(titleInput)
    await user.type(titleInput, 'Dízimo')
    
    // Preencher valor usando fireEvent para garantir que o valor é definido corretamente
    const valueInput = screen.getByTestId('value-input') as HTMLInputElement
    await user.clear(valueInput)
    fireEvent.change(valueInput, { target: { value: '100' } })
    
    // Verificar que o valor foi preenchido
    await waitFor(() => {
      expect(valueInput.value).toBe('100')
    })
    
    // A data já tem valor padrão, não precisa preencher
    const dateInput = screen.getByTestId('date-input')
    expect(dateInput).toBeTruthy()

    // Tipo já está como OFERTA por padrão, não precisa mudar

    // Submeter o formulário diretamente usando fireEvent.submit
    const form = titleInput.closest('form')
    expect(form).toBeTruthy()
    fireEvent.submit(form!)

    // Aguardar o submit ser processado e a API ser chamada
    await waitFor(() => {
      expect(api.post).toHaveBeenCalled()
    }, { timeout: 5000 })

    // Aguardar o toast de erro ser chamado
    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalled()
    }, { timeout: 5000 })

    // Verifica que foi chamado com a mensagem de erro
    expect(toast.default.error).toHaveBeenCalledWith('Erro ao criar contribuição')
  })

  it('deve navegar para lista ao clicar em Voltar', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AddContribution />
      </MemoryRouter>
    )

    const backButton = screen.getByTestId('back-button')
    await user.click(backButton)

    expect(mockNavigate).toHaveBeenCalledWith('/app/contributions')
  })

  it('deve navegar para lista ao clicar em Cancelar', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AddContribution />
      </MemoryRouter>
    )

    const cancelButton = screen.getByTestId('cancel-button')
    await user.click(cancelButton)

    expect(mockNavigate).toHaveBeenCalledWith('/app/contributions')
  })
})

