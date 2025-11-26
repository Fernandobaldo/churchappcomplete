import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import Sidebar from '@/components/Sidebar'
import { useAuthStore } from '@/stores/authStore'
import { mockUser } from '@/test/mocks/mockData'

describe('Sidebar Navigation', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: mockUser, token: 'token' })
    vi.clearAllMocks()
  })

  it('deve ter link para /app/dashboard no item Dashboard', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )

    const dashboardLink = screen.getByText('Dashboard').closest('a')
    expect(dashboardLink).toHaveAttribute('href', '/app/dashboard')
  })

  it('deve ter link para /app/events no item Eventos', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )

    const eventsLink = screen.getByText('Eventos').closest('a')
    expect(eventsLink).toHaveAttribute('href', '/app/events')
  })

  it('deve ter link para /app/contributions no item Contribuições', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )

    const contributionsLink = screen.getByText('Contribuições').closest('a')
    expect(contributionsLink).toHaveAttribute('href', '/app/contributions')
  })

  it('deve ter link para /app/devotionals no item Devocionais', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )

    const devotionalsLink = screen.getByText('Devocionais').closest('a')
    expect(devotionalsLink).toHaveAttribute('href', '/app/devotionals')
  })

  it('deve ter link para /app/members no item Membros', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )

    const membersLink = screen.getByText('Membros').closest('a')
    expect(membersLink).toHaveAttribute('href', '/app/members')
  })

  it('deve ter link para /app/profile no item Perfil', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )

    const profileLink = screen.getByText('Perfil').closest('a')
    expect(profileLink).toHaveAttribute('href', '/app/profile')
  })
})

