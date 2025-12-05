import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { UsersList } from '../../../pages/Users/index'
import { usersApi } from '../../../api/adminApi'
import toast from 'react-hot-toast'

vi.mock('../../../api/adminApi')
vi.mock('react-hot-toast')
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

describe('UsersList - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(usersApi.getAll as any).mockResolvedValue({
      users: [
        { id: '1', name: 'User 1', email: 'user1@test.com', isBlocked: false, createdAt: new Date().toISOString() },
        { id: '2', name: 'User 2', email: 'user2@test.com', isBlocked: true, createdAt: new Date().toISOString() },
      ],
      page: 1,
      limit: 50,
      total: 2,
    })
  })

  it('deve carregar e exibir lista de usuários', async () => {
    render(
      <BrowserRouter>
        <UsersList />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(usersApi.getAll).toHaveBeenCalled()
    })

    // Aguarda os dados serem renderizados
    await waitFor(() => {
      expect(screen.getByText('User 1')).toBeInTheDocument()
    }, { timeout: 3000 })

    expect(screen.getByText('user1@test.com')).toBeInTheDocument()
  })

  it('deve filtrar usuários por busca', async () => {
    const user = userEvent.setup()
    render(
      <BrowserRouter>
        <UsersList />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('User 1')).toBeInTheDocument()
    }, { timeout: 3000 })

    const searchInput = screen.getByTestId('users-search-input')
    await user.type(searchInput, 'user1')

    await waitFor(() => {
      expect(usersApi.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'user1' })
      )
    })
  })

  it('deve filtrar usuários por status', async () => {
    const user = userEvent.setup()
    render(
      <BrowserRouter>
        <UsersList />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('User 1')).toBeInTheDocument()
    }, { timeout: 3000 })

    // Abre o painel de filtros
    const filterButton = screen.getByTestId('users-filter-toggle')
    await user.click(filterButton)

    // Aguarda o painel aparecer
    await waitFor(() => {
      expect(screen.getByTestId('users-filter-status')).toBeInTheDocument()
    })

    const statusSelect = screen.getByTestId('users-filter-status')
    await user.selectOptions(statusSelect, 'blocked')

    await waitFor(() => {
      expect(usersApi.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'blocked' })
      )
    })
  })

  it('deve mostrar erro quando falhar ao carregar', async () => {
    ;(usersApi.getAll as any).mockRejectedValue(new Error('Erro'))

    render(
      <BrowserRouter>
        <UsersList />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Erro ao carregar usuários')
    })
  })
})

