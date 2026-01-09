import api from '../api/api'

/**
 * Plans Service
 * 
 * Handles plans-related API calls.
 * This is a minimal wrapper layer - migration from direct api usage will happen in next steps.
 * 
 * Note: plansApi is already exported from api.ts, but this service layer
 * provides a consistent interface for future migration.
 */

export interface Plan {
  id: string
  name: string
  description?: string
  price: number
  currency?: string
  interval?: string
  features?: string[]
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export const plansService = {
  /**
   * Get all available plans
   * @returns Promise with array of plans
   */
  getAll: async (): Promise<Plan[]> => {
    const response = await api.get<Plan[]>('/plans')
    return response.data
  },

  /**
   * Get plan by ID
   * @param id Plan ID
   * @returns Promise with plan data
   */
  getById: async (id: string): Promise<Plan> => {
    const response = await api.get<Plan>(`/plans/${id}`)
    return response.data
  },
}

