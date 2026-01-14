/**
 * Security Test Helpers - Tenant Context
 * 
 * Provides helpers for creating and managing tenant contexts:
 * - Tenant A and Tenant B setup
 * - Multiple members with different roles per tenant
 */

import { Role } from '@prisma/client'
import { createTenantSetup, createMemberInBranch } from './factories'

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

export interface TenantContext {
  tenantName: string
  user: any
  church: any
  branch: any
  members: {
    adminGeral: any
    adminFilial: any
    coordinator: any
    member: any
  }
}

/**
 * Create Tenant A with complete setup
 * Includes: ADMINGERAL, ADMINFILIAL, COORDINATOR, MEMBER
 */
export async function createTenantA(): Promise<TenantContext> {
  const setup = await createTenantSetup({
    tenantName: 'TenantA',
    churchName: 'Igreja Tenant A',
    branchName: 'Filial Tenant A',
    memberRole: Role.ADMINGERAL,
    memberPermissions: ALL_PERMISSION_TYPES,
  })

  // Create additional members with different roles
  const adminFilial = await createMemberInBranch({
    branchId: setup.branch.id,
    role: Role.ADMINFILIAL,
    permissions: ALL_PERMISSION_TYPES,
    name: 'Admin Filial Tenant A',
    email: 'adminfilial-tenant-a@test.com',
  })

  const coordinator = await createMemberInBranch({
    branchId: setup.branch.id,
    role: Role.COORDINATOR,
    permissions: ['members_manage', 'events_manage'],
    name: 'Coordinator Tenant A',
    email: 'coordinator-tenant-a@test.com',
  })

  const member = await createMemberInBranch({
    branchId: setup.branch.id,
    role: Role.MEMBER,
    permissions: [],
    name: 'Member Tenant A',
    email: 'member-tenant-a@test.com',
  })

  return {
    tenantName: 'TenantA',
    user: setup.user,
    church: setup.church,
    branch: setup.branch,
    members: {
      adminGeral: setup.member,
      adminFilial: adminFilial.member,
      coordinator: coordinator.member,
      member: member.member,
    },
  }
}

/**
 * Create Tenant B with complete setup
 * Includes: ADMINGERAL, ADMINFILIAL, COORDINATOR, MEMBER
 */
export async function createTenantB(): Promise<TenantContext> {
  const setup = await createTenantSetup({
    tenantName: 'TenantB',
    churchName: 'Igreja Tenant B',
    branchName: 'Filial Tenant B',
    memberRole: Role.ADMINGERAL,
    memberPermissions: ALL_PERMISSION_TYPES,
  })

  // Create additional members with different roles
  const adminFilial = await createMemberInBranch({
    branchId: setup.branch.id,
    role: Role.ADMINFILIAL,
    permissions: ALL_PERMISSION_TYPES,
    name: 'Admin Filial Tenant B',
    email: 'adminfilial-tenant-b@test.com',
  })

  const coordinator = await createMemberInBranch({
    branchId: setup.branch.id,
    role: Role.COORDINATOR,
    permissions: ['members_manage', 'events_manage'],
    name: 'Coordinator Tenant B',
    email: 'coordinator-tenant-b@test.com',
  })

  const member = await createMemberInBranch({
    branchId: setup.branch.id,
    role: Role.MEMBER,
    permissions: [],
    name: 'Member Tenant B',
    email: 'member-tenant-b@test.com',
  })

  return {
    tenantName: 'TenantB',
    user: setup.user,
    church: setup.church,
    branch: setup.branch,
    members: {
      adminGeral: setup.member,
      adminFilial: adminFilial.member,
      coordinator: coordinator.member,
      member: member.member,
    },
  }
}
