import api from '../api/api'

/**
 * Members Service
 * 
 * Handles member-related API calls.
 */

export interface Member {
  id: string
  name: string
  email?: string
  role?: string
  avatarUrl?: string
  branchId?: string
  [key: string]: any // Allow additional properties
}

export interface SearchMembersParams {
  search?: string
  limit?: number
}

export const membersService = {
  /**
   * Get all members
   * @returns Promise with array of members
   */
  getAll: async (): Promise<Member[]> => {
    const response = await api.get<Member[]>('/members')
    return response.data
  },

  /**
   * Search members
   * Tries server-side search first (GET /members?search=term).
   * Falls back to client-side filtering if backend doesn't support search param.
   * 
   * @param params Search parameters
   * @returns Promise with filtered array of members
   */
  search: async (params: SearchMembersParams): Promise<Member[]> => {
    const { search, limit } = params

    // If no search term, return all members
    if (!search || search.trim().length < 2) {
      const allMembers = await membersService.getAll()
      return limit ? allMembers.slice(0, limit) : allMembers
    }

    try {
      // Try server-side search first
      const response = await api.get<Member[]>('/members', {
        params: { search: search.trim() },
      })
      
      const results = response.data || []
      return limit ? results.slice(0, limit) : results
    } catch (error: any) {
      // If server-side search fails (e.g., backend doesn't support search param),
      // fall back to client-side filtering
      if (error.response?.status === 400 || error.response?.status === 404) {
        console.warn('Server-side search not supported, falling back to client-side filtering')
        const allMembers = await membersService.getAll()
        const searchLower = search.toLowerCase().trim()
        
        const filtered = allMembers.filter(
          (member) =>
            member.name?.toLowerCase().includes(searchLower) ||
            member.email?.toLowerCase().includes(searchLower)
        )
        
        return limit ? filtered.slice(0, limit) : filtered
      }
      
      // Re-throw other errors
      throw error
    }
  },

  /**
   * Get member by ID
   * @param id Member ID
   * @returns Promise with member data
   */
  getById: async (id: string): Promise<Member> => {
    const response = await api.get<Member>(`/members/${id}`)
    return response.data
  },

  /**
   * Update a member
   * @param id Member ID
   * @param payload Updated member data
   * @returns Promise with updated member
   */
  update: async (id: string, payload: Partial<Member>): Promise<Member> => {
    const response = await api.put<Member>(`/members/${id}`, payload)
    return response.data
  },
}

