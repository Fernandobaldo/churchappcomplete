import api from '../api/api'

/**
 * Authentication Service
 * 
 * Handles authentication-related API calls.
 * This is a minimal wrapper layer - migration from direct api usage will happen in next steps.
 */
export const authService = {
  /**
   * Login with email and password
   * @param email User email
   * @param password User password
   * @returns Promise with auth response containing token and user data
   */
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  },

  /**
   * Logout current user
   * @returns Promise
   */
  logout: async () => {
    // Placeholder - actual logout logic may be handled by auth store
    return Promise.resolve()
  },

  /**
   * Get current user profile
   * @returns Promise with user data
   */
  getCurrentUser: async () => {
    const response = await api.get('/members/me')
    return response.data
  },

  /**
   * Get current authenticated user (from /auth/me)
   * @returns Promise with user data
   */
  getMe: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },

  /**
   * Refresh auth token
   * @param refreshToken Refresh token
   * @returns Promise with new token
   */
  refreshToken: async (refreshToken: string) => {
    const response = await api.post('/auth/refresh', { refreshToken })
    return response.data
  },
}

