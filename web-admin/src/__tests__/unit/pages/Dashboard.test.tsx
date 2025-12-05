import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { Dashboard } from '../../../pages/Dashboard'
import { dashboardApi } from '../../../api/adminApi'
import toast from 'react-hot-toast'

vi.mock('../../../api/adminApi')
vi.mock('react-hot-toast')

describe('Dashboard - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(dashboardApi.getStats as any).mockResolvedValue({
      totalUsers: 100,
      totalChurches: 50,
      totalMembers: 500,
      totalBranches: 75,
      newUsersLast30Days: 10,
      newChurchesLast30Days: 5,
      churchesByPlan: [
        { planName: 'Free', count: 30 },
        { planName: 'Pro', count: 20 },
      ],
    })
  })

  it('deve carregar e exibir estatísticas', async () => {
    render(<Dashboard />)

    await waitFor(() => {
      expect(dashboardApi.getStats).toHaveBeenCalled()
    })

    expect(await screen.findByTestId('dashboard-stat-users')).toBeInTheDocument()
    expect(await screen.findByTestId('dashboard-stat-churches')).toBeInTheDocument()
    expect(await screen.findByTestId('dashboard-stat-members')).toBeInTheDocument()
  })

  it('deve mostrar erro quando falhar ao carregar', async () => {
    ;(dashboardApi.getStats as any).mockRejectedValue(new Error('Erro'))

    render(<Dashboard />)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Erro ao carregar estatísticas')
    })
  })

  it('deve exibir loading inicialmente', () => {
    ;(dashboardApi.getStats as any).mockImplementation(
      () => new Promise(() => {}) // Nunca resolve
    )

    render(<Dashboard />)

    expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument()
  })
})

