import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Devotionals from '@/pages/Devotionals'
import api from '@/api/api'
import { fixtures } from '@/test/fixtures'
import { renderWithProviders } from '@/test/helpers'
import { mockApiResponse, mockApiError } from '@/test/mockApi'

vi.mock('@/api/api', async () => {
  const { apiMock } = await import('@/test/apiMock')
  return { default: apiMock }
})
const { mockToastError } = vi.hoisted(() => ({
  mockToastError: vi.fn(),
}))
vi.mock('react-hot-toast', () => ({
  default: {
    error: mockToastError,
    success: vi.fn(),
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

describe('Devotionals - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // TESTE 1: LOADING STATE - Exibe loading inicial
  // ============================================================================
  it('deve exibir loading inicial', () => {
    // Arrange
    vi.mocked(api.get).mockImplementation(() => new Promise(() => {})) // Nunca resolve
    const mockUser = fixtures.user()

    // Act
    renderWithProviders(<Devotionals />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    expect(screen.getByText('Carregando devocionais...')).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 2: PRIMARY INTERACTION - Carrega e exibe lista de devocionais
  // ============================================================================
  it('deve carregar e exibir lista de devocionais', async () => {
    // Arrange
    const mockUser = fixtures.user()
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
    mockApiResponse('get', '/devotionals', mockDevotionals)

    // Act
    renderWithProviders(<Devotionals />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Devocional Teste')).toBeInTheDocument()
    })

    expect(screen.getByText('João 3:16')).toBeInTheDocument()
    expect(screen.getByText('Autor Teste')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 3: EMPTY STATE - Exibe mensagem quando não há devocionais
  // ============================================================================
  it('deve exibir mensagem quando não há devocionais', async () => {
    // Arrange
    const mockUser = fixtures.user()
    mockApiResponse('get', '/devotionals', [])

    // Act
    renderWithProviders(<Devotionals />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Nenhum devocional cadastrado')).toBeInTheDocument()
    })

    const createButton = screen.getByText('Criar Primeiro Devocional')
    expect(createButton).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 4: PRIMARY INTERACTION - Navega para criar devocional
  // ============================================================================
  it('deve navegar para criar devocional ao clicar em "Novo Devocional"', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockUser = fixtures.user()
    mockApiResponse('get', '/devotionals', [])

    // Act
    renderWithProviders(<Devotionals />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    await waitFor(() => {
      expect(screen.getByText('Novo Devocional')).toBeInTheDocument()
    })

    const newButton = screen.getByText('Novo Devocional')
    await user.click(newButton)

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('/app/devotionals/new')
  })

  // ============================================================================
  // TESTE 5: PRIMARY INTERACTION - Navega para detalhes ao clicar em um card
  // ============================================================================
  it('deve navegar para detalhes ao clicar em um card', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockUser = fixtures.user()
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
    mockApiResponse('get', '/devotionals', mockDevotionals)

    // Act
    renderWithProviders(<Devotionals />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    await waitFor(() => {
      expect(screen.getByText('Devocional Teste')).toBeInTheDocument()
    })

    const card = screen.getByText('Devocional Teste').closest('div')
    await user.click(card!)

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('/app/devotionals/devotional-1')
  })

  // ============================================================================
  // TESTE 6: ERROR STATE - Exibe erro quando falha ao carregar devocionais
  // ============================================================================
  it('deve exibir erro quando falha ao carregar devocionais', async () => {
    // Arrange
    const mockUser = fixtures.user()
    mockApiError('get', '/devotionals', new Error('Erro na API'))

    // Act
    renderWithProviders(<Devotionals />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Erro ao carregar devocionais')
    })
  })
})



