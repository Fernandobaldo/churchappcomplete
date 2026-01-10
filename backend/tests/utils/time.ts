/**
 * Time utilities for tests
 * 
 * Provides helpers to freeze/unfreeze time for deterministic tests.
 * 
 * IMPORTANT: Always unfreeze time in afterEach to avoid affecting other tests.
 */

import { vi } from 'vitest'

/**
 * Freeze time to a specific date
 * 
 * All Date.now(), new Date(), etc. will return the frozen time.
 * 
 * @param date - Date to freeze to (default: 2025-01-01 10:00:00 UTC)
 * 
 * @example
 * ```typescript
 * beforeEach(() => {
 *   freezeTime(new Date('2025-01-01T10:00:00Z'))
 * })
 * 
 * afterEach(() => {
 *   unfreezeTime()
 * })
 * ```
 */
export function freezeTime(date: Date = new Date('2025-01-01T10:00:00Z')) {
  vi.useFakeTimers()
  vi.setSystemTime(date)
}

/**
 * Unfreeze time
 * 
 * Restores real time. Must be called in afterEach after freezeTime.
 * 
 * @example
 * ```typescript
 * afterEach(() => {
 *   unfreezeTime()
 * })
 * ```
 */
export function unfreezeTime() {
  vi.useRealTimers()
}

/**
 * Freeze time to now
 * 
 * Convenience helper to freeze time to current moment.
 * 
 * @example
 * ```typescript
 * beforeEach(() => {
 *   freezeTimeToNow()
 * })
 * ```
 */
export function freezeTimeToNow() {
  freezeTime(new Date())
}

/**
 * Advance time by milliseconds
 * 
 * Useful for testing time-dependent logic without unfreezing.
 * Must call freezeTime first.
 * 
 * @param ms - Milliseconds to advance
 * 
 * @example
 * ```typescript
 * freezeTime()
 * // ... test setup
 * advanceTime(24 * 60 * 60 * 1000) // Advance 1 day
 * // ... assertions
 * unfreezeTime()
 * ```
 */
export function advanceTime(ms: number) {
  vi.advanceTimersByTime(ms)
}

/**
 * Get frozen time
 * 
 * Returns the current frozen time. Useful for assertions.
 * 
 * @returns Date - Current frozen time
 * 
 * @example
 * ```typescript
 * freezeTime(new Date('2025-01-01'))
 * const frozen = getFrozenTime()
 * expect(frozen.getFullYear()).toBe(2025)
 * ```
 */
export function getFrozenTime(): Date {
  return new Date()
}

