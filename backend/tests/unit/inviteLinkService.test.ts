import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  generateInviteLink,
  validateInviteLink,
  incrementLinkUsage,
  deactivateInviteLink,
  getActiveLinksByBranch,
} from '../../src/services/inviteLinkService'
import { prisma } from '../../src/lib/prisma'
import { checkPlanMembersLimit } from '../../src/utils/planLimits'
import { validateMemberCreationPermission, getMemberFromUserId } from '../../src/utils/authorization'

vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    memberInviteLink: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    member: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    branch: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

vi.mock('../../src/utils/planLimits')
vi.mock('../../src/utils/authorization')
vi.mock('../../src/services/emailService', () => ({
  sendMemberLimitReachedNotification: vi.fn(),
}))

describe('inviteLinkService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateInviteLink', () => {
    it('deve gerar um link de convite com sucesso', async () => {
      const mockMember = {
        id: 'member-1',
        Branch: {
          churchId: 'church-1',
        },
        Permission: [],
        role: 'ADMINFILIAL',
      }

      const mockBranch = {
        id: 'branch-1',
        name: 'Sede',
        churchId: 'church-1',
        Church: {
          id: 'church-1',
          name: 'Igreja Teste',
        },
      }

      const mockInviteLink = {
        id: 'link-1',
        token: 'inv_test_token',
        branchId: 'branch-1',
        createdBy: 'user-1',
        maxUses: null,
        currentUses: 0,
        expiresAt: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        Branch: mockBranch,
      }

      vi.mocked(getMemberFromUserId).mockResolvedValue(mockMember as any)
      vi.mocked(validateMemberCreationPermission).mockResolvedValue(undefined)
      vi.mocked(checkPlanMembersLimit).mockResolvedValue(undefined)
      vi.mocked(prisma.branch.findUnique).mockResolvedValue(mockBranch as any)
      vi.mocked(prisma.memberInviteLink.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.memberInviteLink.create).mockResolvedValue(mockInviteLink as any)

      const result = await generateInviteLink({
        branchId: 'branch-1',
        createdBy: 'user-1',
        maxUses: null,
        expiresAt: null,
      })

      expect(result).toBeDefined()
      expect(result.token).toBeDefined()
      expect(prisma.memberInviteLink.create).toHaveBeenCalled()
    })

    it('deve lançar erro se membro criador não for encontrado', async () => {
      vi.mocked(getMemberFromUserId).mockResolvedValue(null)

      await expect(
        generateInviteLink({
          branchId: 'branch-1',
          createdBy: 'user-1',
        })
      ).rejects.toThrow('Membro criador não encontrado')
    })

    it('deve lançar erro com código PLAN_LIMIT_REACHED se limite de plano for atingido', async () => {
      const mockMember = {
        id: 'member-1',
        Branch: {
          churchId: 'church-1',
        },
        Permission: [],
        role: 'ADMINFILIAL',
      }

      const mockBranch = {
        id: 'branch-1',
        name: 'Sede',
        churchId: 'church-1',
        Church: {
          id: 'church-1',
          name: 'Igreja Teste',
        },
      }

      vi.mocked(getMemberFromUserId).mockResolvedValue(mockMember as any)
      vi.mocked(validateMemberCreationPermission).mockResolvedValue(undefined)
      vi.mocked(prisma.branch.findUnique).mockResolvedValue(mockBranch as any)
      vi.mocked(checkPlanMembersLimit).mockRejectedValue(
        new Error('Limite do plano atingido: máximo de 10 membros excedido. Você tem 10 membros.')
      )

      try {
        await generateInviteLink({
          branchId: 'branch-1',
          createdBy: 'user-1',
        })
        expect.fail('Deveria ter lançado erro')
      } catch (error: any) {
        expect(error.code).toBe('PLAN_LIMIT_REACHED')
        expect(error.message).toContain('Limite de membros do plano atingido')
      }
    })
  })

  describe('validateInviteLink', () => {
    it('deve validar link ativo e não expirado', async () => {
      const mockLink = {
        id: 'link-1',
        token: 'inv_test_token',
        branchId: 'branch-1',
        isActive: true,
        expiresAt: null,
        maxUses: null,
        currentUses: 0,
        Branch: {
          id: 'branch-1',
          name: 'Sede',
          churchId: 'church-1',
          Church: {
            id: 'church-1',
            name: 'Igreja Teste',
          },
        },
      }

      vi.mocked(prisma.memberInviteLink.findUnique).mockResolvedValue(mockLink as any)
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null)

      const result = await validateInviteLink('inv_test_token')

      expect(result.valid).toBe(true)
      expect(result.inviteLink).toBeDefined()
    })

    it('deve retornar inválido se link estiver desativado', async () => {
      const mockLink = {
        id: 'link-1',
        token: 'inv_test_token',
        isActive: false,
        Branch: {
          Church: {
            name: 'Igreja Teste',
          },
        },
      }

      vi.mocked(prisma.memberInviteLink.findUnique).mockResolvedValue(mockLink as any)

      const result = await validateInviteLink('inv_test_token')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Este link de convite foi desativado')
    })

    it('deve retornar inválido se link expirou', async () => {
      const expiredDate = new Date()
      expiredDate.setDate(expiredDate.getDate() - 1)

      const mockLink = {
        id: 'link-1',
        token: 'inv_test_token',
        isActive: true,
        expiresAt: expiredDate,
        Branch: {
          Church: {
            name: 'Igreja Teste',
          },
        },
      }

      vi.mocked(prisma.memberInviteLink.findUnique).mockResolvedValue(mockLink as any)

      const result = await validateInviteLink('inv_test_token')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Este link de convite expirou')
    })

    it('deve considerar link válido se expiresAt for hoje (fim do dia)', async () => {
      // Cria uma data para hoje no fim do dia (23:59:59.999)
      const todayEndOfDay = new Date()
      todayEndOfDay.setHours(23, 59, 59, 999)

      const mockLink = {
        id: 'link-1',
        token: 'inv_test_token',
        isActive: true,
        expiresAt: todayEndOfDay,
        maxUses: null,
        currentUses: 0,
        Branch: {
          id: 'branch-1',
          name: 'Sede',
          churchId: 'church-1',
          Church: {
            id: 'church-1',
            name: 'Igreja Teste',
          },
        },
      }

      vi.mocked(prisma.memberInviteLink.findUnique).mockResolvedValue(mockLink as any)
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null)

      const result = await validateInviteLink('inv_test_token')

      expect(result.valid).toBe(true)
      expect(result.inviteLink).toBeDefined()
    })

    it('deve considerar link expirado apenas após o fim do dia', async () => {
      // Cria uma data para ontem no fim do dia
      const yesterdayEndOfDay = new Date()
      yesterdayEndOfDay.setDate(yesterdayEndOfDay.getDate() - 1)
      yesterdayEndOfDay.setHours(23, 59, 59, 999)

      const mockLink = {
        id: 'link-1',
        token: 'inv_test_token',
        isActive: true,
        expiresAt: yesterdayEndOfDay,
        Branch: {
          Church: {
            name: 'Igreja Teste',
          },
        },
      }

      vi.mocked(prisma.memberInviteLink.findUnique).mockResolvedValue(mockLink as any)

      const result = await validateInviteLink('inv_test_token')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Este link de convite expirou')
    })

    it('deve retornar LIMIT_REACHED se limite de membros do plano foi atingido', async () => {
      const mockLink = {
        id: 'link-1',
        token: 'inv_test_token',
        branchId: 'branch-1',
        isActive: true,
        expiresAt: null,
        maxUses: null,
        currentUses: 0,
        Branch: {
          id: 'branch-1',
          name: 'Sede',
          churchId: 'church-1',
          Church: {
            id: 'church-1',
            name: 'Igreja Teste',
          },
        },
      }

      const mockUser = {
        id: 'user-1',
        Subscription: [
          {
            status: 'active',
            Plan: {
              id: 'plan-1',
              maxMembers: 10,
            },
          },
        ],
      }

      const mockBranches = [
        {
          _count: {
            Member: 10,
          },
        },
      ]

      vi.mocked(prisma.memberInviteLink.findUnique).mockResolvedValue(mockLink as any)
      vi.mocked(prisma.user.findFirst).mockResolvedValue(mockUser as any)
      vi.mocked(prisma.branch.findMany).mockResolvedValue(mockBranches as any)
      vi.mocked(prisma.member.findMany).mockResolvedValue([])

      const result = await validateInviteLink('inv_test_token')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('LIMIT_REACHED')
    })
  })

  describe('incrementLinkUsage', () => {
    it('deve incrementar o contador de uso do link', async () => {
      const mockLink = {
        id: 'link-1',
        token: 'inv_test_token',
        currentUses: 5,
      }

      const updatedLink = {
        ...mockLink,
        currentUses: 6,
      }

      vi.mocked(prisma.memberInviteLink.findUnique).mockResolvedValue(mockLink as any)
      vi.mocked(prisma.memberInviteLink.update).mockResolvedValue(updatedLink as any)

      const result = await incrementLinkUsage('inv_test_token')

      expect(result.currentUses).toBe(6)
      expect(prisma.memberInviteLink.update).toHaveBeenCalledWith({
        where: { token: 'inv_test_token' },
        data: { currentUses: 6 },
      })
    })

    it('deve lançar erro se link não for encontrado', async () => {
      vi.mocked(prisma.memberInviteLink.findUnique).mockResolvedValue(null)

      await expect(incrementLinkUsage('invalid_token')).rejects.toThrow(
        'Link de convite não encontrado'
      )
    })
  })

  describe('deactivateInviteLink', () => {
    it('deve desativar link com sucesso', async () => {
      const mockMember = {
        id: 'member-1',
        Branch: {
          churchId: 'church-1',
        },
        Permission: [],
        role: 'ADMINFILIAL',
      }

      const mockLink = {
        id: 'link-1',
        createdBy: 'user-1',
        Branch: {
          churchId: 'church-1',
          Church: {
            name: 'Igreja Teste',
          },
        },
      }

      const deactivatedLink = {
        ...mockLink,
        isActive: false,
      }

      vi.mocked(getMemberFromUserId).mockResolvedValue(mockMember as any)
      vi.mocked(prisma.memberInviteLink.findUnique).mockResolvedValue(mockLink as any)
      vi.mocked(prisma.member.findUnique).mockResolvedValue({
        ...mockMember,
        Permission: [],
      } as any)
      vi.mocked(prisma.memberInviteLink.update).mockResolvedValue(deactivatedLink as any)

      const result = await deactivateInviteLink('link-1', 'user-1')

      expect(result.isActive).toBe(false)
      expect(prisma.memberInviteLink.update).toHaveBeenCalledWith({
        where: { id: 'link-1' },
        data: { isActive: false },
        include: {
          Branch: {
            include: {
              Church: true,
            },
          },
        },
      })
    })
  })

  describe('getActiveLinksByBranch', () => {
    it('deve retornar links ativos de uma filial', async () => {
      const mockMember = {
        id: 'member-1',
        Branch: {
          churchId: 'church-1',
        },
      }

      const mockBranch = {
        id: 'branch-1',
        churchId: 'church-1',
      }

      const mockLinks = [
        {
          id: 'link-1',
          token: 'inv_test_token',
          createdBy: 'user-1',
          isActive: true,
          Branch: {
            Church: {
              name: 'Igreja Teste',
            },
          },
          _count: {
            Member: 0,
          },
        },
      ]

      const mockCreator = {
        firstName: 'Admin',
        lastName: 'Test',
        email: 'admin@test.com',
      }

      vi.mocked(getMemberFromUserId).mockResolvedValue(mockMember as any)
      vi.mocked(prisma.branch.findUnique).mockResolvedValue(mockBranch as any)
      vi.mocked(prisma.memberInviteLink.findMany).mockResolvedValue(mockLinks as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockCreator as any)

      const result = await getActiveLinksByBranch('branch-1', 'user-1')

      expect(result).toHaveLength(1)
      expect(result[0].isActive).toBe(true)
      expect(result[0].creatorName).toBe('Admin Test')
      expect(result[0].creatorEmail).toBe('admin@test.com')
    })
  })
})

