import { useState, useCallback } from 'react'

/**
 * Hook for managing async operation state (loading, error, data)
 * 
 * Provides a consistent pattern for handling async operations in screens.
 * Generic and typed to work with any data type.
 * 
 * @example
 * ```ts
 * const { data, loading, error, execute, reset } = useAsyncState<Event[]>()
 * 
 * useEffect(() => {
 *   execute(async () => {
 *     const response = await api.get('/events')
 *     return response.data
 *   })
 * }, [])
 * ```
 */
export function useAsyncState<T = unknown>() {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Execute an async operation
   * Automatically manages loading and error states
   * 
   * @param asyncFn Async function to execute
   * @param options Optional configuration
   * @param options.silent If true, won't set loading state (useful for background refreshes)
   * @param options.onError Custom error handler (optional)
   */
  const execute = useCallback(
    async (
      asyncFn: () => Promise<T>,
      options?: {
        silent?: boolean
        onError?: (error: unknown) => string | null
      }
    ) => {
      const { silent = false, onError } = options || {}
      
      try {
        if (!silent) {
          setLoading(true)
        }
        setError(null)
        
        const result = await asyncFn()
        setData(result)
        return result
      } catch (err: unknown) {
        const errorMessage = onError
          ? onError(err)
          : err instanceof Error
          ? err.message
          : 'An error occurred'
        
        setError(errorMessage)
        throw err
      } finally {
        if (!silent) {
          setLoading(false)
        }
      }
    },
    []
  )

  /**
   * Reset all state to initial values
   */
  const reset = useCallback(() => {
    setData(null)
    setLoading(false)
    setError(null)
  }, [])

  /**
   * Manually set data
   */
  const setDataManually = useCallback((value: T | null) => {
    setData(value)
  }, [])

  /**
   * Manually set error
   */
  const setErrorManually = useCallback((value: string | null) => {
    setError(value)
  }, [])

  /**
   * Manually set loading
   */
  const setLoadingManually = useCallback((value: boolean) => {
    setLoading(value)
  }, [])

  return {
    data,
    loading,
    error,
    execute,
    reset,
    setData: setDataManually,
    setError: setErrorManually,
    setLoading: setLoadingManually,
  }
}

