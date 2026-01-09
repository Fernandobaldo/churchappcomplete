/**
 * Utility functions for date handling
 */

/**
 * Converts a date to the end of the day (23:59:59.999) in the server timezone.
 * If the date already has a time component, it's preserved.
 * If it's a date-only (midnight), it's converted to end-of-day.
 * 
 * @param date - The date to convert
 * @returns Date object set to end of day (23:59:59.999)
 */
export function toEndOfDay(date: Date): Date {
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)
  return endOfDay
}

/**
 * Checks if a date string represents a date-only value (no time component).
 * A date is considered "date-only" if:
 * - It's in format YYYY-MM-DD (no time part)
 * - Or it represents midnight (00:00:00.000) in UTC or local time
 * 
 * @param dateString - ISO date string to check
 * @returns true if the date appears to be date-only
 */
export function isDateOnly(dateString: string): boolean {
  // Check if it's in YYYY-MM-DD format (no time part)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return true
  }
  
  // Check if it's midnight in UTC (likely a date-only value)
  // This handles cases where a local date (00:00:00 local) was converted to ISO
  const date = new Date(dateString)
  const utcHours = date.getUTCHours()
  const utcMinutes = date.getUTCMinutes()
  const utcSeconds = date.getUTCSeconds()
  const utcMilliseconds = date.getUTCMilliseconds()
  
  // Also check local time (in case timezone conversion didn't happen)
  const localHours = date.getHours()
  const localMinutes = date.getMinutes()
  const localSeconds = date.getSeconds()
  const localMilliseconds = date.getMilliseconds()
  
  // Consider date-only if it's midnight in UTC OR local time
  const isMidnightUTC = utcHours === 0 && utcMinutes === 0 && utcSeconds === 0 && utcMilliseconds === 0
  const isMidnightLocal = localHours === 0 && localMinutes === 0 && localSeconds === 0 && localMilliseconds === 0
  
  return isMidnightUTC || isMidnightLocal
}

/**
 * Normalizes an expiration date:
 * - If it's a date-only value (no time), converts to end-of-day
 * - If it already has a time component, preserves it
 * - Handles backward compatibility with existing records
 * 
 * @param expiresAt - Date string or Date object
 * @returns Date object normalized to end-of-day if it was date-only, otherwise preserved
 */
export function normalizeExpirationDate(expiresAt: string | Date | null | undefined): Date | null {
  if (!expiresAt) {
    return null
  }
  
  const date = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt
  
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date provided')
  }
  
  // If it's a date string, check if it's date-only
  if (typeof expiresAt === 'string' && isDateOnly(expiresAt)) {
    return toEndOfDay(date)
  }
  
  // If it's a Date object that represents midnight (likely from date-only input)
  // Check if hours, minutes, seconds, and milliseconds are all 0 in local time
  // OR if it's midnight in UTC (which happens when a local midnight date is converted to ISO)
  const localHours = date.getHours()
  const localMinutes = date.getMinutes()
  const localSeconds = date.getSeconds()
  const localMilliseconds = date.getMilliseconds()
  
  const utcHours = date.getUTCHours()
  const utcMinutes = date.getUTCMinutes()
  const utcSeconds = date.getUTCSeconds()
  const utcMilliseconds = date.getUTCMilliseconds()
  
  // If it's exactly midnight in local time OR UTC, treat as date-only and convert to end-of-day
  // This handles backward compatibility with existing records and timezone conversions
  const isMidnightLocal = localHours === 0 && localMinutes === 0 && localSeconds === 0 && localMilliseconds === 0
  const isMidnightUTC = utcHours === 0 && utcMinutes === 0 && utcSeconds === 0 && utcMilliseconds === 0
  
  if (isMidnightLocal || isMidnightUTC) {
    return toEndOfDay(date)
  }
  
  // Otherwise, preserve the original date/time
  return date
}

