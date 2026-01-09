import { useState, useCallback } from 'react'

/**
 * Hook for managing pull-to-refresh state and logic
 * 
 * Provides a consistent pattern for pull-to-refresh functionality.
 * Automatically manages refreshing state during async operations.
 * 
 * @example
 * ```ts
 * const { refreshing, onRefresh } = usePullToRefresh(async () => {
 *   await fetchData()
 * })
 * 
 * // In component:
 * <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
 * ```
 */
export function usePullToRefresh(refreshFn: () => Promise<void> | void) {
  const [refreshing, setRefreshing] = useState(false)

  /**
   * Handle refresh action
   * Automatically sets refreshing state before and after the refresh function
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await refreshFn()
    } catch (error) {
      // Error handling is typically done in the refreshFn itself
      // This hook just manages the refreshing state
      console.error('Error during refresh:', error)
    } finally {
      setRefreshing(false)
    }
  }, [refreshFn])

  /**
   * Manually set refreshing state
   * Useful for programmatic refresh triggers
   */
  const setRefreshingManually = useCallback((value: boolean) => {
    setRefreshing(value)
  }, [])

  return {
    refreshing,
    onRefresh,
    setRefreshing: setRefreshingManually,
  }
}

