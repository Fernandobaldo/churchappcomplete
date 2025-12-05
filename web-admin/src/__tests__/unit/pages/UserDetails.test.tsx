import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { UserDetails } from '../../../pages/Users/UserDetails'
import { usersApi } from '../../../api/adminApi'
import { useAdminAuthStore } from '../../../stores/adminAuthStore'
import toast from 'react-hot-toast'
import { AdminRole } from '../../../types'

vi.mock('../../../api/adminApi')
vi.mock('../../../stores/adminAuthStore')
vi.mock('react-hot-toast')
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ id: 'user-1' }),
  }
})

describe('UserDetails - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useAdminAuthStore as any).mockReturnValue({
      adminUser: {
        id: '1',
        name: 'Admin',
        email: 'admin@test.com',
        adminRole: AdminRole.SUPERADMIN,
        isActive: true,
      },
    })
    ;(usersApi.getById as any).mockResolvedValue({
      id: 'user-1',
      name: 'Test User',
      email: 'test@test.com',
      isBlocked: false,
      createdAt: new Date().toISOString(),
      churches: [],
    })
  })

  it('deve carregar dados do usuário', async () => {
    render(
      <BrowserRouter>
        <UserDetails />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(usersApi.getById).toHaveBeenCalledWith('user-1')
    })

    expect(await screen.findByText('Test User')).toBeInTheDocument()
    expect(await screen.findByText('test@test.com')).toBeInTheDocument()
  })

  it('deve bloquear usuário quando confirmado', async () => {
    const user = userEvent.setup()
    ;(usersApi.block as any).mockResolvedValue({ message: 'Usuário bloqueado' })

    render(
      <BrowserRouter>
        <UserDetails />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })

    // Clica no botão de bloquear
    const blockButton = screen.getByTestId('user-details-block-button')
    await user.click(blockButton)

    await waitFor(() => {
      expect(screen.getByTestId('confirm-modal')).toBeInTheDocument()
    })

    // Confirma no modal
    const confirmButton = screen.getByTestId('confirm-modal-confirm')
    await user.click(confirmButton)

    await waitFor(() => {
      expect(usersApi.block).toHaveBeenCalledWith('user-1')
      expect(toast.success).toHaveBeenCalledWith('Usuário bloqueado com sucesso')
    })
  })

  it('deve desbloquear usuário quando confirmado', async () => {
    const user = userEvent.setup()
    ;(usersApi.getById as any).mockResolvedValue({
      id: 'user-1',
      name: 'Test User',
      email: 'test@test.com',
      isBlocked: true,
      createdAt: new Date().toISOString(),
      churches: [],
    })
    ;(usersApi.unblock as any).mockResolvedValue({ message: 'Usuário desbloqueado' })

    render(
      <BrowserRouter>
        <UserDetails />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })

    // Clica no botão de desbloquear
    const unblockButton = screen.getByTestId('user-details-unblock-button')
    await user.click(unblockButton)

    await waitFor(() => {
      expect(screen.getByTestId('confirm-modal')).toBeInTheDocument()
    })

    // Confirma no modal
    const confirmButton = screen.getByTestId('confirm-modal-confirm')
    await user.click(confirmButton)

    await waitFor(() => {
      expect(usersApi.unblock).toHaveBeenCalledWith('user-1')
      expect(toast.success).toHaveBeenCalledWith('Usuário desbloqueado com sucesso')
    })
  })

  it('deve resetar senha do usuário', async () => {
    const user = userEvent.setup()
    ;(usersApi.resetPassword as any).mockResolvedValue({ message: 'Email enviado' })

    render(
      <BrowserRouter>
        <UserDetails />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })

    const resetButton = screen.getByTestId('user-details-reset-password-button')
    await user.click(resetButton)

    await waitFor(() => {
      expect(screen.getByTestId('confirm-modal')).toBeInTheDocument()
    })

    // Confirma no modal
    const confirmButton = screen.getByTestId('confirm-modal-confirm')
    await user.click(confirmButton)

    await waitFor(() => {
      expect(usersApi.resetPassword).toHaveBeenCalledWith('user-1')
      expect(toast.success).toHaveBeenCalledWith('Link de reset de senha enviado')
    })
  })
})

