import { useEffect } from 'react'
import { useAsyncState } from './useAsyncState'
import { authService } from '../services/auth.service'

/**
 * Hook for fetching current authenticated user from /auth/me
 * 
 * Automatically fetches user data on mount.
 * Provides loading, error, and data states.
 * 
 * @example
 * ```ts
 * const { data: user, loading, error } = useMe()
 * ```
 */
export function useMe() {
  const { data, loading, error, execute } = useAsyncState<any>()

  useEffect(() => {
    execute(async () => {
      return await authService.getMe()
    })
  }, [execute])

  return {
    user: data,
    loading,
    error,
  }
}

