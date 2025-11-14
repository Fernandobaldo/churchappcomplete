import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuthStore } from '@/stores/authStore'

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, user: null })
  })

  it('deve redirecionar para /login quando não há token', () => {
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Conteúdo Protegido</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    // Verifica se redirecionou (não mostra o conteúdo)
    expect(screen.queryByText('Conteúdo Protegido')).not.toBeInTheDocument()
  })

  it('deve renderizar children quando há token', () => {
    useAuthStore.setState({ token: 'valid-token' })

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Conteúdo Protegido</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    expect(screen.getByText('Conteúdo Protegido')).toBeInTheDocument()
  })

  it('deve renderizar children quando há token e usuário', () => {
    useAuthStore.setState({
      token: 'valid-token',
      user: {
        id: 'user-123',
        name: 'Test',
        email: 'test@example.com',
        role: 'MEMBER',
        branchId: 'branch-123',
        permissions: [],
        token: 'valid-token',
      },
    })

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Conteúdo Protegido</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    expect(screen.getByText('Conteúdo Protegido')).toBeInTheDocument()
  })
})


