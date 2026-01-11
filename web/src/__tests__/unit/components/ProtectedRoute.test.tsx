import { describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { renderWithProviders } from '@/test/renderWithProviders'
import { fixtures } from '@/test/fixtures'

describe('ProtectedRoute - Unit Tests', () => {
  beforeEach(() => {
    // Reset store antes de cada teste
  })

  // ============================================================================
  // TESTE 1: BASIC RENDER - Redirecionamento quando não há token
  // ============================================================================
  it('deve redirecionar para /login quando não há token', () => {
    // Arrange
    // Act
    renderWithProviders(
        <ProtectedRoute>
          <div>Conteúdo Protegido</div>
      </ProtectedRoute>,
      {
        authState: {
          token: null,
          user: null,
        },
      }
    )

    // Assert
    expect(screen.queryByText('Conteúdo Protegido')).not.toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 2: REDIRECT - Redirecionamento quando não tem branchId
  // ============================================================================
  it('deve redirecionar para /onboarding/start quando tem token mas não tem branchId', () => {
    // Arrange
    const mockUser = fixtures.user({
      role: '',
      branchId: '',
      onboardingCompleted: false,
    })

    // Act
    renderWithProviders(
        <ProtectedRoute>
          <div>Conteúdo Protegido</div>
      </ProtectedRoute>,
      {
        authState: {
          token: 'valid-token',
          user: mockUser,
        },
      }
    )

    // Assert
    expect(screen.queryByText('Conteúdo Protegido')).not.toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 3: REDIRECT - Redirecionamento quando não tem role
  // ============================================================================
  it('deve redirecionar para /onboarding/start quando tem token mas não tem role', () => {
    // Arrange
    const mockUser = fixtures.user({
      role: '',
      onboardingCompleted: false,
    })

    // Act
    renderWithProviders(
        <ProtectedRoute>
          <div>Conteúdo Protegido</div>
      </ProtectedRoute>,
      {
        authState: {
          token: 'valid-token',
          user: mockUser,
        },
      }
    )

    // Assert
    expect(screen.queryByText('Conteúdo Protegido')).not.toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 4: PRIMARY INTERACTION - Renderiza quando onboarding completo
  // ============================================================================
  it('deve renderizar children quando há token e usuário com onboarding completo', () => {
    // Arrange
    const mockUser = fixtures.user({
        role: 'MEMBER',
      onboardingCompleted: true,
    })

    // Act
    renderWithProviders(
        <ProtectedRoute>
          <div>Conteúdo Protegido</div>
      </ProtectedRoute>,
      {
        authState: {
          token: 'valid-token',
          user: mockUser,
        },
      }
    )

    // Assert
    expect(screen.getByText('Conteúdo Protegido')).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 5: EDGE CASE - Permite acesso quando requireOnboarding=false
  // ============================================================================
  it('deve renderizar children quando requireOnboarding=false mesmo sem onboarding completo', () => {
    // Arrange
    const mockUser = fixtures.user({
      role: '',
      branchId: '',
      onboardingCompleted: false,
    })

    // Act
    renderWithProviders(
      <ProtectedRoute requireOnboarding={false}>
        <div>Conteúdo Protegido</div>
      </ProtectedRoute>,
      {
        authState: {
          token: 'valid-token',
          user: mockUser,
        },
      }
    )

    // Assert
    expect(screen.getByText('Conteúdo Protegido')).toBeInTheDocument()
  })
})


