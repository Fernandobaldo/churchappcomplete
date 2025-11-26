import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import Devotionals from '@/pages/Devotionals'
import api from '@/api/api'
import { useAuthStore } from '@/stores/authStore'
import { mockUser } from '@/test/mocks/mockData'

vi.mock('@/api/api')
vi.mock('react-hot-toast', () => ({
  default: {
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

describe('Devotionals Page', () => {
  beforeEach(() => {
    useAuthStore.setState({
      token: 'token',
      user: mockUser,
    })
    vi.clearAllMocks()
  })

  it('deve exibir loading inicial', () => {
    vi.mocked(api.get).mockImplementation(() => new Promise(() => {})) // Nunca resolve

    render(
      <MemoryRouter>
        <Devotionals />
      </MemoryRouter>
    )

    expect(screen.getByText('Carregando devocionais...')).toBeInTheDocument()
  })

  it('deve carregar e exibir lista de devocionais', async () => {
    const mockDevotionals = [
      {
        id: 'devotional-1',
        title: 'Devocional Teste',
        passage: 'João 3:16',
        content: 'Conteúdo do devocional',
        author: {
          id: 'author-1',
          name: 'Autor Teste',
        },
        likes: 5,
        createdAt: new Date().toISOString(),
      },
    ]

    vi.mocked(api.get).mockResolvedValue({ data: mockDevotionals })

    render(
      <MemoryRouter>
        <Devotionals />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Devocional Teste')).toBeInTheDocument()
    })

    expect(screen.getByText('João 3:16')).toBeInTheDocument()
    expect(screen.getByText('Autor Teste')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('deve exibir mensagem quando não há devocionais', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] })

    render(
      <MemoryRouter>
        <Devotionals />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Nenhum devocional cadastrado')).toBeInTheDocument()
    })

    const createButton = screen.getByText('Criar Primeiro Devocional')
    expect(createButton).toBeInTheDocument()
  })

  it('deve navegar para criar devocional ao clicar em "Novo Devocional"', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] })

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Devotionals />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Novo Devocional')).toBeInTheDocument()
    })

    const newButton = screen.getByText('Novo Devocional')
    await user.click(newButton)

    expect(mockNavigate).toHaveBeenCalledWith('/app/devotionals/new')
  })

  it('deve navegar para detalhes ao clicar em um card', async () => {
    const mockDevotionals = [
      {
        id: 'devotional-1',
        title: 'Devocional Teste',
        passage: 'João 3:16',
        content: 'Conteúdo do devocional',
        author: {
          id: 'author-1',
          name: 'Autor Teste',
        },
        likes: 5,
        createdAt: new Date().toISOString(),
      },
    ]

    vi.mocked(api.get).mockResolvedValue({ data: mockDevotionals })

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Devotionals />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Devocional Teste')).toBeInTheDocument()
    })

    const card = screen.getByText('Devocional Teste').closest('div')
    await user.click(card!)

    expect(mockNavigate).toHaveBeenCalledWith('/app/devotionals/devotional-1')
  })

  it('deve exibir erro quando falha ao carregar devocionais', async () => {
    const toast = await import('react-hot-toast')
    vi.mocked(api.get).mockRejectedValue(new Error('Erro na API'))

    render(
      <MemoryRouter>
        <Devotionals />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalledWith('Erro ao carregar devocionais')
    })
  })
})


