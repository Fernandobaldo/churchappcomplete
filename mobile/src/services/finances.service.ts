import api from '../api/api'

/**
 * Finances Service
 * 
 * Handles finance/transaction-related API calls.
 */

export interface Transaction {
  id: string
  title: string
  amount: number
  type: 'ENTRY' | 'EXIT'
  category?: string | null
  entryType?: 'OFERTA' | 'DIZIMO' | 'CONTRIBUICAO' | null
  exitType?: 'ALUGUEL' | 'ENERGIA' | 'AGUA' | 'INTERNET' | 'OUTROS' | null
  exitTypeOther?: string | null
  contributionId?: string | null
  tithePayerMemberId?: string | null
  tithePayerName?: string | null
  isTithePayerMember?: boolean | null
  createdBy?: string | null
  branchId: string
  date?: string
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
    description: string | null
  } | null
  TithePayerMember?: {
    id: string
    name: string
    email: string
  } | null
}

export interface FinanceSummary {
  total: number
  entries: number
  exits: number
}

export interface FinanceResponse {
  transactions: Transaction[]
  summary: FinanceSummary
}

export interface SearchFinanceParams {
  monthPreset?: string
  startDate?: string
  endDate?: string
  category?: string
  type?: 'ENTRY' | 'EXIT'
  search?: string
}

export interface CreateTransactionPayload {
  amount: number
  type: 'ENTRY' | 'EXIT'
  entryType?: 'OFERTA' | 'DIZIMO' | 'CONTRIBUICAO'
  exitType?: 'ALUGUEL' | 'ENERGIA' | 'AGUA' | 'INTERNET' | 'OUTROS'
  exitTypeOther?: string
  contributionId?: string
  tithePayerMemberId?: string
  tithePayerName?: string
  isTithePayerMember?: boolean
  contributionMemberId?: string
  contributionMemberName?: string
  isContributionMember?: boolean
  date?: string
}

export interface UpdateTransactionPayload extends Partial<CreateTransactionPayload> {
  id: string
}

export const financesService = {
  /**
   * Get all transactions with optional filters
   * @param params Search parameters
   * @returns Promise with transactions and summary
   */
  getAll: async (params?: SearchFinanceParams): Promise<FinanceResponse> => {
    const response = await api.get<FinanceResponse>('/finances', { params })
    return response.data
  },

  /**
   * Get transaction by ID
   * @param id Transaction ID
   * @returns Promise with transaction data
   */
  getById: async (id: string): Promise<Transaction> => {
    const response = await api.get<Transaction>(`/finances/${id}`)
    return response.data
  },

  /**
   * Create a new transaction
   * @param payload Transaction data
   * @returns Promise with created transaction
   */
  create: async (payload: CreateTransactionPayload): Promise<Transaction> => {
    const response = await api.post<Transaction>('/finances', payload)
    return response.data
  },

  /**
   * Update an existing transaction
   * @param id Transaction ID
   * @param payload Updated transaction data
   * @returns Promise with updated transaction
   */
  update: async (id: string, payload: Partial<CreateTransactionPayload>): Promise<Transaction> => {
    const response = await api.put<Transaction>(`/finances/${id}`, payload)
    return response.data
  },
}

