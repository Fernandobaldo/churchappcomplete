import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Members from '@/pages/Members/index'
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

describe('Members - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // TESTE 1: BASIC RENDER - Renderiza a página corretamente
  // ============================================================================
  it('deve renderizar a página corretamente', async () => {
    // Arrange
    const mockUser = fixtures.user()
    mockApiResponse('get', '/members', [])

    // Act
    renderWithProviders(<Members />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Membros')).toBeInTheDocument()
      expect(screen.getByText('Novo Membro')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // TESTE 2: PRIMARY INTERACTION - Exibe lista de membros
  // ============================================================================
  it('deve exibir lista de membros', async () => {
    // Arrange
    const mockUser = fixtures.user()
    const mockMembers = [
      {
        id: 'member-1',
        name: 'João Silva',
        email: 'joao@example.com',
        role: 'MEMBER',
        branchId: 'branch-123',
        permissions: [],
      },
      {
        id: 'member-2',
        name: 'Maria Santos',
        email: 'maria@example.com',
        role: 'COORDINATOR',
        branchId: 'branch-123',
        permissions: [{ type: 'events_manage' }],
      },
    ]
    mockApiResponse('get', '/members', mockMembers)

    // Act
    renderWithProviders(<Members />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument()
      expect(screen.getByText('Maria Santos')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // TESTE 3: PRIMARY INTERACTION - Navega para criar membro
  // ============================================================================
  it('deve navegar para criar membro ao clicar em Novo Membro', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockUser = fixtures.user()
    mockApiResponse('get', '/members', [])

    // Act
    renderWithProviders(<Members />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    const newButton = await screen.findByText('Novo Membro')
    await user.click(newButton)

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('/app/members/new')
  })

  // ============================================================================
  // TESTE 4: PRIMARY INTERACTION - Navega para detalhes do membro
  // ============================================================================
  it('deve navegar para detalhes do membro ao clicar no card', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockUser = fixtures.user()
    const mockMembers = [
      {
        id: 'member-1',
        name: 'João Silva',
        email: 'joao@example.com',
        role: 'MEMBER',
        branchId: 'branch-123',
        permissions: [],
      },
    ]
    mockApiResponse('get', '/members', mockMembers)

    // Act
    renderWithProviders(<Members />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument()
    })

    const memberCard = screen.getByText('João Silva').closest('div[class*="border"]')
    if (memberCard) {
      await user.click(memberCard)
    }

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('/app/members/member-1')
  })

  // ============================================================================
  // TESTE 5: ERROR STATE - Exibe erro quando falha ao carregar membros
  // ============================================================================
  it('deve exibir erro quando falha ao carregar membros', async () => {
    // Arrange
    const mockUser = fixtures.user()
    mockApiError('get', '/members', { message: 'Erro na API' })

    // Act
    renderWithProviders(<Members />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Erro ao carregar membros')
    })
  })
})


