import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Header from '@/components/Header'
import { useAuthStore } from '@/stores/authStore'
import { mockUser } from '@/test/mocks/mockData'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('Header', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null })
    vi.clearAllMocks()
  })

  it('deve renderizar o nome da aplicação', () => {
    useAuthStore.setState({ user: mockUser, token: 'token' })

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    )

    expect(screen.getByText('ChurchPulse')).toBeInTheDocument()
  })

  it('deve exibir o nome do usuário quando logado', () => {
    useAuthStore.setState({ user: mockUser, token: 'token' })

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    )

    expect(screen.getByText(mockUser.name)).toBeInTheDocument()
  })

  it('deve exibir botão de logout', () => {
    useAuthStore.setState({ user: mockUser, token: 'token' })

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    )

    const logoutButton = screen.getByTitle('Sair')
    expect(logoutButton).toBeInTheDocument()
  })

  it('deve fazer logout ao clicar no botão', async () => {
    const user = userEvent.setup()
    useAuthStore.setState({ user: mockUser, token: 'token' })

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    )

    const logoutButton = screen.getByTitle('Sair')
    await user.click(logoutButton)

    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().token).toBeNull()
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })
})


