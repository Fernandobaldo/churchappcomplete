import { describe, it, expect } from 'vitest'
import {
  canBlockUser,
  canSuspendChurch,
  canChangePlan,
  canImpersonate,
  canAccessConfig,
  canAccessAudit,
  canManagePlans,
  canViewUsers,
  canViewChurches,
  canViewSubscriptions,
  canViewMembers,
} from '../../../utils/permissions'
import { AdminRole } from '../../../types'

describe('Permissions Utils - Unit Tests', () => {
  describe('canBlockUser', () => {
    it('SUPERADMIN pode bloquear usuários', () => {
      expect(canBlockUser(AdminRole.SUPERADMIN)).toBe(true)
    })

    it('SUPPORT não pode bloquear usuários', () => {
      expect(canBlockUser(AdminRole.SUPPORT)).toBe(false)
    })
  })

  describe('canSuspendChurch', () => {
    it('SUPERADMIN pode suspender igrejas', () => {
      expect(canSuspendChurch(AdminRole.SUPERADMIN)).toBe(true)
    })

    it('SUPPORT não pode suspender igrejas', () => {
      expect(canSuspendChurch(AdminRole.SUPPORT)).toBe(false)
    })
  })

  describe('canChangePlan', () => {
    it('SUPERADMIN pode trocar planos', () => {
      expect(canChangePlan(AdminRole.SUPERADMIN)).toBe(true)
    })

    it('FINANCE pode trocar planos', () => {
      expect(canChangePlan(AdminRole.FINANCE)).toBe(true)
    })

    it('SUPPORT não pode trocar planos', () => {
      expect(canChangePlan(AdminRole.SUPPORT)).toBe(false)
    })
  })

  describe('canImpersonate', () => {
    it('SUPERADMIN pode impersonar', () => {
      expect(canImpersonate(AdminRole.SUPERADMIN)).toBe(true)
    })

    it('SUPPORT pode impersonar', () => {
      expect(canImpersonate(AdminRole.SUPPORT)).toBe(true)
    })

    it('FINANCE não pode impersonar', () => {
      expect(canImpersonate(AdminRole.FINANCE)).toBe(false)
    })
  })

  describe('canAccessConfig', () => {
    it('SUPERADMIN pode acessar config', () => {
      expect(canAccessConfig(AdminRole.SUPERADMIN)).toBe(true)
    })

    it('SUPPORT não pode acessar config', () => {
      expect(canAccessConfig(AdminRole.SUPPORT)).toBe(false)
    })
  })

  describe('canAccessAudit', () => {
    it('SUPERADMIN pode acessar audit', () => {
      expect(canAccessAudit(AdminRole.SUPERADMIN)).toBe(true)
    })

    it('SUPPORT não pode acessar audit', () => {
      expect(canAccessAudit(AdminRole.SUPPORT)).toBe(false)
    })
  })

  describe('canManagePlans', () => {
    it('SUPERADMIN pode gerenciar planos', () => {
      expect(canManagePlans(AdminRole.SUPERADMIN)).toBe(true)
    })

    it('SUPPORT não pode gerenciar planos', () => {
      expect(canManagePlans(AdminRole.SUPPORT)).toBe(false)
    })
  })

  describe('canViewUsers', () => {
    it('SUPERADMIN pode ver usuários', () => {
      expect(canViewUsers(AdminRole.SUPERADMIN)).toBe(true)
    })

    it('SUPPORT pode ver usuários', () => {
      expect(canViewUsers(AdminRole.SUPPORT)).toBe(true)
    })

    it('FINANCE não pode ver usuários', () => {
      expect(canViewUsers(AdminRole.FINANCE)).toBe(false)
    })
  })

  describe('canViewChurches', () => {
    it('SUPERADMIN pode ver igrejas', () => {
      expect(canViewChurches(AdminRole.SUPERADMIN)).toBe(true)
    })

    it('SUPPORT pode ver igrejas', () => {
      expect(canViewChurches(AdminRole.SUPPORT)).toBe(true)
    })
  })

  describe('canViewSubscriptions', () => {
    it('SUPERADMIN pode ver assinaturas', () => {
      expect(canViewSubscriptions(AdminRole.SUPERADMIN)).toBe(true)
    })

    it('FINANCE pode ver assinaturas', () => {
      expect(canViewSubscriptions(AdminRole.FINANCE)).toBe(true)
    })

    it('SUPPORT não pode ver assinaturas', () => {
      expect(canViewSubscriptions(AdminRole.SUPPORT)).toBe(false)
    })
  })

  describe('canViewMembers', () => {
    it('SUPERADMIN pode ver membros', () => {
      expect(canViewMembers(AdminRole.SUPERADMIN)).toBe(true)
    })

    it('SUPPORT pode ver membros', () => {
      expect(canViewMembers(AdminRole.SUPPORT)).toBe(true)
    })
  })
})








