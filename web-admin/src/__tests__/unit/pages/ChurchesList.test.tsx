import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { ChurchesList } from '../../../pages/Churches/index'
import { churchesApi } from '../../../api/adminApi'
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

describe('ChurchesList - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(churchesApi.getAll as any).mockResolvedValue({
      churches: [
        { id: '1', name: 'Church 1', isActive: true, owner: { name: 'Owner 1' } },
        { id: '2', name: 'Church 2', isActive: false, owner: { name: 'Owner 2' } },
      ],
      page: 1,
      limit: 50,
      total: 2,
    })
  })

  it('deve carregar e exibir lista de igrejas', async () => {
    render(
      <BrowserRouter>
        <ChurchesList />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(churchesApi.getAll).toHaveBeenCalled()
    })

    expect(await screen.findByText('Church 1')).toBeInTheDocument()
    expect(await screen.findByText('Owner 1')).toBeInTheDocument()
  })

  it('deve filtrar igrejas por nome', async () => {
    const user = userEvent.setup()
    render(
      <BrowserRouter>
        <ChurchesList />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Church 1')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/buscar/i)
    await user.type(searchInput, 'Church 1')

    await waitFor(() => {
      expect(churchesApi.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Church 1' })
      )
    })
  })

  it('deve filtrar igrejas por status', async () => {
    const user = userEvent.setup()
    render(
      <BrowserRouter>
        <ChurchesList />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Church 1')).toBeInTheDocument()
    }, { timeout: 3000 })

    // Abre o painel de filtros
    const filterButton = screen.getByTestId('churches-filter-toggle')
    await user.click(filterButton)

    // Aguarda o painel aparecer
    await waitFor(() => {
      expect(screen.getByTestId('churches-filter-status')).toBeInTheDocument()
    })

    const statusSelect = screen.getByTestId('churches-filter-status')
    await user.selectOptions(statusSelect, 'suspended')

    await waitFor(() => {
      expect(churchesApi.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'suspended' })
      )
    })
  })
})

