import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DevotionalDetails from '@/pages/Devotionals/DevotionalDetails'
import { fixtures } from '@/test/fixtures'
import { renderWithProviders } from '@/test/helpers'
import { mockApiResponse, mockApiError } from '@/test/mockApi'
import api from '@/api/api'

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

describe('DevotionalDetails - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // TESTE 1: LOADING STATE - Exibe loading inicial
  // ============================================================================
  it('deve exibir loading inicial', () => {
    // Arrange
    const mockUser = fixtures.user()
    vi.mocked(api.get).mockImplementation(() => new Promise(() => {}))

    // Act
    renderWithProviders(<DevotionalDetails />, {
      initialEntries: ['/app/devotionals/devotional-1'],
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    expect(screen.getByText('Carregando...')).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 2: BASIC RENDER - Carrega e exibe detalhes do devocional
  // ============================================================================
  it('deve carregar e exibir detalhes do devocional', async () => {
    // Arrange
    const mockUser = fixtures.user()
    const mockDevotional = fixtures.devotional({
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
    })
    mockApiResponse('get', '/devotionals/devotional-1', mockDevotional)

    // Act
    renderWithProviders(<DevotionalDetails />, {
      initialEntries: ['/app/devotionals/devotional-1'],
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
    expect(screen.getByText('Conteúdo completo do devocional')).toBeInTheDocument()
    expect(screen.getByText('Autor Teste')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 3: PRIMARY INTERACTION - Curtir devocional com sucesso
  // ============================================================================
  it('deve curtir devocional com sucesso', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockUser = fixtures.user()
    const mockDevotional = fixtures.devotional({
      id: 'devotional-1',
      title: 'Devocional Teste',
      likes: 5,
      liked: false,
    })
    mockApiResponse('get', '/devotionals/devotional-1', mockDevotional)
    mockApiResponse('post', '/devotionals/devotional-1/like', {
      likes: 6,
      liked: true,
    })

    // Act
    renderWithProviders(<DevotionalDetails />, {
      initialEntries: ['/app/devotionals/devotional-1'],
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    await waitFor(() => {
      expect(screen.getByText('Devocional Teste')).toBeInTheDocument()
    })

    const likeButton = screen.getByText('5').closest('button')
    await user.click(likeButton!)

    // Assert
    await waitFor(() => {
      expect(screen.getByText('6')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // TESTE 4: ERROR STATE - Exibe erro quando falha ao carregar devocional
  // ============================================================================
  it('deve exibir erro quando falha ao carregar devocional', async () => {
    // Arrange
    const mockUser = fixtures.user()
    mockApiError('get', '/devotionals/devotional-1', { message: 'Erro na API' })

    // Act
    renderWithProviders(<DevotionalDetails />, {
      initialEntries: ['/app/devotionals/devotional-1'],
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Erro ao carregar devocional')
    })

    expect(mockNavigate).toHaveBeenCalledWith('/app/devotionals')
  })

  // ============================================================================
  // TESTE 5: PRIMARY INTERACTION - Navega para lista ao clicar em Voltar
  // ============================================================================
  it('deve navegar para lista ao clicar em Voltar', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockUser = fixtures.user()
    const mockDevotional = fixtures.devotional({
      id: 'devotional-1',
      title: 'Devocional Teste',
    })
    mockApiResponse('get', '/devotionals/devotional-1', mockDevotional)

    // Act
    renderWithProviders(<DevotionalDetails />, {
      initialEntries: ['/app/devotionals/devotional-1'],
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    await waitFor(() => {
      expect(screen.getByText('Voltar')).toBeInTheDocument()
    })

    const backButton = screen.getByText('Voltar')
    await user.click(backButton)

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('/app/devotionals')
  })
})

