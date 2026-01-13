export enum AdminRole {
  SUPERADMIN = 'SUPERADMIN',
  SUPPORT = 'SUPPORT',
  FINANCE = 'FINANCE',
}

export interface AdminUser {
  id: string
  name: string
  email: string
  adminRole: AdminRole
  isActive: boolean
  lastLoginAt?: string | null
  createdAt: string
}

export interface LoginResponse {
  token: string
  admin: AdminUser
}

export interface DashboardStats {
  totalUsers: number
  totalChurches: number
  totalBranches: number
  totalMembers: number
  newUsersLast7Days: number
  newUsersLast30Days: number
  newChurchesLast7Days: number
  newChurchesLast30Days: number
  churchesByPlan: Array<{
    planName: string
    count: number
  }>
  activeChurches: number
}

export interface User {
  id: string
  name: string
  email: string
  createdAt: string
  lastLoginAt?: string | null
  isBlocked: boolean
  plan?: {
    id: string
    name: string
  } | null
  churchesCount?: number
  hasMember?: boolean
  churchesAsOwner?: Array<{
    id: string
    name: string
  }>
  churchesAsMember?: Array<{
    id: string
    name: string
    role: string
  }>
  subscription?: {
    id: string
    status: string
    startedAt: string
    endsAt?: string | null
    plan: {
      id: string
      name: string
    }
  }
}

export interface Church {
  id: string
  name: string
  address?: string | null
  isActive: boolean
  owner: {
    id: string
    name: string
    email: string
  } | null
  plan: {
    id: string
    name: string
  } | null
  branchesCount: number
  membersCount: number
}

export interface PaginationParams {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationParams
}

export interface Member {
  id: string
  name: string
  email: string
  churchName: string
  branchName: string
  role: string
}

export interface Plan {
  id: string
  name: string
  price: number
  features: string[]
  maxBranches?: number | null
  maxMembers?: number | null
  isActive?: boolean
  gatewayProvider?: string | null
  gatewayProductId?: string | null
  gatewayPriceId?: string | null
  billingInterval?: string
  syncStatus?: string
}

export interface PlanFeature {
  id: string
  label: string
  description: string
}

export interface Subscription {
  id: string
  userId: string
  userName: string
  userEmail: string
  planName: string
  status: 'pending' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trialing'
  billingType: string
  startedAt: string
  endsAt?: string | null
  gatewayProvider?: string | null
  gatewaySubscriptionId?: string | null
  currentPeriodStart?: string | null
  currentPeriodEnd?: string | null
  cancelAtPeriodEnd?: boolean
}

export interface AuditLogEntry {
  id: string
  action: string
  entityType: string
  entityId: string | null
  description: string
  metadata: any
  createdAt: string
  adminUser: {
    id: string
    name: string
    email: string
    role: AdminRole
  } | null
}
