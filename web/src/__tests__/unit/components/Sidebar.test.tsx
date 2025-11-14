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
      <MemoryRouter initialEntries={['/dashboard']}>
        <Sidebar />
      </MemoryRouter>
    )

    const dashboardLink = screen.getByText('Dashboard').closest('a')
    expect(dashboardLink).toHaveClass('bg-primary', 'text-white')
  })
})


