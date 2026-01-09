import { useEffect } from 'react'
import { useAsyncState } from './useAsyncState'
import { bibleService } from '../services/bible.service'
// @ts-ignore - translateBooks.js is a JS file
import { bookTranslation } from '../utils/translateBooks'

/**
 * Hook for fetching Bible passage text
 * 
 * Automatically fetches passage text on mount or when passage changes.
 * Provides loading, error, and data states.
 * 
 * @param passage Passage reference (e.g., "João 3:16")
 * @param version Bible version (default: 'nvi')
 * @returns Object with text, loading, and error states
 * 
 * @example
 * ```ts
 * const { text, loading, error } = useBiblePassage("João 3:16")
 * ```
 */
export function useBiblePassage(passage: string, version: string = 'nvi') {
  const { data, loading, error, execute } = useAsyncState<string>()

  useEffect(() => {
    if (!passage) {
      return
    }

    execute(async () => {
      return await bibleService.getPassage(passage, bookTranslation, version)
    })
  }, [passage, version, execute])

  return {
    text: data,
    loading,
    error,
  }
}

