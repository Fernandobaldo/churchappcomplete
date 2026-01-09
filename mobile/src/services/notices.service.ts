import api from '../api/api'

/**
 * Notices Service
 * 
 * Handles notice-related API calls.
 */

export interface Notice {
  id: string
  title: string
  message: string
  read?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CreateNoticePayload {
  title: string
  message: string
}

export const noticesService = {
  /**
   * Get all notices
   * @returns Promise with array of notices
   */
  getAll: async (): Promise<Notice[]> => {
    const response = await api.get<Notice[]>('/notices')
    return response.data
  },

  /**
   * Mark a notice as read
   * @param id Notice ID
   * @returns Promise
   */
  markAsRead: async (id: string): Promise<void> => {
    await api.post(`/notices/${id}/read`)
  },

  /**
   * Create a new notice
   * @param payload Notice data
   * @returns Promise with created notice
   */
  create: async (payload: CreateNoticePayload): Promise<Notice> => {
    const response = await api.post<Notice>('/notices', payload)
    return response.data
  },
}

