import { useState, useEffect } from 'react'

/**
 * Hook for debouncing values
 * 
 * Delays updating the debounced value until after a specified delay.
 * Useful for search inputs, API calls triggered by user input, etc.
 * 
 * @param value Value to debounce
 * @param delay Delay in milliseconds (default: 500ms)
 * @returns Debounced value
 * 
 * @example
 * ```ts
 * const [searchTerm, setSearchTerm] = useState('')
 * const debouncedSearchTerm = useDebounce(searchTerm, 300)
 * 
 * useEffect(() => {
 *   if (debouncedSearchTerm) {
 *     // Perform search API call
 *     searchAPI(debouncedSearchTerm)
 *   }
 * }, [debouncedSearchTerm])
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Set a timeout to update the debounced value after the delay
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Cleanup: cancel the timeout if value changes before delay completes
    // This prevents the debounced value from updating if value changes rapidly
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

