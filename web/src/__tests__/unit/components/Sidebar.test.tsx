import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Sidebar from '@/components/Sidebar'
import { useAuthStore } from '@/stores/authStore'
import { mockUser } from '@/test/mocks/mockData'

describe('Sidebar', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null })
  })

  it('deve renderizar todos os itens do menu', () => {
    useAuthStore.setState({ user: mockUser, token: 'token' })

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Eventos')).toBeInTheDocument()
    expect(screen.getByText('Contribuições')).toBeInTheDocument()
    expect(screen.getByText('Devocionais')).toBeInTheDocument()
    expect(screen.getByText('Membros')).toBeInTheDocument()
    expect(screen.getByText('Perfil')).toBeInTheDocument()
  })

  it('deve mostrar item de Permissões para ADMINGERAL', () => {
    useAuthStore.setState({ user: mockUser, token: 'token' })

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )

    expect(screen.getByText('Permissões')).toBeInTheDocument()
  })

  it('não deve mostrar Permissões para usuário sem permissão', () => {
    const memberUser = {
      ...mockUser,
      role: 'MEMBER',
      permissions: [],
    }
    useAuthStore.setState({ user: memberUser, token: 'token' })

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )

    expect(screen.queryByText('Permissões')).not.toBeInTheDocument()
  })

  it('deve destacar item ativo', () => {
    useAuthStore.setState({ user: mockUser, token: 'token' })

    render(
      <MemoryRouter initialEntries={['/app/dashboard']}>
        <Sidebar />
      </MemoryRouter>
    )

    const dashboardLink = screen.getByText('Dashboard').closest('a')
    expect(dashboardLink).toHaveClass('bg-primary', 'text-white')
  })

  it('deve ter paths corretos com prefixo /app', () => {
    useAuthStore.setState({ user: mockUser, token: 'token' })

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )

    // Verifica que os links têm o prefixo /app
    expect(screen.getByText('Dashboard').closest('a')).toHaveAttribute('href', '/app/dashboard')
    expect(screen.getByText('Eventos').closest('a')).toHaveAttribute('href', '/app/events')
    expect(screen.getByText('Contribuições').closest('a')).toHaveAttribute('href', '/app/contributions')
    expect(screen.getByText('Devocionais').closest('a')).toHaveAttribute('href', '/app/devotionals')
    expect(screen.getByText('Membros').closest('a')).toHaveAttribute('href', '/app/members')
    expect(screen.getByText('Perfil').closest('a')).toHaveAttribute('href', '/app/profile')
  })
})


