import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import AddDevotional from '@/pages/Devotionals/AddDevotional'
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

describe('AddDevotional Page', () => {
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
        <AddDevotional />
      </MemoryRouter>
    )

    expect(screen.getByText('Novo Devocional')).toBeInTheDocument()
    expect(screen.getByTestId('title-input')).toBeInTheDocument()
    expect(screen.getByTestId('passage-input')).toBeInTheDocument()
    expect(screen.getByTestId('content-input')).toBeInTheDocument()
    expect(screen.getByTestId('submit-button')).toBeInTheDocument()
  })

  it('deve validar campos obrigatórios', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AddDevotional />
      </MemoryRouter>
    )

    const submitButton = screen.getByTestId('submit-button')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Título é obrigatório')).toBeInTheDocument()
    })
  })

  it('deve criar devocional com sucesso', async () => {
    const toast = await import('react-hot-toast')
    const mockResponse = {
      data: {
        id: 'devotional-1',
        title: 'Novo Devocional',
        passage: 'João 3:16',
        content: 'Conteúdo do devocional',
      },
    }

    vi.mocked(api.post).mockResolvedValue(mockResponse)

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AddDevotional />
      </MemoryRouter>
    )

    await user.type(screen.getByTestId('title-input'), 'Novo Devocional')
    await user.type(screen.getByTestId('passage-input'), 'João 3:16')
    await user.type(screen.getByTestId('content-input'), 'Conteúdo do devocional')

    const submitButton = screen.getByText('Criar Devocional')
    await user.click(submitButton)

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/devotionals', {
        title: 'Novo Devocional',
        passage: 'João 3:16',
        content: 'Conteúdo do devocional',
      })
    })

    await waitFor(() => {
      expect(toast.default.success).toHaveBeenCalledWith('Devocional criado com sucesso!')
    })

    expect(mockNavigate).toHaveBeenCalledWith('/app/devotionals')
  })

  it('deve exibir erro quando falha ao criar devocional', async () => {
    const toast = await import('react-hot-toast')
    const mockError = {
      response: {
        data: {
          message: 'Erro ao criar devocional',
        },
      },
    }

    vi.mocked(api.post).mockRejectedValue(mockError)

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AddDevotional />
      </MemoryRouter>
    )

    await user.type(screen.getByTestId('title-input'), 'Novo Devocional')
    await user.type(screen.getByTestId('passage-input'), 'João 3:16')
    await user.type(screen.getByTestId('content-input'), 'Conteúdo do devocional')

    const submitButton = screen.getByText('Criar Devocional')
    await user.click(submitButton)

    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalledWith('Erro ao criar devocional')
    })
  })

  it('deve navegar para lista ao clicar em Voltar', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AddDevotional />
      </MemoryRouter>
    )

    const backButton = screen.getByTestId('back-button')
    await user.click(backButton)

    expect(mockNavigate).toHaveBeenCalledWith('/app/devotionals')
  })

  it('deve navegar para lista ao clicar em Cancelar', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AddDevotional />
      </MemoryRouter>
    )

    const cancelButton = screen.getByTestId('cancel-button')
    await user.click(cancelButton)

    expect(mockNavigate).toHaveBeenCalledWith('/app/devotionals')
  })
})

