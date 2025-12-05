import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { PlansList } from '../../../pages/Plans'
import { plansApi } from '../../../api/adminApi'
import { useAdminAuthStore } from '../../../stores/adminAuthStore'
import { AdminRole } from '../../../types'

vi.mock('../../../api/adminApi')
vi.mock('../../../stores/adminAuthStore')
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

describe('PlansList - Unit Tests', () => {
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
    ;(plansApi.getAll as any).mockResolvedValue({
      plans: [
        { id: '1', name: 'Free', price: 0, isActive: true },
        { id: '2', name: 'Pro', price: 99.99, isActive: true },
      ],
      availableFeatures: [],
    })
  })

  it('deve carregar e exibir lista de planos', async () => {
    render(
      <BrowserRouter>
        <PlansList />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(plansApi.getAll).toHaveBeenCalled()
    })

    expect(await screen.findByText('Free')).toBeInTheDocument()
    expect(await screen.findByText('Pro')).toBeInTheDocument()
  })

  it('deve mostrar botão de criar plano apenas para SUPERADMIN', async () => {
    render(
      <BrowserRouter>
        <PlansList />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Free')).toBeInTheDocument()
    })

    expect(screen.getByText(/novo plano/i)).toBeInTheDocument()
  })

  it('não deve mostrar botão de criar plano para SUPPORT', async () => {
    ;(useAdminAuthStore as any).mockReturnValue({
      adminUser: {
        id: '1',
        name: 'Support',
        email: 'support@test.com',
        adminRole: AdminRole.SUPPORT,
        isActive: true,
      },
    })

    render(
      <BrowserRouter>
        <PlansList />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Free')).toBeInTheDocument()
    })

    expect(screen.queryByText(/novo plano/i)).not.toBeInTheDocument()
  })

  it('deve ativar/desativar plano quando SUPERADMIN clica', async () => {
    const user = userEvent.setup()
    ;(plansApi.activate as any).mockResolvedValue({})
    ;(plansApi.deactivate as any).mockResolvedValue({})

    render(
      <BrowserRouter>
        <PlansList />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Free')).toBeInTheDocument()
    })

    // Simula clique no botão de desativar
    const deactivateButtons = screen.getAllByTitle(/desativar/i)
    if (deactivateButtons.length > 0) {
      await user.click(deactivateButtons[0])
      await waitFor(() => {
        expect(plansApi.deactivate).toHaveBeenCalled()
      })
    }
  })
})

