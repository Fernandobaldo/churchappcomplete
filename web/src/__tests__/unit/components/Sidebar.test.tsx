import { describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import Sidebar from '@/components/Sidebar'
import { useAuthStore } from '@/stores/authStore'
import { fixtures } from '@/test/fixtures'
import { renderWithProviders } from '@/test/helpers'

describe('Sidebar - Unit Tests', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null })
  })

  // ============================================================================
  // TESTE 1: BASIC RENDER - Renderiza todos os itens do menu
  // ============================================================================
  it('deve renderizar todos os itens do menu', () => {
    // Arrange
    const mockUser = fixtures.user({ role: 'ADMINGERAL' })

    // Act
    renderWithProviders(<Sidebar />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Eventos')).toBeInTheDocument()
    expect(screen.getByText('Contribuições')).toBeInTheDocument()
    expect(screen.getByText('Devocionais')).toBeInTheDocument()
    expect(screen.getByText('Membros')).toBeInTheDocument()
    expect(screen.getByText('Perfil')).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 2: PERMISSION CHECK - Mostra item de Permissões para ADMINGERAL
  // ============================================================================
  it('deve mostrar item de Permissões para ADMINGERAL', () => {
    // Arrange
    const mockUser = fixtures.user({ role: 'ADMINGERAL' })

    // Act
    renderWithProviders(<Sidebar />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    expect(screen.getByText('Permissões')).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 3: PERMISSION CHECK - Não mostra Permissões para usuário sem permissão
  // ============================================================================
  it('não deve mostrar Permissões para usuário sem permissão', () => {
    // Arrange
    const memberUser = fixtures.user({
      role: 'MEMBER',
      permissions: [],
    })

    // Act
    renderWithProviders(<Sidebar />, {
      authState: {
        user: memberUser,
        token: 'token',
      },
    })

    // Assert
    expect(screen.queryByText('Permissões')).not.toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 4: ACTIVE STATE - Destaca item ativo
  // ============================================================================
  it('deve destacar item ativo', () => {
    // Arrange
    const mockUser = fixtures.user({ role: 'ADMINGERAL' })

    // Act
    renderWithProviders(<Sidebar />, {
      initialEntries: ['/app/dashboard'],
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    const dashboardLink = screen.getByText('Dashboard').closest('a')
    expect(dashboardLink).toHaveClass('bg-primary', 'text-white')
  })

  // ============================================================================
  // TESTE 5: NAVIGATION PATHS - Verifica paths corretos com prefixo /app
  // ============================================================================
  it('deve ter paths corretos com prefixo /app', () => {
    // Arrange
    const mockUser = fixtures.user({ role: 'ADMINGERAL' })

    // Act
    renderWithProviders(<Sidebar />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    expect(screen.getByText('Dashboard').closest('a')).toHaveAttribute('href', '/app/dashboard')
    expect(screen.getByText('Eventos').closest('a')).toHaveAttribute('href', '/app/events')
    expect(screen.getByText('Contribuições').closest('a')).toHaveAttribute('href', '/app/contributions')
    expect(screen.getByText('Devocionais').closest('a')).toHaveAttribute('href', '/app/devotionals')
    expect(screen.getByText('Membros').closest('a')).toHaveAttribute('href', '/app/members')
    expect(screen.getByText('Perfil').closest('a')).toHaveAttribute('href', '/app/profile')
  })
})


