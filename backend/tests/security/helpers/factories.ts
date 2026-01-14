/**
 * Security Test Helpers - Factories
 * 
 * Provides factories for creating test data:
 * - Churches, Branches, Members with different roles
 * - Events, Devotionals, Contributions, Transactions
 * - Permissions, Positions, etc.
 */

import { prisma } from '../../../src/lib/prisma'
import { Role, TransactionType, EntryType, ExitType, PaymentMethodType } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Common permissions for testing
const ALL_PERMISSION_TYPES = [
  'members_view',
  'members_manage',
  'events_manage',
  'devotional_manage',
  'contributions_manage',
  'finances_manage',
  'church_manage',
  'permission_manage',
]

/**
 * Create a complete tenant setup: User, Church, Branch, Member
 */
export async function createTenantSetup(options: {
  tenantName?: string
  userEmail?: string
  userPassword?: string
  churchName?: string
  branchName?: string
  memberRole?: Role
  memberPermissions?: string[]
} = {}) {
  const timestamp = Date.now()
  const tenantName = options.tenantName || `Tenant-${timestamp}`
  
  // Create User
  const hashedPassword = await bcrypt.hash(options.userPassword || 'password123', 10)
  const user = await prisma.user.create({
    data: {
      email: options.userEmail || `${tenantName.toLowerCase()}@test.com`,
      firstName: tenantName,
      lastName: 'Test',
      password: hashedPassword,
      phone: '11999999999',
      document: '12345678901',
    },
  })

  // Create Plan (required for church creation)
  let plan = await prisma.plan.findFirst({
    where: { name: { in: ['free', 'Free', 'Free Plan'] } },
  })

  if (!plan) {
    plan = await prisma.plan.create({
      data: {
        name: 'free',
        code: 'FREE',
        price: 0,
        features: ['Até 1 igreja', 'Até 1 filial', 'Até 20 membros'],
        maxBranches: 1,
        maxMembers: 20,
      },
    })
  }

  // Create Subscription (if not exists)
  // Note: userId is not unique in Subscription schema, so we use findFirst + create
  const existingSubscription = await prisma.subscription.findFirst({
    where: { userId: user.id, status: 'ACTIVE' },
  })

  if (!existingSubscription) {
    await prisma.subscription.create({
      data: {
        userId: user.id,
        planId: plan.id,
        status: 'ACTIVE',
      },
    })
  }

  // Create Church
  const church = await prisma.church.create({
    data: {
      name: options.churchName || `Igreja ${tenantName}`,
      address: `Endereço ${tenantName}`,
      createdByUserId: user.id,
    },
  })

  // Create Branch
  const branch = await prisma.branch.create({
    data: {
      name: options.branchName || `Filial ${tenantName}`,
      churchId: church.id,
      isMainBranch: true,
    },
  })

  // Create Member
  const member = await prisma.member.create({
    data: {
      name: `${tenantName} Member`,
      email: user.email,
      role: options.memberRole || Role.ADMINGERAL,
      branchId: branch.id,
      userId: user.id,
    },
  })

  // Create Permissions
  const permissionsToCreate = options.memberPermissions || 
    (options.memberRole === Role.ADMINGERAL || options.memberRole === Role.ADMINFILIAL
      ? ALL_PERMISSION_TYPES
      : [])

  if (permissionsToCreate.length > 0) {
    await prisma.permission.createMany({
      data: permissionsToCreate.map(type => ({
        memberId: member.id,
        type,
      })),
      skipDuplicates: true,
    })
  }

  return {
    user,
    church,
    branch,
    member,
    plan,
  }
}

/**
 * Create a member with specific role and permissions in an existing branch
 */
export async function createMemberInBranch(options: {
  branchId: string
  role?: Role
  permissions?: string[]
  name?: string
  email?: string
}) {
  const timestamp = Date.now()
  const hashedPassword = await bcrypt.hash('password123', 10)

  // Create User
  const user = await prisma.user.create({
    data: {
      email: options.email || `member-${timestamp}@test.com`,
      firstName: options.name || `Member ${timestamp}`,
      lastName: 'Test',
      password: hashedPassword,
      phone: '11999999999',
      document: '12345678901',
    },
  })

  // Get branch to get churchId
  const branch = await prisma.branch.findUnique({
    where: { id: options.branchId },
    include: { Church: true },
  })

  if (!branch) {
    throw new Error(`Branch ${options.branchId} not found`)
  }

  // Create Member
  const member = await prisma.member.create({
    data: {
      name: options.name || `Member ${timestamp}`,
      email: user.email,
      role: options.role || Role.MEMBER,
      branchId: options.branchId,
      userId: user.id,
    },
  })

  // Create Permissions
  if (options.permissions && options.permissions.length > 0) {
    await prisma.permission.createMany({
      data: options.permissions.map(type => ({
        memberId: member.id,
        type,
      })),
      skipDuplicates: true,
    })
  }

  return { user, member }
}

/**
 * Create an Event
 */
export async function createEvent(options: {
  branchId: string
  title?: string
  startDate?: Date
  endDate?: Date
  description?: string
}) {
  const timestamp = Date.now()
  return await prisma.event.create({
    data: {
      title: options.title || `Event ${timestamp}`,
      startDate: options.startDate || new Date(),
      endDate: options.endDate || new Date(),
      description: options.description || `Description ${timestamp}`,
      branchId: options.branchId,
    },
  })
}

/**
 * Create a Devotional
 */
export async function createDevotional(options: {
  branchId: string
  authorId: string
  title?: string
  passage?: string
  content?: string
}) {
  const timestamp = Date.now()
  return await prisma.devotional.create({
    data: {
      title: options.title || `Devotional ${timestamp}`,
      passage: options.passage || `Passage ${timestamp}`,
      content: options.content || `Content ${timestamp}`,
      authorId: options.authorId,
      branchId: options.branchId,
      date: new Date(),
    },
  })
}

/**
 * Create a Contribution
 */
export async function createContribution(options: {
  branchId: string
  title?: string
  description?: string
  goal?: number
  isActive?: boolean
}) {
  const timestamp = Date.now()
  return await prisma.contribution.create({
    data: {
      title: options.title || `Contribution ${timestamp}`,
      description: options.description || `Description ${timestamp}`,
      goal: options.goal || 10000,
      isActive: options.isActive ?? true,
      branchId: options.branchId,
    },
  })
}

/**
 * Create a Transaction
 */
export async function createTransaction(options: {
  branchId: string
  amount: number
  type: TransactionType
  title?: string
  category?: string
  entryType?: EntryType
  exitType?: ExitType
  createdBy?: string
}) {
  return await prisma.transaction.create({
    data: {
      amount: options.amount,
      type: options.type,
      title: options.title || `Transaction ${Date.now()}`,
      category: options.category,
      entryType: options.entryType,
      exitType: options.exitType,
      branchId: options.branchId,
      createdBy: options.createdBy,
      date: new Date(),
    },
  })
}

/**
 * Create a Notice
 */
export async function createNotice(options: {
  branchId: string
  title?: string
  content?: string
  isActive?: boolean
}) {
  const timestamp = Date.now()
  return await prisma.notice.create({
    data: {
      title: options.title || `Notice ${timestamp}`,
      content: options.content || `Content ${timestamp}`,
      isActive: options.isActive ?? true,
      branchId: options.branchId,
    },
  })
}

/**
 * Create a Position
 */
export async function createPosition(options: {
  churchId: string
  name?: string
  isDefault?: boolean
}) {
  const timestamp = Date.now()
  return await prisma.position.create({
    data: {
      name: options.name || `Position ${timestamp}`,
      churchId: options.churchId,
      isDefault: options.isDefault ?? false,
    },
  })
}

/**
 * Create an InviteLink
 */
export async function createInviteLink(options: {
  branchId: string
  createdBy: string
  maxUses?: number
  expiresAt?: Date
  isActive?: boolean
  token?: string
}) {
  // Generate unique token if not provided
  const token = options.token || `test-token-${Date.now()}-${Math.random().toString(36).substring(7)}`
  
  return await prisma.inviteLink.create({
    data: {
      branchId: options.branchId,
      createdBy: options.createdBy,
      maxUses: options.maxUses ?? 10,
      expiresAt: options.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isActive: options.isActive ?? true,
      token,
    },
  })
}
