import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import AddMember from '@/pages/Members/AddMember'
import api from '@/api/api'
import { useAuthStore } from '@/stores/authStore'
import { mockUser } from '@/test/mocks/mockData'

vi.mock('@/api/api')
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

describe('AddMember Page', () => {
  beforeEach(() => {
    useAuthStore.setState({
      token: 'token',
      user: mockUser,
    })
    vi.clearAllMocks()
  })

  it('deve renderizar o formulário corretamente', () => {
    render(
      <MemoryRouter>
        <AddMember />
      </MemoryRouter>
    )

    expect(screen.getByText('Novo Membro')).toBeInTheDocument()
    expect(screen.getByTestId('name-input')).toBeInTheDocument()
    expect(screen.getByTestId('email-input')).toBeInTheDocument()
    expect(screen.getByTestId('submit-button')).toBeInTheDocument()
  })

  it('deve validar campos obrigatórios', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AddMember />
      </MemoryRouter>
    )

    const submitButton = screen.getByText('Criar Membro')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Nome é obrigatório')).toBeInTheDocument()
    })
  })

  it('deve criar membro com sucesso', async () => {
    const toast = await import('react-hot-toast')
    const mockResponse = {
      data: {
        id: 'member-1',
        name: 'Novo Membro',
        email: 'novo@example.com',
        role: 'MEMBER',
      },
    }

    vi.mocked(api.post).mockResolvedValue(mockResponse)

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AddMember />
      </MemoryRouter>
    )

    await user.type(screen.getByTestId('name-input'), 'Novo Membro')
    await user.type(screen.getByTestId('email-input'), 'novo@example.com')
    
    const passwordInput = screen.getByTestId('password-input')
    await user.type(passwordInput, 'password123')

    const submitButton = screen.getByText('Criar Membro')
    await user.click(submitButton)

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/register', expect.objectContaining({
        name: 'Novo Membro',
        email: 'novo@example.com',
        password: 'password123',
      }))
    })

    await waitFor(() => {
      expect(toast.default.success).toHaveBeenCalledWith('Membro criado com sucesso!')
    })

    expect(mockNavigate).toHaveBeenCalledWith('/app/members')
  })

  it('deve exibir erro quando falha ao criar membro', async () => {
    const toast = await import('react-hot-toast')
    vi.mocked(api.post).mockRejectedValue({
      response: {
        data: {
          message: 'Erro ao criar membro',
        },
      },
    })

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AddMember />
      </MemoryRouter>
    )

    await user.type(screen.getByTestId('name-input'), 'Novo Membro')
    await user.type(screen.getByTestId('email-input'), 'novo@example.com')
    
    const passwordInput = screen.getByTestId('password-input')
    await user.type(passwordInput, 'password123')

    const submitButton = screen.getByText('Criar Membro')
    await user.click(submitButton)

    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalledWith('Erro ao criar membro')
    })
  })

  it('deve navegar para lista ao clicar em Voltar', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AddMember />
      </MemoryRouter>
    )

    const backButton = screen.getByTestId('back-button')
    await user.click(backButton)

    expect(mockNavigate).toHaveBeenCalledWith('/app/members')
  })

  it('deve navegar para lista ao clicar em Cancelar', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AddMember />
      </MemoryRouter>
    )

    const cancelButton = screen.getByTestId('cancel-button')
    await user.click(cancelButton)

    expect(mockNavigate).toHaveBeenCalledWith('/app/members')
  })
})

