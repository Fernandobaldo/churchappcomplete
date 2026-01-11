import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Finances from '@/pages/Finances/index'
import { fixtures } from '@/test/fixtures'
import { renderWithProviders } from '@/test/helpers'
import { mockApiResponse, mockApiError } from '@/test/mockApi'
import { useAuthStore } from '@/stores/authStore'

vi.mock('@/api/api')
const mockToastError = vi.fn()
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
  }
})

vi.mock('@/components/PermissionGuard', () => ({
  default: ({ children, permission }: any) => {
    const { user } = useAuthStore.getState()
    if (!user) return null
    
    const hasPermission = 
      user.role === 'ADMINGERAL' || 
      user.role === 'ADMINFILIAL' ||
      user.permissions?.some((p: any) => {
        const permType = typeof p === 'object' ? p.type : p
        return permType === permission
      }) === true
    
    return hasPermission ? <>{children}</> : null
  },
}))

describe('Finances - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // TESTE 1: BASIC RENDER - Renderiza a página corretamente
  // ============================================================================
  it('deve renderizar a página corretamente', async () => {
    // Arrange
    const mockUser = fixtures.user({ permissions: [{ type: 'finances_manage' }] })
    mockApiResponse('get', '/finances', {
      transactions: [],
      summary: {
        total: 0,
        entries: 0,
        exits: 0,
      },
    })

    // Act
    renderWithProviders(<Finances />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Finanças')).toBeInTheDocument()
      expect(screen.getByText('Gestão financeira da filial')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // TESTE 2: BASIC RENDER - Exibe resumo financeiro
  // ============================================================================
  it('deve exibir resumo financeiro', async () => {
    // Arrange
    const mockUser = fixtures.user({ permissions: [{ type: 'finances_manage' }] })
    mockApiResponse('get', '/finances', {
      transactions: [],
      summary: {
        total: 1200.0,
        entries: 1500.0,
        exits: 300.0,
      },
    })

    // Act
    renderWithProviders(<Finances />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      const saldoLabel = screen.getByText('Saldo Total')
      expect(saldoLabel).toBeInTheDocument()
      const saldoCard = saldoLabel.closest('.card')
      expect(saldoCard?.textContent).toContain('R$')
      expect(saldoCard?.textContent).toContain('1200,00')
      
      const entradasLabel = screen.getByText('Entradas')
      expect(entradasLabel).toBeInTheDocument()
      
      const saidasLabel = screen.getByText('Saídas')
      expect(saidasLabel).toBeInTheDocument()
    })
  })

  // ============================================================================
  // TESTE 3: EMPTY STATE - Exibe mensagem quando não há transações
  // ============================================================================
  it('deve exibir mensagem quando não há transações', async () => {
    // Arrange
    const mockUser = fixtures.user({ permissions: [{ type: 'finances_manage' }] })
    mockApiResponse('get', '/finances', {
      transactions: [],
      summary: {
        total: 0,
        entries: 0,
        exits: 0,
      },
    })

    // Act
    renderWithProviders(<Finances />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Nenhuma transação cadastrada')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // TESTE 4: PRIMARY INTERACTION - Navega para criar transação
  // ============================================================================
  it('deve navegar para criar transação ao clicar em Nova Transação', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockUser = fixtures.user({ permissions: [{ type: 'finances_manage' }] })
    mockApiResponse('get', '/finances', {
      transactions: [],
      summary: {
        total: 0,
        entries: 0,
        exits: 0,
      },
    })

    // Act
    renderWithProviders(<Finances />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    const newButton = await screen.findByText('Nova Transação')
    await user.click(newButton)

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('/app/finances/new')
  })

  // ============================================================================
  // TESTE 5: ERROR STATE - Exibe erro quando falha ao carregar finanças
  // ============================================================================
  it('deve exibir erro quando falha ao carregar finanças', async () => {
    // Arrange
    const mockUser = fixtures.user({ permissions: [{ type: 'finances_manage' }] })
    mockApiError('get', '/finances', { message: 'Erro na API' })

    // Act
    renderWithProviders(<Finances />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalled()
    })
  })
})

import userEvent from '@testing-library/user-event'
import Finances from '@/pages/Finances/index'
import { fixtures } from '@/test/fixtures'
import { renderWithProviders } from '@/test/helpers'
import { mockApiResponse, mockApiError } from '@/test/mockApi'
import { useAuthStore } from '@/stores/authStore'

vi.mock('@/api/api')
const mockToastError = vi.fn()
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
  }
})

vi.mock('@/components/PermissionGuard', () => ({
  default: ({ children, permission }: any) => {
    const { user } = useAuthStore.getState()
    if (!user) return null
    
    const hasPermission = 
      user.role === 'ADMINGERAL' || 
      user.role === 'ADMINFILIAL' ||
      user.permissions?.some((p: any) => {
        const permType = typeof p === 'object' ? p.type : p
        return permType === permission
      }) === true
    
    return hasPermission ? <>{children}</> : null
  },
}))

describe('Finances - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // TESTE 1: BASIC RENDER - Renderiza a página corretamente
  // ============================================================================
  it('deve renderizar a página corretamente', async () => {
    // Arrange
    const mockUser = fixtures.user({ permissions: [{ type: 'finances_manage' }] })
    mockApiResponse('get', '/finances', {
      transactions: [],
      summary: {
        total: 0,
        entries: 0,
        exits: 0,
      },
    })

    // Act
    renderWithProviders(<Finances />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Finanças')).toBeInTheDocument()
      expect(screen.getByText('Gestão financeira da filial')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // TESTE 2: BASIC RENDER - Exibe resumo financeiro
  // ============================================================================
  it('deve exibir resumo financeiro', async () => {
    // Arrange
    const mockUser = fixtures.user({ permissions: [{ type: 'finances_manage' }] })
    mockApiResponse('get', '/finances', {
      transactions: [],
      summary: {
        total: 1200.0,
        entries: 1500.0,
        exits: 300.0,
      },
    })

    // Act
    renderWithProviders(<Finances />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      const saldoLabel = screen.getByText('Saldo Total')
      expect(saldoLabel).toBeInTheDocument()
      const saldoCard = saldoLabel.closest('.card')
      expect(saldoCard?.textContent).toContain('R$')
      expect(saldoCard?.textContent).toContain('1200,00')
      
      const entradasLabel = screen.getByText('Entradas')
      expect(entradasLabel).toBeInTheDocument()
      
      const saidasLabel = screen.getByText('Saídas')
      expect(saidasLabel).toBeInTheDocument()
    })
  })

  // ============================================================================
  // TESTE 3: EMPTY STATE - Exibe mensagem quando não há transações
  // ============================================================================
  it('deve exibir mensagem quando não há transações', async () => {
    // Arrange
    const mockUser = fixtures.user({ permissions: [{ type: 'finances_manage' }] })
    mockApiResponse('get', '/finances', {
      transactions: [],
      summary: {
        total: 0,
        entries: 0,
        exits: 0,
      },
    })

    // Act
    renderWithProviders(<Finances />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Nenhuma transação cadastrada')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // TESTE 4: PRIMARY INTERACTION - Navega para criar transação
  // ============================================================================
  it('deve navegar para criar transação ao clicar em Nova Transação', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockUser = fixtures.user({ permissions: [{ type: 'finances_manage' }] })
    mockApiResponse('get', '/finances', {
      transactions: [],
      summary: {
        total: 0,
        entries: 0,
        exits: 0,
      },
    })

    // Act
    renderWithProviders(<Finances />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    const newButton = await screen.findByText('Nova Transação')
    await user.click(newButton)

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('/app/finances/new')
  })

  // ============================================================================
  // TESTE 5: ERROR STATE - Exibe erro quando falha ao carregar finanças
  // ============================================================================
  it('deve exibir erro quando falha ao carregar finanças', async () => {
    // Arrange
    const mockUser = fixtures.user({ permissions: [{ type: 'finances_manage' }] })
    mockApiError('get', '/finances', { message: 'Erro na API' })

    // Act
    renderWithProviders(<Finances />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalled()
    })
  })
})
