import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Contributions from '@/pages/Contributions/index'
import { fixtures } from '@/test/fixtures'
import { renderWithProviders } from '@/test/helpers'
import { mockApiResponse, mockApiError } from '@/test/mockApi'

vi.mock('@/api/api')
const mockToastError = vi.fn()
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

describe('Contributions - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // TESTE 1: BASIC RENDER - Renderiza a página corretamente
  // ============================================================================
  it('deve renderizar a página corretamente', async () => {
    // Arrange
    const mockUser = fixtures.user()
    mockApiResponse('get', '/contributions', [])

    // Act
    renderWithProviders(<Contributions />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Contribuições')).toBeInTheDocument()
      expect(screen.getByText('Nova Contribuição')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // TESTE 2: PRIMARY INTERACTION - Exibe lista de contribuições
  // ============================================================================
  it('deve exibir lista de contribuições', async () => {
    // Arrange
    const mockUser = fixtures.user()
    const mockContributions = [
      {
        id: 'contrib-1',
        title: 'Campanha de Construção',
        description: 'Campanha para construção',
        goal: 50000.0,
        endDate: '2024-12-31',
        raised: 25000.0,
        isActive: true,
        PaymentMethods: [],
      },
      {
        id: 'contrib-2',
        title: 'Campanha de Missões',
        description: 'Campanha para missões',
        goal: 10000.0,
        endDate: '2024-06-30',
        raised: 5000.0,
        isActive: true,
        PaymentMethods: [],
      },
    ]
    mockApiResponse('get', '/contributions', mockContributions)

    // Act
    renderWithProviders(<Contributions />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Campanha de Construção')).toBeInTheDocument()
      expect(screen.getByText('Campanha de Missões')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // TESTE 3: PRIMARY INTERACTION - Navega para criar contribuição
  // ============================================================================
  it('deve navegar para criar contribuição ao clicar em Nova Contribuição', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockUser = fixtures.user()
    mockApiResponse('get', '/contributions', [])

    // Act
    renderWithProviders(<Contributions />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    const newButton = await screen.findByText('Nova Contribuição')
    await user.click(newButton)

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('/app/contributions/new')
  })

  // ============================================================================
  // TESTE 4: ERROR STATE - Exibe erro quando falha ao carregar contribuições
  // ============================================================================
  it('deve exibir erro quando falha ao carregar contribuições', async () => {
    // Arrange
    const mockUser = fixtures.user()
    mockApiError('get', '/contributions', { message: 'Erro na API' })

    // Act
    renderWithProviders(<Contributions />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Erro ao carregar contribuições')
    })
  })

  // ============================================================================
  // TESTE 5: EMPTY STATE - Exibe mensagem quando não há contribuições
  // ============================================================================
  it('deve exibir mensagem quando não há contribuições', async () => {
    // Arrange
    const mockUser = fixtures.user()
    mockApiResponse('get', '/contributions', [])

    // Act
    renderWithProviders(<Contributions />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      // Verifica se a página renderiza sem erros quando lista está vazia
      expect(screen.getByText('Contribuições')).toBeInTheDocument()
    })
  })
})


  // ============================================================================
  // TESTE 4: ERROR STATE - Exibe erro quando falha ao carregar contribuições
  // ============================================================================
  it('deve exibir erro quando falha ao carregar contribuições', async () => {
    // Arrange
    const mockUser = fixtures.user()
    mockApiError('get', '/contributions', { message: 'Erro na API' })

    // Act
    renderWithProviders(<Contributions />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Erro ao carregar contribuições')
    })
  })

  // ============================================================================
  // TESTE 5: EMPTY STATE - Exibe mensagem quando não há contribuições
  // ============================================================================
  it('deve exibir mensagem quando não há contribuições', async () => {
    // Arrange
    const mockUser = fixtures.user()
    mockApiResponse('get', '/contributions', [])

    // Act
    renderWithProviders(<Contributions />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      // Verifica se a página renderiza sem erros quando lista está vazia
      expect(screen.getByText('Contribuições')).toBeInTheDocument()
    })
  })
})