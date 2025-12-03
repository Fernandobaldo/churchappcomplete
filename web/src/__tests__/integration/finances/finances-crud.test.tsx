import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, within, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Finances from '@/pages/Finances'
import api from '@/api/api'
import { useAuthStore } from '@/stores/authStore'
import { mockUser } from '@/test/mocks/mockData'

vi.mock('@/api/api')
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/components/PermissionGuard', () => ({
  default: ({ children, permission }: any) => {
    const { user } = useAuthStore.getState()
    if (!user) return null
    
    // Simula a lógica de hasAccess: ADMINGERAL/ADMINFILIAL têm acesso ou verifica permissões
    const hasPermission = 
      user.role === 'ADMINGERAL' || 
      user.role === 'ADMINFILIAL' ||
      user.permissions?.some((p: any) => {
        const permType = typeof p === 'object' ? p.type : p
        return permType === permission
      }) === true
    
    return hasPermission ? <>{children}</> : null
  },
}))

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    // Não mockar useSearchParams - usar o hook real do react-router-dom
    // Isso permite que funcione corretamente com MemoryRouter
  }
})

describe('Finances CRUD Integration', () => {
  beforeEach(() => {
    useAuthStore.setState({
      token: 'token',
      user: {
        ...mockUser,
        permissions: ['finances_manage'],
      },
    })
    vi.clearAllMocks()
  })

  describe('Listar Transações', () => {
    it('deve carregar e exibir lista de transações com resumo', async () => {
      const mockTransactions = [
        {
          id: 'trans-1',
          title: 'Dízimo',
          amount: 1000.0,
          type: 'ENTRY',
          category: 'Dízimo',
          branchId: 'branch-123',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
        {
          id: 'trans-2',
          title: 'Oferta',
          amount: 500.0,
          type: 'ENTRY',
          category: 'Oferta',
          branchId: 'branch-123',
          createdAt: '2024-01-16T10:00:00Z',
          updatedAt: '2024-01-16T10:00:00Z',
        },
        {
          id: 'trans-3',
          title: 'Pagamento',
          amount: 300.0,
          type: 'EXIT',
          category: 'Despesas',
          branchId: 'branch-123',
          createdAt: '2024-01-17T10:00:00Z',
          updatedAt: '2024-01-17T10:00:00Z',
        },
      ]

      vi.mocked(api.get).mockResolvedValue({
        data: {
          transactions: mockTransactions,
          summary: {
            total: 1200.0,
            entries: 1500.0,
            exits: 300.0,
          },
        },
      })

      render(
        <MemoryRouter>
          <Finances />
        </MemoryRouter>
      )

      await waitFor(() => {
        // Verificar se a tabela foi renderizada
        const transactionsTable = document.getElementById('transactions-table')
        expect(transactionsTable).toBeInTheDocument()
      }, { timeout: 3000 })
      
      // Verificar transações usando IDs específicos
      await waitFor(() => {
        const trans1Title = document.getElementById('transaction-title-trans-1')
        expect(trans1Title).toBeInTheDocument()
        expect(trans1Title?.textContent).toBe('Dízimo')
      }, { timeout: 3000 })
      
      await waitFor(() => {
        const trans2Title = document.getElementById('transaction-title-trans-2')
        expect(trans2Title).toBeInTheDocument()
        expect(trans2Title?.textContent).toBe('Oferta')
      }, { timeout: 3000 })
      
      await waitFor(() => {
        const trans3Title = document.getElementById('transaction-title-trans-3')
        expect(trans3Title).toBeInTheDocument()
        expect(trans3Title?.textContent).toBe('Pagamento')
      }, { timeout: 3000 })

      // Verificar que a API foi chamada (pode ter parâmetros)
      expect(api.get).toHaveBeenCalledWith(
        '/finances',
        expect.any(Object)
      )
    })

    it('deve exibir valores formatados corretamente', async () => {
      const mockTransactions = [
        {
          id: 'trans-1',
          title: 'Dízimo',
          amount: 1000.5,
          type: 'ENTRY',
          category: 'Dízimo',
          branchId: 'branch-123',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
      ]

      vi.mocked(api.get).mockResolvedValue({
        data: {
          transactions: mockTransactions,
          summary: {
            total: 1000.5,
            entries: 1000.5,
            exits: 0,
          },
        },
      })

      render(
        <MemoryRouter>
          <Finances />
        </MemoryRouter>
      )

      await waitFor(() => {
        // O componente renderiza sem separador de milhar: "1000,50" em vez de "1.000,50"
        // Usar o ID do elemento para buscar de forma mais específica
        const totalBalanceValue = document.getElementById('total-balance-value')
        expect(totalBalanceValue).toBeInTheDocument()
        expect(totalBalanceValue?.textContent).toContain('R$')
        expect(totalBalanceValue?.textContent).toContain('1000,50')
      })
    })

    it('deve exibir resumo financeiro correto', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: {
          transactions: [],
          summary: {
            total: 2500.75,
            entries: 3000.0,
            exits: 499.25,
          },
        },
      })

      render(
        <MemoryRouter>
          <Finances />
        </MemoryRouter>
      )

      await waitFor(() => {
        // O componente renderiza sem separador de milhar
        // Verificar Saldo Total usando ID
        const totalBalanceValue = document.getElementById('total-balance-value')
        expect(totalBalanceValue).toBeInTheDocument()
        expect(totalBalanceValue?.textContent).toContain('R$')
        expect(totalBalanceValue?.textContent).toContain('2500,75')
        
        // Verificar Entradas usando ID
        const entriesValue = document.getElementById('entries-value')
        expect(entriesValue).toBeInTheDocument()
        expect(entriesValue?.textContent).toContain('R$')
        expect(entriesValue?.textContent).toContain('3000,00')
        
        // Verificar Saídas usando ID
        const exitsValue = document.getElementById('exits-value')
        expect(exitsValue).toBeInTheDocument()
        expect(exitsValue?.textContent).toContain('R$')
        expect(exitsValue?.textContent).toContain('499,25')
      })
    })
  })

  describe('Exibição de Transações', () => {
    it('deve exibir tipo ENTRY com badge verde', async () => {
      const mockTransactions = [
        {
          id: 'trans-1',
          title: 'Dízimo',
          amount: 1000.0,
          type: 'ENTRY',
          category: 'Dízimo',
          branchId: 'branch-123',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
      ]

      vi.mocked(api.get).mockResolvedValue({
        data: {
          transactions: mockTransactions,
          summary: {
            total: 1000.0,
            entries: 1000.0,
            exits: 0,
          },
        },
      })

      render(
        <MemoryRouter>
          <Finances />
        </MemoryRouter>
      )

      await waitFor(() => {
        const entryBadge = screen.getByText('Entrada')
        expect(entryBadge).toBeInTheDocument()
        expect(entryBadge.className).toContain('bg-green-100')
        expect(entryBadge.className).toContain('text-green-800')
      })
    })

    it('deve exibir tipo EXIT com badge vermelho', async () => {
      const mockTransactions = [
        {
          id: 'trans-1',
          title: 'Pagamento',
          amount: 300.0,
          type: 'EXIT',
          category: 'Despesas',
          branchId: 'branch-123',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
      ]

      vi.mocked(api.get).mockResolvedValue({
        data: {
          transactions: mockTransactions,
          summary: {
            total: -300.0,
            entries: 0,
            exits: 300.0,
          },
        },
      })

      render(
        <MemoryRouter>
          <Finances />
        </MemoryRouter>
      )

      await waitFor(() => {
        const exitBadge = screen.getByText('Saída')
        expect(exitBadge).toBeInTheDocument()
      expect(exitBadge.className).toContain('bg-red-100')
      expect(exitBadge.className).toContain('text-red-800')
    })
  })

  describe('Filtros e Pesquisa', () => {
    it('deve exibir filtros quando clicar no botão de filtros', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: {
          transactions: [],
          summary: { total: 0, entries: 0, exits: 0 },
        },
      })

      const user = userEvent.setup()
      render(
        <MemoryRouter>
          <Finances />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(document.getElementById('transactions-card')).toBeInTheDocument()
      })

      // Encontrar o botão de filtros usando testid ou texto
      const filterButton = screen.getByTestId('filters-toggle-button') || screen.getByText('Filtros')
      await user.click(filterButton)

      // Aguardar que o painel de filtros apareça
      await waitFor(() => {
        const filtersPanel = screen.queryByTestId('filters-panel')
        expect(filtersPanel).toBeInTheDocument()
      }, { timeout: 3000 })

      // Verificar se os presets de meses aparecem
      await waitFor(() => {
        expect(screen.getByText('Este Mês')).toBeInTheDocument()
        expect(screen.getByText('Mês Passado')).toBeInTheDocument()
        expect(screen.getByText('Últimos 3 Meses')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('deve aplicar preset de mês ao clicar', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: {
          transactions: [],
          summary: { total: 0, entries: 0, exits: 0 },
        },
      })

      const user = userEvent.setup()
      render(
        <MemoryRouter>
          <Finances />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(document.getElementById('transactions-card')).toBeInTheDocument()
      })

      // Abrir painel de filtros
      const filterButton = screen.getByTestId('filters-toggle-button') || screen.getByText('Filtros')
      await user.click(filterButton)

      // Aguardar que o painel apareça
      await waitFor(() => {
        const filtersPanel = screen.queryByTestId('filters-panel')
        expect(filtersPanel).toBeInTheDocument()
      }, { timeout: 3000 })

      // Aguardar que o botão "Mês Passado" apareça
      await waitFor(() => {
        expect(screen.getByText('Mês Passado')).toBeInTheDocument()
      }, { timeout: 3000 })

      const lastMonthButton = screen.getByTestId('preset-last') || screen.getByText('Mês Passado')
      await user.click(lastMonthButton)

      // Aguardar que a API seja chamada com os parâmetros corretos
      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(
          '/finances',
          expect.objectContaining({
            params: expect.objectContaining({
              startDate: expect.any(String),
              endDate: expect.any(String),
            }),
          })
        )
      }, { timeout: 3000 })
    })

    it('deve exibir labels de filtros ativos quando há filtros aplicados', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: {
          transactions: [
            {
              id: 'trans-1',
              title: 'Dízimo',
              amount: 1000.0,
              type: 'ENTRY',
              category: 'Dízimo',
              branchId: 'branch-123',
              createdAt: '2024-01-15T10:00:00Z',
              updatedAt: '2024-01-15T10:00:00Z',
            },
          ],
          summary: { total: 1000.0, entries: 1000.0, exits: 0 },
        },
      })

      const user = userEvent.setup()
      render(
        <MemoryRouter>
          <Finances />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(document.getElementById('transactions-card')).toBeInTheDocument()
      })

      // Abrir painel de filtros
      const filterButton = screen.getByTestId('filters-toggle-button') || screen.getByText('Filtros')
      await user.click(filterButton)

      // Aguardar que o painel apareça
      await waitFor(() => {
        const filtersPanel = screen.queryByTestId('filters-panel')
        expect(filtersPanel).toBeInTheDocument()
      }, { timeout: 3000 })

      // Aguardar que o select de categoria apareça
      await waitFor(() => {
        const categorySelect = screen.queryByTestId('filter-category') || document.querySelector('select[id="filter-category"]')
        expect(categorySelect).toBeInTheDocument()
      }, { timeout: 3000 })

      const categorySelect = (screen.queryByTestId('filter-category') || document.querySelector('select[id="filter-category"]')) as HTMLSelectElement
      await user.selectOptions(categorySelect, 'Dízimo')

      // Aguardar que o label de filtro ativo apareça
      await waitFor(() => {
        expect(screen.getByText(/Categoria: Dízimo/)).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('deve remover filtro ao clicar no X do label', async () => {
      // Mock que retorna dados com a categoria Dízimo
      const mockResponse = {
        data: {
          transactions: [
            {
              id: 'trans-1',
              title: 'Dízimo',
              amount: 1000.0,
              type: 'ENTRY',
              category: 'Dízimo',
              branchId: 'branch-123',
              createdAt: '2024-01-15T10:00:00Z',
              updatedAt: '2024-01-15T10:00:00Z',
            },
          ],
          summary: { total: 1000.0, entries: 1000.0, exits: 0 },
        },
      }

      // Configurar o mock para retornar dados em todas as chamadas
      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const user = userEvent.setup()
      
      // Renderizar com showFilters=true via URL para evitar depender do clique
      render(
        <MemoryRouter initialEntries={['/app/finances?showFilters=true']}>
          <Finances />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(document.getElementById('transactions-card')).toBeInTheDocument()
      })

      // Aguardar que o painel de filtros apareça (já deve estar aberto via URL)
      await waitFor(() => {
        const filtersPanel = screen.queryByTestId('filters-panel')
        expect(filtersPanel).toBeInTheDocument()
      }, { timeout: 3000 })

      // Aguardar que o select de categoria apareça
      await waitFor(() => {
        const categorySelect = screen.queryByTestId('filter-category') || document.getElementById('filter-category')
        expect(categorySelect).toBeInTheDocument()
      }, { timeout: 3000 })

      // Selecionar a categoria usando userEvent
      const categorySelect = (screen.queryByTestId('filter-category') || document.getElementById('filter-category')) as HTMLSelectElement
      await user.selectOptions(categorySelect, 'Dízimo')

      // Aguardar que o label apareça após selecionar a categoria
      await waitFor(() => {
        const labelText = screen.queryByText(/Categoria: Dízimo/)
        expect(labelText).toBeInTheDocument()
      }, { timeout: 3000 })

      // Encontrar e clicar no botão de remover filtro
      await waitFor(() => {
        const removeButton = screen.queryByTestId('remove-filter-category') || document.getElementById('remove-filter-category')
        expect(removeButton).toBeInTheDocument()
      }, { timeout: 3000 })

      const removeButton = screen.queryByTestId('remove-filter-category') || document.getElementById('remove-filter-category')
      await user.click(removeButton!)

      // Aguardar que o label desapareça após remover o filtro
      await waitFor(() => {
        const labelAfterRemove = screen.queryByText(/Categoria: Dízimo/)
        expect(labelAfterRemove).not.toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('deve exibir campos de data personalizada quando selecionar "Personalizado"', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: {
          transactions: [],
          summary: { total: 0, entries: 0, exits: 0 },
        },
      })

      const user = userEvent.setup()
      render(
        <MemoryRouter initialEntries={['/app/finances?showFilters=true&monthPreset=custom']}>
          <Finances />
        </MemoryRouter>
      )

      // Aguardar que o componente carregue completamente
      await waitFor(() => {
        expect(document.getElementById('transactions-card')).toBeInTheDocument()
      })

      // Aguardar que o painel de filtros apareça
      await waitFor(() => {
        const filtersPanel = screen.queryByTestId('filters-panel')
        expect(filtersPanel).toBeInTheDocument()
      }, { timeout: 3000 })

      // Aguardar que os campos de data personalizada apareçam
      // Eles só aparecem quando monthPreset === 'custom' E showFilters === true
      await waitFor(() => {
        const startDateInput = screen.queryByTestId('custom-start-date')
        const endDateInput = screen.queryByTestId('custom-end-date')
        expect(startDateInput).toBeInTheDocument()
        expect(endDateInput).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('deve aplicar filtro de pesquisa com múltiplos caracteres', async () => {
      const mockTransactions = [
        {
          id: 'trans-1',
          title: 'Dízimo de João',
          amount: 1000.0,
          type: 'ENTRY',
          category: 'Dízimo',
          branchId: 'branch-123',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
        {
          id: 'trans-2',
          title: 'Oferta de Maria',
          amount: 500.0,
          type: 'ENTRY',
          category: 'Oferta',
          branchId: 'branch-123',
          createdAt: '2024-01-16T10:00:00Z',
          updatedAt: '2024-01-16T10:00:00Z',
        },
      ]

      vi.mocked(api.get).mockResolvedValue({
        data: {
          transactions: mockTransactions,
          summary: { total: 1500.0, entries: 1500.0, exits: 0 },
        },
      })

      const user = userEvent.setup()
      render(
        <MemoryRouter>
          <Finances />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(document.getElementById('transactions-table')).toBeInTheDocument()
      })

      // Simular pesquisa digitando múltiplos caracteres
      const searchInput = screen.getByPlaceholderText(/pesquisar por título/i) as HTMLInputElement
      
      // Digitar múltiplos caracteres sem precisar clicar novamente
      await user.type(searchInput, 'João', { delay: 0 })

      // Aguardar debounce
      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(
          '/finances',
          expect.objectContaining({
            params: expect.objectContaining({
              search: 'João',
            }),
          })
        )
      }, { timeout: 1000 })
    })
  })

  describe('Ações de Transação', () => {
    it('deve exibir botões de ação (visualizar, editar, excluir)', async () => {
      const mockTransactions = [
        {
          id: 'trans-1',
          title: 'Dízimo',
          amount: 1000.0,
          type: 'ENTRY',
          category: 'Dízimo',
          branchId: 'branch-123',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
          CreatedByUser: {
            id: 'user-1',
            name: 'Test User',
            email: 'test@example.com',
          },
        },
      ]

      vi.mocked(api.get).mockResolvedValue({
        data: {
          transactions: mockTransactions,
          summary: { total: 1000.0, entries: 1000.0, exits: 0 },
        },
      })

      render(
        <MemoryRouter>
          <Finances />
        </MemoryRouter>
      )

      await waitFor(() => {
        // Verificar se a coluna de ações existe
        const actionsHeader = screen.getByText('Ações')
        expect(actionsHeader).toBeInTheDocument()
      })
    })

    it('deve exibir coluna Criado por', async () => {
      const mockTransactions = [
        {
          id: 'trans-1',
          title: 'Dízimo',
          amount: 1000.0,
          type: 'ENTRY',
          category: 'Dízimo',
          branchId: 'branch-123',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
          CreatedByUser: {
            id: 'user-1',
            name: 'Test User',
            email: 'test@example.com',
          },
        },
      ]

      vi.mocked(api.get).mockResolvedValue({
        data: {
          transactions: mockTransactions,
          summary: { total: 1000.0, entries: 1000.0, exits: 0 },
        },
      })

      render(
        <MemoryRouter>
          <Finances />
        </MemoryRouter>
      )

      await waitFor(() => {
        const createdByHeader = screen.getByText('Criado por')
        expect(createdByHeader).toBeInTheDocument()
        expect(screen.getByText('Test User')).toBeInTheDocument()
      })
    })
  })
})
})

