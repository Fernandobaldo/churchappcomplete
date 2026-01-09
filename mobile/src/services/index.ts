/**
 * Services Layer
 * 
 * Centralized exports for all services.
 * This provides a consistent interface for API calls across the application.
 * 
 * Migration from direct api usage will happen gradually in next steps.
 */

export { authService } from './auth.service'
export { eventsService } from './events.service'
export { plansService } from './plans.service'
export { subscriptionsService } from './subscriptions.service'
export { bibleService } from './bible.service'
export { membersService } from './members.service'
export { devotionalsService } from './devotionals.service'
export { contributionsService } from './contributions.service'
export { noticesService } from './notices.service'
export { financesService } from './finances.service'

// Re-export types for convenience
export type { Event, CreateEventPayload, UpdateEventPayload } from './events.service'
export type { Plan } from './plans.service'
export type { Subscription, CheckoutPayload, CancelSubscriptionPayload } from './subscriptions.service'
export type { BibleVerse, BiblePassageResponse } from './bible.service'
export type { Member, SearchMembersParams } from './members.service'
export type { Devotional, CreateDevotionalPayload, UpdateDevotionalPayload } from './devotionals.service'
export type { Contribution, CreateContributionPayload, UpdateContributionPayload, PaymentMethod } from './contributions.service'
export type { Notice, CreateNoticePayload } from './notices.service'
export type { Transaction, FinanceSummary, FinanceResponse, SearchFinanceParams, CreateTransactionPayload, UpdateTransactionPayload } from './finances.service'

