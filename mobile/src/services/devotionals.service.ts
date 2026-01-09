import api from '../api/api'

/**
 * Devotionals Service
 * 
 * Handles devotional-related API calls.
 */

export interface Devotional {
  id: string
  title: string
  passage: string
  content: string
  textPt?: string
  textFr?: string
  createdAt?: string
  updatedAt?: string
  author?: {
    id: string
    name: string
  }
  likesCount?: number
  liked?: boolean
}

export interface CreateDevotionalPayload {
  title: string
  passage: string
  content: string
}

export interface UpdateDevotionalPayload extends Partial<CreateDevotionalPayload> {
  id: string
}

export const devotionalsService = {
  /**
   * Get all devotionals
   * @returns Promise with array of devotionals
   */
  getAll: async (): Promise<Devotional[]> => {
    const response = await api.get<Devotional[]>('/devotionals')
    return response.data
  },

  /**
   * Get devotional by ID
   * @param id Devotional ID
   * @returns Promise with devotional data
   */
  getById: async (id: string): Promise<Devotional> => {
    const response = await api.get<Devotional>(`/devotionals/${id}`)
    return response.data
  },

  /**
   * Create a new devotional
   * @param payload Devotional data
   * @returns Promise with created devotional
   */
  create: async (payload: CreateDevotionalPayload): Promise<Devotional> => {
    const response = await api.post<Devotional>('/devotionals', payload)
    return response.data
  },

  /**
   * Like a devotional
   * @param id Devotional ID
   * @returns Promise
   */
  like: async (id: string): Promise<void> => {
    await api.post(`/devotionals/${id}/like`)
  },

  /**
   * Unlike a devotional
   * @param id Devotional ID
   * @returns Promise
   */
  unlike: async (id: string): Promise<void> => {
    await api.delete(`/devotionals/${id}/unlike`)
  },
}

