import { describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import Layout from '@/components/Layout'
import { useAuthStore } from '@/stores/authStore'
import { fixtures } from '@/test/fixtures'
import { renderWithProviders } from '@/test/helpers'

describe('Layout - Unit Tests', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null })
  })

  // ============================================================================
  // TESTE 1: BASIC RENDER - Renderiza Header e Sidebar
  // ============================================================================
  it('deve renderizar Header e Sidebar', () => {
    // Arrange
    const mockUser = fixtures.user({ role: 'ADMINGERAL' })

    // Act
    renderWithProviders(<Layout />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    expect(screen.getByText('ChurchPulse')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 2: BASIC RENDER - Renderiza outlet para conteúdo das páginas
  // ============================================================================
  it('deve renderizar outlet para conteúdo das páginas', () => {
    // Arrange
    const mockUser = fixtures.user({ role: 'ADMINGERAL' })

    // Act
    renderWithProviders(<Layout />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    const main = screen.getByRole('main')
    expect(main).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 3: STRUCTURE - Verifica estrutura do layout
  // ============================================================================
  it('deve ter estrutura correta com Header, Sidebar e main', () => {
    // Arrange
    const mockUser = fixtures.user({ role: 'ADMINGERAL' })

    // Act
    renderWithProviders(<Layout />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    const header = screen.getByText('ChurchPulse').closest('header')
    expect(header).toBeInTheDocument()
    
    const sidebar = screen.getByText('Dashboard').closest('aside')
    expect(sidebar).toBeInTheDocument()
    
    const main = screen.getByRole('main')
    expect(main).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 4: INTEGRATION - Header e Sidebar estão integrados corretamente
  // ============================================================================
  it('deve integrar Header e Sidebar corretamente no layout', () => {
    // Arrange
    const mockUser = fixtures.user({ role: 'ADMINGERAL', name: 'João Silva' })

    // Act
    renderWithProviders(<Layout />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    // Header mostra nome do usuário
    expect(screen.getByText('João Silva')).toBeInTheDocument()
    // Sidebar mostra itens do menu
    expect(screen.getByText('Eventos')).toBeInTheDocument()
    expect(screen.getByText('Contribuições')).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 5: ERROR STATE - Layout funciona mesmo sem usuário (Header/Sidebar podem lidar)
  // ============================================================================
  it('deve renderizar estrutura mesmo sem usuário autenticado', () => {
    // Arrange & Act
    renderWithProviders(<Layout />, {
      authState: {
        user: null,
        token: null,
      },
    })

    // Assert
    // Header ainda deve renderizar (mostra ChurchPulse)
    expect(screen.getByText('ChurchPulse')).toBeInTheDocument()
    // Main deve estar presente
    const main = screen.getByRole('main')
    expect(main).toBeInTheDocument()
  })
})



  it('deve renderizar outlet para conteúdo das páginas', () => {
    // Arrange
    const mockUser = fixtures.user({ role: 'ADMINGERAL' })

    // Act
    renderWithProviders(<Layout />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    const main = screen.getByRole('main')
    expect(main).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 3: STRUCTURE - Verifica estrutura do layout
  // ============================================================================
  it('deve ter estrutura correta com Header, Sidebar e main', () => {
    // Arrange
    const mockUser = fixtures.user({ role: 'ADMINGERAL' })

    // Act
    renderWithProviders(<Layout />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    const header = screen.getByText('ChurchPulse').closest('header')
    expect(header).toBeInTheDocument()
    
    const sidebar = screen.getByText('Dashboard').closest('aside')
    expect(sidebar).toBeInTheDocument()
    
    const main = screen.getByRole('main')
    expect(main).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 4: INTEGRATION - Header e Sidebar estão integrados corretamente
  // ============================================================================
  it('deve integrar Header e Sidebar corretamente no layout', () => {
    // Arrange
    const mockUser = fixtures.user({ role: 'ADMINGERAL', name: 'João Silva' })

    // Act
    renderWithProviders(<Layout />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    // Header mostra nome do usuário
    expect(screen.getByText('João Silva')).toBeInTheDocument()
    // Sidebar mostra itens do menu
    expect(screen.getByText('Eventos')).toBeInTheDocument()
    expect(screen.getByText('Contribuições')).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 5: ERROR STATE - Layout funciona mesmo sem usuário (Header/Sidebar podem lidar)
  // ============================================================================
  it('deve renderizar estrutura mesmo sem usuário autenticado', () => {
    // Arrange & Act
    renderWithProviders(<Layout />, {
      authState: {
        user: null,
        token: null,
      },
    })

    // Assert
    // Header ainda deve renderizar (mostra ChurchPulse)
    expect(screen.getByText('ChurchPulse')).toBeInTheDocument()
    // Main deve estar presente
    const main = screen.getByRole('main')
    expect(main).toBeInTheDocument()
  })
})


