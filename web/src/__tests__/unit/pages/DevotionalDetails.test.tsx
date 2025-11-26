import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import DevotionalDetails from '@/pages/Devotionals/DevotionalDetails'
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
    useParams: () => ({ id: 'devotional-1' }),
  }
})

describe('DevotionalDetails Page', () => {
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
        <DevotionalDetails />
      </MemoryRouter>
    )

    expect(screen.getByText('Carregando...')).toBeInTheDocument()
  })

  it('deve carregar e exibir detalhes do devocional', async () => {
    const mockDevotional = {
      id: 'devotional-1',
      title: 'Devocional Teste',
      passage: 'João 3:16',
      content: 'Conteúdo completo do devocional',
      author: {
        id: 'author-1',
        name: 'Autor Teste',
      },
      likes: 5,
      liked: false,
      createdAt: new Date().toISOString(),
    }

    vi.mocked(api.get).mockResolvedValue({ data: mockDevotional })

    render(
      <MemoryRouter>
        <DevotionalDetails />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Devocional Teste')).toBeInTheDocument()
    })

    expect(screen.getByText('João 3:16')).toBeInTheDocument()
    expect(screen.getByText('Conteúdo completo do devocional')).toBeInTheDocument()
    expect(screen.getByText('Autor Teste')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('deve curtir devocional com sucesso', async () => {
    const mockDevotional = {
      id: 'devotional-1',
      title: 'Devocional Teste',
      passage: 'João 3:16',
      content: 'Conteúdo completo',
      author: {
        id: 'author-1',
        name: 'Autor Teste',
      },
      likes: 5,
      liked: false,
      createdAt: new Date().toISOString(),
    }

    vi.mocked(api.get).mockResolvedValue({ data: mockDevotional })
    vi.mocked(api.post).mockResolvedValue({
      data: {
        likes: 6,
        liked: true,
      },
    })

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <DevotionalDetails />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Devocional Teste')).toBeInTheDocument()
    })

    const likeButton = screen.getByText('5').closest('button')
    await user.click(likeButton!)

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/devotionals/devotional-1/like')
    })

    await waitFor(() => {
      expect(screen.getByText('6')).toBeInTheDocument()
    })
  })

  it('deve exibir erro quando falha ao carregar devocional', async () => {
    const toast = await import('react-hot-toast')
    vi.mocked(api.get).mockRejectedValue(new Error('Erro na API'))

    render(
      <MemoryRouter>
        <DevotionalDetails />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalledWith('Erro ao carregar devocional')
    })

    expect(mockNavigate).toHaveBeenCalledWith('/app/devotionals')
  })

  it('deve navegar para lista ao clicar em Voltar', async () => {
    const mockDevotional = {
      id: 'devotional-1',
      title: 'Devocional Teste',
      passage: 'João 3:16',
      content: 'Conteúdo completo',
      author: {
        id: 'author-1',
        name: 'Autor Teste',
      },
      likes: 5,
      liked: false,
      createdAt: new Date().toISOString(),
    }

    vi.mocked(api.get).mockResolvedValue({ data: mockDevotional })

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <DevotionalDetails />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Voltar')).toBeInTheDocument()
    })

    const backButton = screen.getByText('Voltar')
    await user.click(backButton)

    expect(mockNavigate).toHaveBeenCalledWith('/app/devotionals')
  })

  it('deve exibir coração preenchido quando devocional está curtido', async () => {
    const mockDevotional = {
      id: 'devotional-1',
      title: 'Devocional Teste',
      passage: 'João 3:16',
      content: 'Conteúdo completo',
      author: {
        id: 'author-1',
        name: 'Autor Teste',
      },
      likes: 5,
      liked: true,
      createdAt: new Date().toISOString(),
    }

    vi.mocked(api.get).mockResolvedValue({ data: mockDevotional })

    render(
      <MemoryRouter>
        <DevotionalDetails />
      </MemoryRouter>
    )

    await waitFor(() => {
      const likeButton = screen.getByText('5').closest('button')
      expect(likeButton).toHaveClass('bg-red-100', 'text-red-600')
    })
  })
})


