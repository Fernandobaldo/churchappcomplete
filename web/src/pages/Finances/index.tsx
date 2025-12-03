import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, TrendingUp, TrendingDown, DollarSign, Search, Eye, Edit, Trash2, Filter, X, Calendar } from 'lucide-react'
import api from '../../api/api'
import toast from 'react-hot-toast'
import { format, startOfMonth, endOfMonth, subMonths, startOfYear } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'
import { useAuthStore } from '../../stores/authStore'
import PermissionGuard from '../../components/PermissionGuard'

interface Transaction {
  id: string
  title: string
  amount: number
  type: 'ENTRY' | 'EXIT'
  category: string | null
  entryType?: 'OFERTA' | 'DIZIMO' | 'CONTRIBUICAO' | null
  exitType?: 'ALUGUEL' | 'ENERGIA' | 'AGUA' | 'INTERNET' | 'OUTROS' | null
  exitTypeOther?: string | null
  contributionId?: string | null
  tithePayerMemberId?: string | null
  tithePayerName?: string | null
  createdBy?: string | null
  branchId: string
  createdAt: string
  updatedAt: string
  CreatedByUser?: {
    id: string
    name: string
    email: string
  } | null
  Contribution?: {
    id: string
    title: string
  } | null
  TithePayerMember?: {
    id: string
    name: string
    email: string
  } | null
}

interface FinanceSummary {
  total: number
  entries: number
  exits: number
}

interface FinanceResponse {
  transactions: Transaction[]
  summary: FinanceSummary
}

type MonthPreset = 'current' | 'last' | 'last3' | 'last6' | 'year' | 'custom'

export default function Finances() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuthStore()
  const [data, setData] = useState<FinanceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  // Permitir controlar showFilters via URL para testes
  const getInitialShowFilters = () => {
    const urlParam = searchParams.get('showFilters')
    return urlParam === 'true'
  }
  const [showFilters, setShowFilters] = useState(getInitialShowFilters)
  
  // #region agent log
  // Log showFilters changes
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/8e8d7848-a9d0-4e21-9b61-3624bfb1ced4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Finances/index.tsx:useEffect:showFilters',message:'showFilters state changed',data:{showFilters},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
  }, [showFilters]);
  // #endregion
  
  // Ler filtros da URL ou usar padrões
  const getInitialSearch = () => searchParams.get('search') || ''
  const getInitialCategory = () => searchParams.get('category') || ''
  const getInitialType = () => (searchParams.get('type') as 'ENTRY' | 'EXIT' | '') || ''
  const getInitialMonthPreset = () => (searchParams.get('monthPreset') as MonthPreset) || 'current'
  const getInitialStartDate = () => {
    const urlDate = searchParams.get('startDate')
    return urlDate || format(startOfMonth(new Date()), 'yyyy-MM-dd')
  }
  const getInitialEndDate = () => {
    const urlDate = searchParams.get('endDate')
    return urlDate || format(endOfMonth(new Date()), 'yyyy-MM-dd')
  }

  const [search, setSearch] = useState(getInitialSearch)
  const [categoryFilter, setCategoryFilter] = useState(getInitialCategory)
  const [typeFilter, setTypeFilter] = useState<'ENTRY' | 'EXIT' | ''>(getInitialType)
  const [monthPreset, setMonthPreset] = useState<MonthPreset>(getInitialMonthPreset)
  const [startDate, setStartDate] = useState<string>(getInitialStartDate)
  const [endDate, setEndDate] = useState<string>(getInitialEndDate)
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null)
  
  // #region agent log
  // Log monthPreset changes
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/8e8d7848-a9d0-4e21-9b61-3624bfb1ced4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Finances/index.tsx:useEffect:monthPreset',message:'monthPreset state changed',data:{monthPreset},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  }, [monthPreset]);
  // #endregion

  // Função para atualizar filtros na URL
  const updateURLParams = useCallback((updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        newParams.delete(key)
      } else {
        newParams.set(key, value)
      }
    })
    setSearchParams(newParams, { replace: true })
  }, [searchParams, setSearchParams])

  // Função para calcular datas do preset
  const calculatePresetDates = useCallback((preset: MonthPreset) => {
    const now = new Date()
    let start: Date
    let end: Date

    switch (preset) {
      case 'current':
        start = startOfMonth(now)
        end = endOfMonth(now)
        break
      case 'last':
        start = startOfMonth(subMonths(now, 1))
        end = endOfMonth(subMonths(now, 1))
        break
      case 'last3':
        start = startOfMonth(subMonths(now, 2))
        end = endOfMonth(now)
        break
      case 'last6':
        start = startOfMonth(subMonths(now, 5))
        end = endOfMonth(now)
        break
      case 'year':
        start = startOfYear(now)
        end = endOfMonth(now)
        break
      case 'custom':
        // Não deve ser chamado para custom
        throw new Error('calculatePresetDates não deve ser chamado para preset custom')
      default:
        start = startOfMonth(now)
        end = endOfMonth(now)
    }

    const startStr = format(start, 'yyyy-MM-dd')
    const endStr = format(end, 'yyyy-MM-dd')
    return { startStr, endStr }
  }, [])

  // Função para aplicar preset de mês
  const applyMonthPreset = useCallback((preset: MonthPreset) => {
    if (preset === 'custom') {
      return null
    }

    const { startStr, endStr } = calculatePresetDates(preset)
    setStartDate(startStr)
    setEndDate(endStr)
    updateURLParams({
      monthPreset: preset,
      startDate: startStr,
      endDate: endStr,
    })
    return { startStr, endStr }
  }, [calculatePresetDates, updateURLParams])

  useEffect(() => {
    // Carregar filtros da URL na inicialização
    const urlMonthPreset = searchParams.get('monthPreset') as MonthPreset
    if (urlMonthPreset && urlMonthPreset !== monthPreset) {
      setMonthPreset(urlMonthPreset)
      if (urlMonthPreset !== 'custom') {
        const dates = applyMonthPreset(urlMonthPreset)
        if (dates) {
          fetchFinancesWithDates(dates.startStr, dates.endStr, urlMonthPreset)
          return
        }
      }
    }
    fetchFinances()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Limpar timeout anterior
    if (searchDebounce) {
      clearTimeout(searchDebounce)
    }
    
    // Se search está vazio, buscar imediatamente e atualizar URL
    if (search === '') {
      updateURLParams({ search: null })
      fetchFinances()
      return
    }
    
    // Caso contrário, aguardar debounce
    const timeout = setTimeout(() => {
      updateURLParams({ search })
      fetchFinances()
    }, 500)
    
    setSearchDebounce(timeout)
    
    return () => {
      if (timeout) clearTimeout(timeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const fetchFinances = async () => {
    try {
      setLoading(true)
      const params: any = {}
      
      // Sempre passar monthPreset para o backend saber se deve calcular saldo total real
      params.monthPreset = monthPreset
      
      if (startDate) {
        params.startDate = new Date(startDate).toISOString()
      }
      if (endDate) {
        params.endDate = new Date(endDate + 'T23:59:59').toISOString()
      }
      if (categoryFilter) {
        params.category = categoryFilter
      }
      if (typeFilter) {
        params.type = typeFilter
      }
      if (search) {
        params.search = search
      }

      const response = await api.get('/finances', { params })
      setData(response.data)
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao carregar finanças'
      toast.error(errorMessage)
      console.error('Erro ao carregar finanças:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = () => {
    updateURLParams({
      startDate: startDate,
      endDate: endDate,
      category: categoryFilter,
      type: typeFilter,
      search: search,
      monthPreset: monthPreset,
    })
    fetchFinances()
  }

  const handleMonthPresetChange = (preset: MonthPreset) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/8e8d7848-a9d0-4e21-9b61-3624bfb1ced4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Finances/index.tsx:handleMonthPresetChange:entry',message:'handleMonthPresetChange called',data:{preset,currentMonthPreset:monthPreset},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    setMonthPreset(preset)
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/8e8d7848-a9d0-4e21-9b61-3624bfb1ced4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Finances/index.tsx:handleMonthPresetChange:after-setState',message:'setMonthPreset called',data:{preset,previousMonthPreset:monthPreset},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (preset !== 'custom') {
      const dates = applyMonthPreset(preset)
      if (dates) {
        // Usar as datas calculadas diretamente para buscar, passando o preset
        fetchFinancesWithDates(dates.startStr, dates.endStr, preset)
      } else {
        // Fallback: buscar com as datas atuais
        fetchFinances()
      }
    } else {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/8e8d7848-a9d0-4e21-9b61-3624bfb1ced4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Finances/index.tsx:handleMonthPresetChange:custom-branch',message:'preset is custom, no fetch called',data:{preset},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
    }
  }

  // Função auxiliar para buscar finanças com datas específicas
  const fetchFinancesWithDates = useCallback(async (start: string, end: string, preset?: MonthPreset) => {
    try {
      setLoading(true)
      const params: any = {}
      
      // Sempre passar monthPreset para o backend saber se deve calcular saldo total real
      params.monthPreset = preset || monthPreset
      
      if (start) {
        params.startDate = new Date(start).toISOString()
      }
      if (end) {
        params.endDate = new Date(end + 'T23:59:59').toISOString()
      }
      if (categoryFilter) {
        params.category = categoryFilter
      }
      if (typeFilter) {
        params.type = typeFilter
      }
      if (search) {
        params.search = search
      }

      const response = await api.get('/finances', { params })
      setData(response.data)
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao carregar finanças'
      toast.error(errorMessage)
      console.error('Erro ao carregar finanças:', error)
    } finally {
      setLoading(false)
    }
  }, [categoryFilter, typeFilter, search])

  const handleRemoveFilter = (filterType: 'category' | 'type' | 'search' | 'date') => {
    switch (filterType) {
      case 'category':
        setCategoryFilter('')
        updateURLParams({ category: null })
        break
      case 'type':
        setTypeFilter('')
        updateURLParams({ type: null })
        break
      case 'search':
        setSearch('')
        updateURLParams({ search: null })
        break
      case 'date':
        setMonthPreset('current')
        const now = new Date()
        const newStart = format(startOfMonth(now), 'yyyy-MM-dd')
        const newEnd = format(endOfMonth(now), 'yyyy-MM-dd')
        setStartDate(newStart)
        setEndDate(newEnd)
        updateURLParams({
          monthPreset: 'current',
          startDate: newStart,
          endDate: newEnd,
        })
        break
    }
    setTimeout(() => fetchFinances(), 100)
  }

  const getActiveFilters = () => {
    const filters: Array<{ label: string; type: 'category' | 'type' | 'search' | 'date' }> = []
    
    if (categoryFilter) {
      filters.push({ label: `Categoria: ${categoryFilter}`, type: 'category' })
    }
    if (typeFilter) {
      filters.push({ label: `Tipo: ${typeFilter === 'ENTRY' ? 'Entrada' : 'Saída'}`, type: 'type' })
    }
    if (search) {
      filters.push({ label: `Pesquisa: ${search}`, type: 'search' })
    }
    const currentMonthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd')
    const currentMonthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd')
    if (monthPreset !== 'current' || startDate !== currentMonthStart || endDate !== currentMonthEnd) {
      const presetLabels: Record<MonthPreset, string> = {
        current: 'Este mês',
        last: 'Mês passado',
        last3: 'Últimos 3 meses',
        last6: 'Últimos 6 meses',
        year: 'Este ano',
        custom: `Período: ${format(new Date(startDate), 'dd/MM/yyyy')} - ${format(new Date(endDate), 'dd/MM/yyyy')}`,
      }
      filters.push({ label: presetLabels[monthPreset] || 'Período personalizado', type: 'date' })
    }
    
    return filters
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) {
      return
    }

    try {
      await api.delete(`/finances/${id}`)
      toast.success('Transação excluída com sucesso!')
      fetchFinances()
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao excluir transação'
      toast.error(errorMessage)
      console.error('Erro ao excluir transação:', error)
    }
  }

  const handleView = (id: string) => {
    // Manter filtros na URL ao navegar
    const currentParams = new URLSearchParams(searchParams)
    navigate(`/app/finances/${id}?${currentParams.toString()}`)
  }

  const handleEdit = (id: string) => {
    // Manter filtros na URL ao navegar
    const currentParams = new URLSearchParams(searchParams)
    navigate(`/app/finances/${id}/edit?${currentParams.toString()}`)
  }

  // Obter categorias únicas para o filtro
  const categories = data?.transactions
    ? Array.from(new Set(data.transactions.map(t => t.category).filter(Boolean)))
    : []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Nenhum dado disponível</div>
      </div>
    )
  }

  const { transactions, summary } = data

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Finanças</h1>
          <p className="text-gray-600 mt-1">Gestão financeira da filial</p>
        </div>
        <PermissionGuard permission="finances_manage">
          <button
            id="new-transaction-button"
            onClick={() => navigate('/app/finances/new')}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nova Transação
          </button>
        </PermissionGuard>
      </div>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div id="total-balance-card" className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Saldo Total</p>
              <p id="total-balance-value" className={`text-2xl font-bold ${summary.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                R$ {summary.total.toFixed(2).replace('.', ',')}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div id="entries-card" className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Entradas</p>
              <p id="entries-value" className="text-2xl font-bold text-green-600">
                R$ {summary.entries.toFixed(2).replace('.', ',')}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div id="exits-card" className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Saídas</p>
              <p id="exits-value" className="text-2xl font-bold text-red-600">
                R$ {summary.exits.toFixed(2).replace('.', ',')}
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filtros e Pesquisa */}
      <div id="transactions-card" className="card">
        {/* #region agent log */}
        {(() => {
          fetch('http://127.0.0.1:7242/ingest/8e8d7848-a9d0-4e21-9b61-3624bfb1ced4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Finances/index.tsx:render:filters-section',message:'Rendering filters section',data:{showFilters},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
          return null;
        })()}
        {/* #endregion */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Transações</h2>
          <div className="flex items-center gap-2">
            <button
              id="filters-toggle-button"
              data-testid="filters-toggle-button"
              type="button"
              aria-label="Filtros"
              ref={(el) => {
                // #region agent log
                if (el) {
                  // Verificar se o onClick está anexado como prop React
                  const reactProps = (el as any).__reactProps || (el as any).__reactInternalInstance?.memoizedProps
                  fetch('http://127.0.0.1:7242/ingest/8e8d7848-a9d0-4e21-9b61-3624bfb1ced4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Finances/index.tsx:filters-button:ref',message:'Button ref callback called',data:{hasOnClick:!!el.onclick,onClickType:typeof el.onclick,hasReactOnClick:!!reactProps?.onClick,reactOnClickType:typeof reactProps?.onClick},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
                  
                  // Tentar anexar o handler diretamente como fallback
                  if (el && !el.onclick) {
                    const handleClick = (event: MouseEvent) => {
                      // #region agent log
                      console.log('[COMPONENT] Direct onclick handler called!')
                      fetch('http://127.0.0.1:7242/ingest/8e8d7848-a9d0-4e21-9b61-3624bfb1ced4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Finances/index.tsx:filters-button:direct-onclick',message:'Direct onclick handler called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
                      // #endregion
                      setShowFilters(!showFilters)
                    }
                    el.onclick = handleClick as any
                  }
                }
                // #endregion
              }}
              onClick={(e) => {
                // #region agent log
                console.log('[COMPONENT] onClick handler called!', { 
                  currentShowFilters: showFilters, 
                  eventType: e?.type,
                  eventTarget: e?.target?.tagName 
                })
                fetch('http://127.0.0.1:7242/ingest/8e8d7848-a9d0-4e21-9b61-3624bfb1ced4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Finances/index.tsx:filters-button:onClick:entry',message:'Filters button onClick handler called',data:{currentShowFilters:showFilters,newShowFilters:!showFilters,eventType:e?.type,eventTarget:e?.target?.tagName,eventIsTrusted:e?.isTrusted},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
                // #endregion
                // Remover preventDefault e stopPropagation para não interferir nos testes
                // e.preventDefault()
                // e.stopPropagation()
                const newValue = !showFilters
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/8e8d7848-a9d0-4e21-9b61-3624bfb1ced4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Finances/index.tsx:filters-button:onClick:before-setState',message:'About to call setShowFilters',data:{newValue},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
                // #endregion
                setShowFilters(newValue)
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/8e8d7848-a9d0-4e21-9b61-3624bfb1ced4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Finances/index.tsx:filters-button:onClick:after-setState',message:'setShowFilters called',data:{newValue},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
                // #endregion
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filtros
            </button>
          </div>
        </div>

        {/* Barra de Pesquisa */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              key="search-input"
              type="text"
              placeholder="Pesquisar por título, membro, categoria..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Labels de Filtros Ativos */}
        {getActiveFilters().length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2" data-testid="active-filters-container">
            {getActiveFilters().map((filter, index) => (
              <span
                key={index}
                data-testid={`filter-label-${filter.type}`}
                className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
              >
                {filter.label}
                <button
                  id={`remove-filter-${filter.type}`}
                  data-testid={`remove-filter-${filter.type}`}
                  onClick={() => handleRemoveFilter(filter.type)}
                  className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                  title="Remover filtro"
                  aria-label={`Remover filtro ${filter.label}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Painel de Filtros */}
        {/* #region agent log */}
        {(() => {
          fetch('http://127.0.0.1:7242/ingest/8e8d7848-a9d0-4e21-9b61-3624bfb1ced4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Finances/index.tsx:render:showFilters',message:'Evaluating showFilters condition',data:{showFilters},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
          return null;
        })()}
        {/* #endregion */}
        {showFilters && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200" data-testid="filters-panel">
            {/* Presets de Meses */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período
              </label>
              <div className="flex flex-wrap gap-2" data-testid="month-preset-buttons">
                <button
                  id="preset-current"
                  data-testid="preset-current"
                  onClick={() => handleMonthPresetChange('current')}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    monthPreset === 'current'
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  Este Mês
                </button>
                <button
                  id="preset-last"
                  data-testid="preset-last"
                  onClick={() => handleMonthPresetChange('last')}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    monthPreset === 'last'
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  Mês Passado
                </button>
                <button
                  id="preset-last3"
                  data-testid="preset-last3"
                  onClick={() => handleMonthPresetChange('last3')}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    monthPreset === 'last3'
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  Últimos 3 Meses
                </button>
                <button
                  id="preset-last6"
                  data-testid="preset-last6"
                  onClick={() => handleMonthPresetChange('last6')}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    monthPreset === 'last6'
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  Últimos 6 Meses
                </button>
                <button
                  id="preset-year"
                  data-testid="preset-year"
                  onClick={() => handleMonthPresetChange('year')}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    monthPreset === 'year'
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  Este Ano
                </button>
                <button
                  id="preset-custom"
                  data-testid="preset-custom"
                  onClick={() => {
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/8e8d7848-a9d0-4e21-9b61-3624bfb1ced4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Finances/index.tsx:preset-custom:onClick',message:'Custom button clicked',data:{currentMonthPreset:monthPreset},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
                    // #endregion
                    handleMonthPresetChange('custom')
                  }}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1 ${
                    monthPreset === 'custom'
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Personalizado
                </button>
              </div>
            </div>

            {/* Datas Personalizadas - Mostrar apenas se custom selecionado */}
            {/* #region agent log */}
            {(() => {
              fetch('http://127.0.0.1:7242/ingest/8e8d7848-a9d0-4e21-9b61-3624bfb1ced4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Finances/index.tsx:render:custom-date-condition',message:'Evaluating custom date condition',data:{monthPreset,isCustom:monthPreset === 'custom'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
              return null;
            })()}
            {/* #endregion */}
            {monthPreset === 'custom' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4" data-testid="custom-date-inputs">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Inicial
                  </label>
                  <input
                    id="custom-start-date"
                    data-testid="custom-start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      const newStartDate = e.target.value
                      setStartDate(newStartDate)
                      setMonthPreset('custom')
                      updateURLParams({ startDate: newStartDate, monthPreset: 'custom' })
                      fetchFinancesWithDates(newStartDate, endDate, 'custom')
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Final
                  </label>
                  <input
                    id="custom-end-date"
                    data-testid="custom-end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      const newEndDate = e.target.value
                      setEndDate(newEndDate)
                      setMonthPreset('custom')
                      updateURLParams({ endDate: newEndDate, monthPreset: 'custom' })
                      fetchFinancesWithDates(startDate, newEndDate, 'custom')
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Outros Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <select
                  id="filter-category"
                  data-testid="filter-category"
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value)
                    updateURLParams({ category: e.target.value || null })
                    setTimeout(() => fetchFinances(), 100)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Todas</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  id="filter-type"
                  data-testid="filter-type"
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value as 'ENTRY' | 'EXIT' | '')
                    updateURLParams({ type: e.target.value || null })
                    setTimeout(() => fetchFinances(), 100)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Todos</option>
                  <option value="ENTRY">Entrada</option>
                  <option value="EXIT">Saída</option>
                </select>
              </div>
            </div>
          </div>
        )}
        
        {transactions.length === 0 ? (
          <div id="empty-transactions" className="text-center py-12 text-gray-500">
            <p>Nenhuma transação cadastrada</p>
            <PermissionGuard permission="finances_manage">
              <button
                id="create-first-transaction-button"
                onClick={() => navigate('/app/finances/new')}
                className="mt-4 text-primary hover:underline"
              >
                Criar primeira transação
              </button>
            </PermissionGuard>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table id="transactions-table" className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Título</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Categoria</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Tipo</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Valor</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Data</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Criado por</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    id={`transaction-row-${transaction.id}`}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <p id={`transaction-title-${transaction.id}`} className="font-medium text-gray-900">{transaction.title}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span id={`transaction-category-${transaction.id}`} className="text-sm text-gray-600">
                        {transaction.category || 'Sem categoria'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.type === 'ENTRY'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {transaction.type === 'ENTRY' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`font-semibold ${
                          transaction.type === 'ENTRY' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {transaction.type === 'ENTRY' ? '+' : '-'}R${' '}
                        {Math.abs(transaction.amount).toFixed(2).replace('.', ',')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">
                        {format(new Date(transaction.createdAt), "dd 'de' MMMM 'de' yyyy", {
                          locale: ptBR,
                        })}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">
                        {transaction.CreatedByUser?.name || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <PermissionGuard permission="finances_manage">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleView(transaction.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Visualizar"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(transaction.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(transaction.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </PermissionGuard>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}



