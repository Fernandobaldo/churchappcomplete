import api from '../api/api'

/**
 * Events Service
 * 
 * Handles event-related API calls.
 * This is a minimal wrapper layer - migration from direct api usage will happen in next steps.
 */

export interface Event {
  id: string
  title: string
  startDate: string
  endDate?: string
  time?: string
  description?: string
  location?: string
  imageUrl?: string
  donationLink?: string
  donationReason?: string
  hasDonation?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CreateEventPayload {
  title: string
  startDate: string
  endDate?: string
  time?: string
  description?: string
  location?: string
  imageUrl?: string
  donationLink?: string
  donationReason?: string
  hasDonation?: boolean
}

export interface UpdateEventPayload extends Partial<CreateEventPayload> {
  id: string
}

export const eventsService = {
  /**
   * Get all events
   * @returns Promise with array of events
   */
  getAll: async (): Promise<Event[]> => {
    const response = await api.get<Event[]>('/events')
    return response.data
  },

  /**
   * Get event by ID
   * @param id Event ID
   * @returns Promise with event data
   */
  getById: async (id: string): Promise<Event> => {
    const response = await api.get<Event>(`/events/${id}`)
    return response.data
  },

  /**
   * Create a new event
   * @param payload Event data
   * @returns Promise with created event
   */
  create: async (payload: CreateEventPayload): Promise<Event> => {
    const response = await api.post<Event>('/events', payload)
    return response.data
  },

  /**
   * Update an existing event
   * @param id Event ID
   * @param payload Updated event data
   * @returns Promise with updated event
   */
  update: async (id: string, payload: Partial<CreateEventPayload>): Promise<Event> => {
    const response = await api.put<Event>(`/events/${id}`, payload)
    return response.data
  },

  /**
   * Delete an event
   * @param id Event ID
   * @returns Promise
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/events/${id}`)
  },

  /**
   * Get next upcoming event
   * @returns Promise with next event data
   */
  getNext: async (): Promise<Event | null> => {
    const response = await api.get<Event>('/events/next')
    return response.data
  },
}

