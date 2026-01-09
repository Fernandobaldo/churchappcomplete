import { useState, useEffect, useCallback } from 'react'
import { useDebounce } from './useDebounce'
import { membersService, Member } from '../services/members.service'

/**
 * Hook for searching members with debounce
 * 
 * Automatically debounces search term and fetches results.
 * Uses server-side search if available, falls back to client-side filtering.
 * 
 * @param searchTerm Search term (minimum 2 characters)
 * @param options Configuration options
 * @returns Object with members, loading, error states
 * 
 * @example
 * ```ts
 * const { members, loading, error } = useMembersSearch('John', { limit: 10 })
 * ```
 */
export function useMembersSearch(
  searchTerm: string,
  options: { limit?: number; debounceMs?: number } = {}
) {
  const { limit = 10, debounceMs = 300 } = options
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm.trim(), debounceMs)

  const searchMembers = useCallback(async () => {
    // Only search if term has at least 2 characters
    if (debouncedSearchTerm.length < 2) {
      setMembers([])
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const results = await membersService.search({
        search: debouncedSearchTerm,
        limit,
      })
      setMembers(results)
    } catch (err: any) {
      console.error('Error searching members:', err)
      const errorMessage = err.response?.data?.message || 'Erro ao buscar membros.'
      setError(errorMessage)
      setMembers([])
    } finally {
      setLoading(false)
    }
  }, [debouncedSearchTerm, limit])

  useEffect(() => {
    searchMembers()
  }, [searchMembers])

  return {
    members,
    loading,
    error,
    // Expose search function for manual triggers if needed
    refetch: searchMembers,
  }
}

