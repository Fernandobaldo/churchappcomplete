import { useEffect } from 'react'
import { useAsyncState } from './useAsyncState'
import { eventsService, Event } from '../services/events.service'

/**
 * Hook for fetching next upcoming event from /events/next
 * 
 * Automatically fetches next event data on mount.
 * Provides loading, error, and data states.
 * 
 * @example
 * ```ts
 * const { data: nextEvent, loading, error } = useNextEvent()
 * ```
 */
export function useNextEvent() {
  const { data, loading, error, execute } = useAsyncState<Event | null>()

  useEffect(() => {
    execute(async () => {
      return await eventsService.getNext()
    })
  }, [execute])

  return {
    nextEvent: data,
    loading,
    error,
  }
}

