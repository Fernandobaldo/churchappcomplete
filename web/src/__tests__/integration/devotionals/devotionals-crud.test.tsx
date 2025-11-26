import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Devotionals from '@/pages/Devotionals'
import AddDevotional from '@/pages/Devotionals/AddDevotional'
import DevotionalDetails from '@/pages/Devotionals/DevotionalDetails'
import api from '@/api/api'
import { useAuthStore } from '@/stores/authStore'
import { mockUser, mockDevotionals } from '@/test/mocks/mockData'

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
    useParams: () => ({ id: 'devotional-1' }),
  }
})

describe('Devotionals CRUD Integration', () => {
  beforeEach(() => {
    useAuthStore.setState({
      token: 'token',
      user: mockUser,
    })
    vi.clearAllMocks()
  })

  describe('Listar Devocionais', () => {
    it('deve carregar e exibir lista de devocionais', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: mockDevotionals })

      render(
        <MemoryRouter>
          <Devotionals />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Devocional Diário')).toBeInTheDocument()
        expect(screen.getByText('Palavra de Fé')).toBeInTheDocument()
      })

      expect(api.get).toHaveBeenCalledWith('/devotionals')
    })

    it('deve exibir informações do autor e likes', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: mockDevotionals })

      render(
        <MemoryRouter>
          <Devotionals />
        </MemoryRouter>
      )

      await waitFor(() => {
        const authorElements = screen.getAllByText('João Silva')
        expect(authorElements.length).toBeGreaterThan(0)
        expect(authorElements[0]).toBeInTheDocument()
      })
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
    })

    it('deve navegar para criar devocional ao clicar em botão', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: [] })

      const user = userEvent.setup()
      render(
        <MemoryRouter>
          <Devotionals />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Criar Primeiro Devocional')).toBeInTheDocument()
      })

      const createButton = screen.getByText('Criar Primeiro Devocional')
      await user.click(createButton)

      expect(mockNavigate).toHaveBeenCalledWith('/app/devotionals/new')
    })
  })

  describe('Criar Devocional', () => {
    it('deve criar devocional com sucesso', async () => {
      const toast = await import('react-hot-toast')
      const mockResponse = {
        data: {
          id: 'devotional-new',
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

      await user.type(screen.getByPlaceholderText(/importância da oração/i), 'Novo Devocional')
      await user.type(screen.getByPlaceholderText(/joão 3:16/i), 'João 3:16')
      await user.type(screen.getByPlaceholderText(/escreva o conteúdo/i), 'Conteúdo do devocional')

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

    it('deve validar campos obrigatórios', async () => {
      const user = userEvent.setup()
      render(
        <MemoryRouter>
          <AddDevotional />
        </MemoryRouter>
      )

      const submitButton = screen.getByText('Criar Devocional')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Título é obrigatório')).toBeInTheDocument()
      })
    })
  })

  describe('Visualizar Detalhes', () => {
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
    })

    it('deve curtir devocional', async () => {
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
    })
  })
})



