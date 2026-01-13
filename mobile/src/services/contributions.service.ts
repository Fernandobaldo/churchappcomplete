import api from '../api/api'

/**
 * Contributions Service
 * 
 * Handles contribution-related API calls.
 */

export interface PaymentMethod {
  id?: string
  type: 'PIX' | 'CONTA_BR' | 'IBAN'
  data: Record<string, any>
}

export interface Contribution {
  id: string
  title: string
  description?: string
  goal?: number
  currentAmount?: number
  endDate?: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
  PaymentMethods?: PaymentMethod[]
}

export interface CreateContributionPayload {
  title: string
  description?: string
  goal?: number
  endDate?: string
  isActive?: boolean
  paymentMethods?: Array<{
    type: 'PIX' | 'CONTA_BR' | 'IBAN'
    data: Record<string, any>
  }>
}

export interface UpdateContributionPayload extends Partial<CreateContributionPayload> {
  id: string
}

export const contributionsService = {
  /**
   * Get all contributions
   * @returns Promise with array of contributions
   */
  getAll: async (): Promise<Contribution[]> => {
    const response = await api.get<Contribution[]>('/contributions')
    return response.data
  },

  /**
   * Get contribution by ID
   * @param id Contribution ID
   * @returns Promise with contribution data
   */
  getById: async (id: string): Promise<Contribution> => {
    const response = await api.get<Contribution>(`/contributions/${id}`)
    return response.data
  },

  /**
   * Create a new contribution
   * @param payload Contribution data
   * @returns Promise with created contribution
   */
  create: async (payload: CreateContributionPayload): Promise<Contribution> => {
    const response = await api.post<Contribution>('/contributions', payload)
    return response.data
  },

  /**
   * Update an existing contribution
   * @param id Contribution ID
   * @param payload Updated contribution data
   * @returns Promise with updated contribution
   */
  update: async (id: string, payload: Partial<CreateContributionPayload>): Promise<Contribution> => {
    const response = await api.put<Contribution>(`/contributions/${id}`, payload)
    return response.data
  },

  /**
   * Delete a contribution
   * @param id Contribution ID
   * @returns Promise
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/contributions/${id}`)
  },
}

