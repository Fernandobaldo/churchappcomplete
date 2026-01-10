// Factories para criar entidades de teste de forma reutilizável
import { prisma } from '../../src/lib/prisma'
import { SubscriptionStatus, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

export interface UserFactoryData {
  email?: string
  firstName?: string
  lastName?: string
  password?: string
  phone?: string
  document?: string
  isBlocked?: boolean
}

export interface PlanFactoryData {
  name?: string
  code?: string
  price?: number
  features?: string[]
  maxMembers?: number
  maxBranches?: number
}

export interface ChurchFactoryData {
  name?: string
  address?: string
  createdByUserId?: string
  logoUrl?: string
  avatarUrl?: string
}

export interface BranchFactoryData {
  name?: string
  churchId: string
  isMainBranch?: boolean
}

export interface MemberFactoryData {
  name?: string
  email?: string
  role?: Role
  branchId: string
  userId?: string
}

export interface InviteLinkFactoryData {
  churchId?: string
  branchId?: string
  createdByUserId: string
  maxUses?: number
  expiresAt?: Date
  isActive?: boolean
}

/**
 * Factory para criar User com dados padrão ou customizados
 */
export async function createTestUser(data: UserFactoryData = {}) {
  const {
    email = `test-${Date.now()}@example.com`,
    firstName = 'Test',
    lastName = 'User',
    password = 'password123',
    phone = '+5511999999999',
    document = '12345678900',
    isBlocked = false,
  } = data

  const hashedPassword = await bcrypt.hash(password, 10)

  return await prisma.user.create({
    data: {
      email,
      firstName,
      lastName,
      password: hashedPassword,
      phone,
      document,
      isBlocked,
    },
  })
}

/**
 * Factory para criar Plan com dados padrão ou customizados
 */
export async function createTestPlan(data: PlanFactoryData = {}) {
  const {
    name = 'Test Plan',
    code = `TEST_${Date.now()}`,
    price = 0,
    features = ['basic'],
    maxMembers = 10,
    maxBranches = 1,
  } = data

  return await prisma.plan.create({
    data: {
      name,
      code,
      price,
      features,
      maxMembers,
      maxBranches,
    },
  })
}

/**
 * Factory para criar Subscription
 */
export async function createTestSubscription(userId: string, planId: string, status: SubscriptionStatus = SubscriptionStatus.active) {
  return await prisma.subscription.create({
    data: {
      userId,
      planId,
      status,
    },
  })
}

/**
 * Factory para criar Church com dados padrão ou customizados
 */
export async function createTestChurch(data: ChurchFactoryData) {
  const {
    name = `Test Church ${Date.now()}`,
    address = 'Test Address',
    createdByUserId,
    logoUrl,
    avatarUrl,
  } = data

  return await prisma.church.create({
    data: {
      name,
      address,
      createdByUserId,
      logoUrl,
      avatarUrl,
    },
  })
}

/**
 * Factory para criar Branch com dados padrão ou customizados
 */
export async function createTestBranch(data: BranchFactoryData) {
  const {
    name = `Test Branch ${Date.now()}`,
    churchId,
    isMainBranch = false,
  } = data

  return await prisma.branch.create({
    data: {
      name,
      churchId,
      isMainBranch,
    },
  })
}

/**
 * Factory para criar Member com dados padrão ou customizados
 */
export async function createTestMember(data: MemberFactoryData) {
  const {
    name = `Test Member ${Date.now()}`,
    email = `member-${Date.now()}@example.com`,
    role = Role.MEMBER,
    branchId,
    userId,
  } = data

  return await prisma.member.create({
    data: {
      name,
      email,
      role,
      branchId,
      userId,
    },
  })
}

/**
 * Factory para criar OnboardingProgress
 */
export async function createTestOnboardingProgress(
  userId: string,
  options: {
    churchConfigured?: boolean
    branchesConfigured?: boolean
    settingsConfigured?: boolean
    completed?: boolean
    completedAt?: Date | null
  } = {}
) {
  const {
    churchConfigured = false,
    branchesConfigured = false,
    settingsConfigured = false,
    completed = false,
    completedAt = null,
  } = options

  return await prisma.onboardingProgress.upsert({
    where: { userId },
    create: {
      userId,
      churchConfigured,
      branchesConfigured,
      settingsConfigured,
      completed,
      completedAt,
    },
    update: {
      churchConfigured,
      branchesConfigured,
      settingsConfigured,
      completed,
      completedAt,
    },
  })
}

/**
 * Factory para criar InviteLink
 */
export async function createTestInviteLink(data: InviteLinkFactoryData) {
  const {
    churchId,
    branchId,
    createdByUserId,
    maxUses = 10,
    expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
    isActive = true,
  } = data

  return await prisma.inviteLink.create({
    data: {
      churchId,
      branchId,
      createdByUserId,
      maxUses,
      expiresAt,
      isActive,
    },
  })
}

/**
 * Helper para criar um setup completo: User + Plan + Subscription
 */
export async function createTestUserWithSubscription(data: {
  user?: UserFactoryData
  plan?: PlanFactoryData
  subscriptionStatus?: SubscriptionStatus
} = {}) {
  const user = await createTestUser(data.user)
  const plan = await createTestPlan(data.plan)
  const subscription = await createTestSubscription(
    user.id,
    plan.id,
    data.subscriptionStatus || SubscriptionStatus.active
  )

  return { user, plan, subscription }
}

/**
 * Helper para criar um setup completo: User + Church + Branch + Member
 */
export async function createTestChurchSetup(data: {
  user?: UserFactoryData
  church?: ChurchFactoryData
  branch?: Omit<BranchFactoryData, 'churchId'>
  member?: Omit<MemberFactoryData, 'branchId' | 'userId'>
} = {}) {
  const user = await createTestUser(data.user)
  const church = await createTestChurch({
    ...data.church,
    createdByUserId: data.church?.createdByUserId || user.id,
  })
  const branch = await createTestBranch({
    ...data.branch,
    churchId: church.id,
    isMainBranch: data.branch?.isMainBranch ?? true,
  })
  const member = await createTestMember({
    ...data.member,
    branchId: branch.id,
    userId: user.id,
  })

  return { user, church, branch, member }
}

/**
 * Helper para criar um app Fastify de teste com rotas registradas
 * 
 * @deprecated Use createTestApp from './createTestApp' instead
 * Kept for backward compatibility - will be removed in future versions
 */
export async function createTestApp() {
  const { createTestApp: createApp } = await import('./createTestApp')
  return createApp()
}

/**
 * Helper para gerar token JWT para testes
 * 
 * @deprecated Use generateTestToken from './auth' instead
 * Kept for backward compatibility - will be removed in future versions
 */
export async function generateTestToken(
  app: any,
  payload: {
    sub: string
    email: string
    name: string
    type?: 'user' | 'member'
    memberId?: string | null
    branchId?: string | null
    role?: string | null
    churchId?: string | null
    permissions?: string[]
    onboardingCompleted?: boolean
  }
) {
  const { generateTestToken: generateToken } = await import('./auth')
  return generateToken(app, payload)
}
