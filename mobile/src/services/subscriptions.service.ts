import api from '../api/api'

/**
 * Subscriptions Service
 * 
 * Handles subscription-related API calls.
 * This is a minimal wrapper layer - migration from direct api usage will happen in next steps.
 * 
 * Note: subscriptionApi is already exported from api.ts, but this service layer
 * provides a consistent interface for future migration.
 */

export interface Subscription {
  id: string
  userId: string
  planId: string
  status: string
  currentPeriodStart?: string
  currentPeriodEnd?: string
  cancelAtPeriodEnd?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CheckoutPayload {
  planId: string
  trialDays?: number
}

export interface CancelSubscriptionPayload {
  cancelAtPeriodEnd?: boolean
}

export const subscriptionsService = {
  /**
   * Create checkout session for subscription
   * @param payload Checkout data (planId, optional trialDays)
   * @returns Promise with checkout session data
   */
  checkout: async (payload: CheckoutPayload) => {
    const response = await api.post('/api/subscriptions/checkout', payload)
    return response.data
  },

  /**
   * Get current user's subscription
   * @returns Promise with subscription data
   */
  getMySubscription: async (): Promise<Subscription> => {
    const response = await api.get<Subscription>('/api/subscriptions')
    return response.data
  },

  /**
   * Cancel subscription
   * @param payload Cancel options (cancelAtPeriodEnd defaults to true)
   * @returns Promise with updated subscription
   */
  cancel: async (payload: CancelSubscriptionPayload = { cancelAtPeriodEnd: true }): Promise<Subscription> => {
    const response = await api.post<Subscription>('/api/subscriptions/cancel', payload)
    return response.data
  },

  /**
   * Resume cancelled subscription
   * @returns Promise with updated subscription
   */
  resume: async (): Promise<Subscription> => {
    const response = await api.post<Subscription>('/api/subscriptions/resume')
    return response.data
  },
}

