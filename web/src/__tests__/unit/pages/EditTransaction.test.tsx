import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import EditTransaction from '@/pages/Finances/EditTransaction'
import api from '@/api/api'
import { useAuthStore } from '@/stores/authStore'
import { mockUser } from '@/test/mocks/mockData'

vi.mock('@/api/api', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}))

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/components/MemberSearch', () => ({
  default: ({ value, onChange, placeholder }: any) => (
    <div>
      <input
        data-testid="member-search-input"
        value={value || ''}
        onChange={(e) => onChange && onChange(e.target.value, e.target.value)}
        placeholder={placeholder}
      />
    </div>
  ),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: 'trans-1' }),
  }
})

describe('EditTransaction Page', () => {
  beforeEach(() => {
    useAuthStore.setState({
      token: 'token',
      user: mockUser,
    })
    vi.clearAllMocks()
  })

  it('deve carregar dados da transação existente', async () => {
    const mockTransaction = {
      id: 'trans-1',
      title: 'Transação Original',
      amount: 500.0,
      type: 'ENTRY',
      entryType: 'OFERTA',
      category: 'Oferta',
      branchId: 'branch-123',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    }

    vi.mocked(api.get).mockResolvedValue({ data: mockTransaction })

    render(
      <MemoryRouter>
        <EditTransaction />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/finances/trans-1')
    })

    await waitFor(() => {
      const titleInput = document.getElementById('title') as HTMLInputElement
      expect(titleInput).toBeInTheDocument()
      expect(titleInput.value).toBe('Transação Original')
      
      const amountInput = document.getElementById('amount') as HTMLInputElement
      expect(amountInput.value).toBe('500')
      
      const categoryInput = document.getElementById('category') as HTMLInputElement
      expect(categoryInput.value).toBe('Oferta')
    })
  })

  it('deve preencher campos de transação de saída com exitType', async () => {
    const mockTransaction = {
      id: 'trans-1',
      title: 'Aluguel',
      amount: 1500.0,
      type: 'EXIT',
      exitType: 'ALUGUEL',
      exitTypeOther: null,
      category: 'Despesas',
      branchId: 'branch-123',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    }

    vi.mocked(api.get).mockResolvedValue({ data: mockTransaction })

    render(
      <MemoryRouter>
        <EditTransaction />
      </MemoryRouter>
    )

    await waitFor(() => {
      const titleInput = document.getElementById('title') as HTMLInputElement
      expect(titleInput.value).toBe('Aluguel')
      
      const exitTypeSelect = document.getElementById('exitType') as HTMLSelectElement
      expect(exitTypeSelect).toBeInTheDocument()
      expect(exitTypeSelect.value).toBe('ALUGUEL')
    })
  })

  it('deve preencher campos de transação com tipo CONTRIBUICAO', async () => {
    vi.mocked(api.get).mockImplementation((url) => {
      if (url === '/finances/trans-1') {
        return Promise.resolve({
          data: {
            id: 'trans-1',
            title: 'Transação de Contribuição',
            amount: 500.0,
            type: 'ENTRY',
            entryType: 'CONTRIBUICAO',
            contributionId: 'contrib-1',
            category: 'Contribuição',
            branchId: 'branch-123',
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-15T10:00:00Z',
          },
        })
      }
      if (url === '/contributions') {
        return Promise.resolve({
          data: [
            { id: 'contrib-1', title: 'Contribuição Teste', description: 'Descrição' },
          ],
        })
      }
      return Promise.reject(new Error('Not found'))
    })

    render(
      <MemoryRouter>
        <EditTransaction />
      </MemoryRouter>
    )

    await waitFor(() => {
      const titleInput = document.getElementById('title') as HTMLInputElement
      expect(titleInput.value).toBe('Transação de Contribuição')
      
      const entryTypeSelect = document.getElementById('entryType') as HTMLSelectElement
      expect(entryTypeSelect.value).toBe('CONTRIBUICAO')
      
      const contributionSelect = document.getElementById('contributionId') as HTMLSelectElement
      expect(contributionSelect).toBeInTheDocument()
      expect(contributionSelect.value).toBe('contrib-1')
    })
  })

  it('deve atualizar transação com sucesso', async () => {
    const toast = await import('react-hot-toast')
    const mockTransaction = {
      id: 'trans-1',
      title: 'Transação Original',
      amount: 500.0,
      type: 'ENTRY',
      entryType: 'OFERTA',
      category: 'Oferta',
      branchId: 'branch-123',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    }

    vi.mocked(api.get).mockResolvedValue({ data: mockTransaction })
    vi.mocked(api.put).mockResolvedValue({ data: { ...mockTransaction, title: 'Atualizada' } })

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <EditTransaction />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(document.getElementById('title')).toBeInTheDocument()
    })

    const titleInput = document.getElementById('title') as HTMLInputElement
    await user.clear(titleInput)
    await user.type(titleInput, 'Transação Atualizada')

    const submitButton = screen.getByText('Atualizar Transação')
    const form = submitButton.closest('form')
    if (form) {
      fireEvent.submit(form)
    } else {
      await user.click(submitButton)
    }

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/finances/trans-1', expect.objectContaining({
        title: 'Transação Atualizada',
      }))
      expect(toast.default.success).toHaveBeenCalledWith('Transação atualizada com sucesso!')
      expect(mockNavigate).toHaveBeenCalledWith('/app/finances')
    })
  })

  it('deve exibir erro quando falha ao carregar transação', async () => {
    const toast = await import('react-hot-toast')
    vi.mocked(api.get).mockRejectedValue({
      response: {
        data: {
          message: 'Transação não encontrada',
        },
      },
    })

    render(
      <MemoryRouter>
        <EditTransaction />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalledWith('Transação não encontrada')
      expect(mockNavigate).toHaveBeenCalledWith('/app/finances')
    })
  })

  it('deve exibir erro quando falha ao atualizar', async () => {
    const toast = await import('react-hot-toast')
    const mockTransaction = {
      id: 'trans-1',
      title: 'Transação Original',
      amount: 500.0,
      type: 'ENTRY',
      entryType: 'OFERTA',
      branchId: 'branch-123',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    }

    vi.mocked(api.get).mockResolvedValue({ data: mockTransaction })
    vi.mocked(api.put).mockRejectedValue({
      response: {
        data: {
          message: 'Erro ao atualizar',
        },
      },
    })

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <EditTransaction />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(document.getElementById('title')).toBeInTheDocument()
    })

    const submitButton = screen.getByText('Atualizar Transação')
    const form = submitButton.closest('form')
    if (form) {
      fireEvent.submit(form)
    }

    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalledWith('Erro ao atualizar')
    })
  })
})

