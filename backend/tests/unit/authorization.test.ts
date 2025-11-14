import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  validateMemberCreationPermission,
  validateRoleHierarchy,
  validateMemberEditPermission,
  getMemberFromUserId,
} from '../../src/utils/authorization'
import { Role } from '@prisma/client'
import { prisma } from '../../src/lib/prisma'

// Mock do prisma
vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    member: {
      findUnique: vi.fn(),
    },
    branch: {
      findUnique: vi.fn(),
    },
  },
}))

describe('authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('validateRoleHierarchy', () => {
    it('deve lançar erro se tentar criar ADMINGERAL', () => {
      expect(() => {
        validateRoleHierarchy(Role.ADMINGERAL, Role.ADMINGERAL)
      }).toThrow('Apenas o sistema pode criar um Administrador Geral')
    })

    it('deve lançar erro se ADMINFILIAL tentar criar ADMINGERAL', () => {
      expect(() => {
        validateRoleHierarchy(Role.ADMINFILIAL, Role.ADMINGERAL)
      }).toThrow('Apenas o sistema pode criar um Administrador Geral')
    })

    it('deve lançar erro se COORDINATOR tentar criar role diferente de MEMBER', () => {
      expect(() => {
        validateRoleHierarchy(Role.COORDINATOR, Role.ADMINFILIAL)
      }).toThrow('Coordenadores só podem criar membros com role MEMBER')

      expect(() => {
        validateRoleHierarchy(Role.COORDINATOR, Role.COORDINATOR)
      }).toThrow('Coordenadores só podem criar membros com role MEMBER')
    })

    it('deve lançar erro se MEMBER tentar atribuir role', () => {
      expect(() => {
        validateRoleHierarchy(Role.MEMBER, Role.MEMBER)
      }).toThrow('Membros não podem atribuir roles')
    })

    it('deve permitir ADMINGERAL criar ADMINFILIAL', () => {
      expect(() => {
        validateRoleHierarchy(Role.ADMINGERAL, Role.ADMINFILIAL)
      }).not.toThrow()
    })

    it('deve permitir ADMINGERAL criar COORDINATOR', () => {
      expect(() => {
        validateRoleHierarchy(Role.ADMINGERAL, Role.COORDINATOR)
      }).not.toThrow()
    })

    it('deve permitir ADMINGERAL criar MEMBER', () => {
      expect(() => {
        validateRoleHierarchy(Role.ADMINGERAL, Role.MEMBER)
      }).not.toThrow()
    })

    it('deve permitir ADMINFILIAL criar COORDINATOR', () => {
      expect(() => {
        validateRoleHierarchy(Role.ADMINFILIAL, Role.COORDINATOR)
      }).not.toThrow()
    })

    it('deve permitir ADMINFILIAL criar MEMBER', () => {
      expect(() => {
        validateRoleHierarchy(Role.ADMINFILIAL, Role.MEMBER)
      }).not.toThrow()
    })

    it('deve permitir COORDINATOR criar MEMBER', () => {
      expect(() => {
        validateRoleHierarchy(Role.COORDINATOR, Role.MEMBER)
      }).not.toThrow()
    })
  })

  describe('validateMemberCreationPermission', () => {
    const mockChurchId = 'church-1'
    const mockBranchId = 'branch-1'
    const mockOtherBranchId = 'branch-2'
    const mockOtherChurchId = 'church-2'

    const mockCreatorADMINGERAL = {
      id: 'member-1',
      role: Role.ADMINGERAL,
      branchId: mockBranchId,
      branch: {
        id: mockBranchId,
        churchId: mockChurchId,
        church: {
          id: mockChurchId,
          name: 'Igreja Teste',
        },
      },
      permissions: [],
    }

    const mockCreatorADMINFILIAL = {
      id: 'member-2',
      role: Role.ADMINFILIAL,
      branchId: mockBranchId,
      branch: {
        id: mockBranchId,
        churchId: mockChurchId,
        church: {
          id: mockChurchId,
          name: 'Igreja Teste',
        },
      },
      permissions: [],
    }

    const mockCreatorCOORDINATOR = {
      id: 'member-3',
      role: Role.COORDINATOR,
      branchId: mockBranchId,
      branch: {
        id: mockBranchId,
        churchId: mockChurchId,
        church: {
          id: mockChurchId,
          name: 'Igreja Teste',
        },
      },
      permissions: [{ type: 'members_manage' }],
    }

    const mockCreatorMEMBER = {
      id: 'member-4',
      role: Role.MEMBER,
      branchId: mockBranchId,
      branch: {
        id: mockBranchId,
        churchId: mockChurchId,
        church: {
          id: mockChurchId,
          name: 'Igreja Teste',
        },
      },
      permissions: [{ type: 'members_manage' }],
    }

    const mockTargetBranch = {
      id: mockBranchId,
      churchId: mockChurchId,
      church: {
        id: mockChurchId,
        name: 'Igreja Teste',
      },
    }

    it('deve permitir ADMINGERAL criar membro em qualquer branch da igreja', async () => {
      prisma.member.findUnique.mockResolvedValue(mockCreatorADMINGERAL)
      prisma.branch.findUnique.mockResolvedValue(mockTargetBranch)

      await expect(
        validateMemberCreationPermission(
          mockCreatorADMINGERAL.id,
          mockBranchId,
          Role.MEMBER
        )
      ).resolves.not.toThrow()
    })

    it('deve permitir ADMINFILIAL criar membro na sua própria filial', async () => {
      prisma.member.findUnique.mockResolvedValue(mockCreatorADMINFILIAL)
      prisma.branch.findUnique.mockResolvedValue(mockTargetBranch)

      await expect(
        validateMemberCreationPermission(
          mockCreatorADMINFILIAL.id,
          mockBranchId,
          Role.MEMBER
        )
      ).resolves.not.toThrow()
    })

    it('deve lançar erro se ADMINFILIAL tentar criar membro em outra filial', async () => {
      prisma.member.findUnique.mockResolvedValue(mockCreatorADMINFILIAL)
      prisma.branch.findUnique.mockResolvedValue({
        ...mockTargetBranch,
        id: mockOtherBranchId,
      })

      await expect(
        validateMemberCreationPermission(
          mockCreatorADMINFILIAL.id,
          mockOtherBranchId,
          Role.MEMBER
        )
      ).rejects.toThrow('Você só pode criar membros na sua própria filial')
    })

    it('deve permitir COORDINATOR com permissão criar membro na sua filial', async () => {
      prisma.member.findUnique.mockResolvedValue(mockCreatorCOORDINATOR)
      prisma.branch.findUnique.mockResolvedValue(mockTargetBranch)

      await expect(
        validateMemberCreationPermission(
          mockCreatorCOORDINATOR.id,
          mockBranchId,
          Role.MEMBER
        )
      ).resolves.not.toThrow()
    })

    it('deve lançar erro se COORDINATOR não tiver permissão members_manage', async () => {
      const coordinatorWithoutPermission = {
        ...mockCreatorCOORDINATOR,
        permissions: [],
      }

      prisma.member.findUnique.mockResolvedValue(coordinatorWithoutPermission)
      prisma.branch.findUnique.mockResolvedValue(mockTargetBranch)

      await expect(
        validateMemberCreationPermission(
          coordinatorWithoutPermission.id,
          mockBranchId,
          Role.MEMBER
        )
      ).rejects.toThrow('Você não tem permissão para criar membros')
    })

    it('deve lançar erro se MEMBER não tiver permissão members_manage', async () => {
      const memberWithoutPermission = {
        ...mockCreatorMEMBER,
        permissions: [],
      }

      prisma.member.findUnique.mockResolvedValue(memberWithoutPermission)
      prisma.branch.findUnique.mockResolvedValue(mockTargetBranch)

      await expect(
        validateMemberCreationPermission(
          memberWithoutPermission.id,
          mockBranchId,
          Role.MEMBER
        )
      ).rejects.toThrow('Você não tem permissão para criar membros')
    })

    it('deve lançar erro se branch não existir', async () => {
      prisma.member.findUnique.mockResolvedValue(mockCreatorADMINGERAL)
      prisma.branch.findUnique.mockResolvedValue(null)

      await expect(
        validateMemberCreationPermission(
          mockCreatorADMINGERAL.id,
          'branch-inexistente',
          Role.MEMBER
        )
      ).rejects.toThrow('Filial não encontrada')
    })

    it('deve lançar erro se branch pertencer a outra igreja', async () => {
      prisma.member.findUnique.mockResolvedValue(mockCreatorADMINGERAL)
      prisma.branch.findUnique.mockResolvedValue({
        ...mockTargetBranch,
        churchId: mockOtherChurchId,
      })

      await expect(
        validateMemberCreationPermission(
          mockCreatorADMINGERAL.id,
          mockOtherBranchId,
          Role.MEMBER
        )
      ).rejects.toThrow('Você não pode criar membros em filiais de outras igrejas')
    })

    it('deve lançar erro se criador não existir', async () => {
      prisma.member.findUnique.mockResolvedValue(null)

      await expect(
        validateMemberCreationPermission(
          'member-inexistente',
          mockBranchId,
          Role.MEMBER
        )
      ).rejects.toThrow('Membro criador não encontrado')
    })
  })

  describe('validateMemberEditPermission', () => {
    const mockChurchId = 'church-1'
    const mockBranchId = 'branch-1'
    const mockOtherBranchId = 'branch-2'
    const mockOtherChurchId = 'church-2'

    const mockEditorADMINGERAL = {
      id: 'member-1',
      role: Role.ADMINGERAL,
      branchId: mockBranchId,
      branch: {
        id: mockBranchId,
        churchId: mockChurchId,
        church: {
          id: mockChurchId,
          name: 'Igreja Teste',
        },
      },
    }

    const mockEditorADMINFILIAL = {
      id: 'member-2',
      role: Role.ADMINFILIAL,
      branchId: mockBranchId,
      branch: {
        id: mockBranchId,
        churchId: mockChurchId,
        church: {
          id: mockChurchId,
          name: 'Igreja Teste',
        },
      },
    }

    const mockTargetMemberSameBranch = {
      id: 'member-3',
      branchId: mockBranchId,
      branch: {
        id: mockBranchId,
        churchId: mockChurchId,
        church: {
          id: mockChurchId,
          name: 'Igreja Teste',
        },
      },
    }

    const mockTargetMemberOtherBranch = {
      id: 'member-4',
      branchId: mockOtherBranchId,
      branch: {
        id: mockOtherBranchId,
        churchId: mockChurchId,
        church: {
          id: mockChurchId,
          name: 'Igreja Teste',
        },
      },
    }

    it('deve permitir ADMINGERAL editar membro de outra filial da mesma igreja', async () => {
      prisma.member.findUnique
        .mockResolvedValueOnce(mockEditorADMINGERAL)
        .mockResolvedValueOnce(mockTargetMemberOtherBranch)

      await expect(
        validateMemberEditPermission(
          mockEditorADMINGERAL.id,
          mockTargetMemberOtherBranch.id
        )
      ).resolves.not.toThrow()
    })

    it('deve lançar erro se ADMINGERAL tentar editar membro de outra igreja', async () => {
      const targetMemberOtherChurch = {
        ...mockTargetMemberOtherBranch,
        branch: {
          ...mockTargetMemberOtherBranch.branch,
          churchId: mockOtherChurchId,
          church: {
            id: mockOtherChurchId,
            name: 'Outra Igreja',
          },
        },
      }

      prisma.member.findUnique
        .mockResolvedValueOnce(mockEditorADMINGERAL)
        .mockResolvedValueOnce(targetMemberOtherChurch)

      await expect(
        validateMemberEditPermission(
          mockEditorADMINGERAL.id,
          targetMemberOtherChurch.id
        )
      ).rejects.toThrow('Você só pode editar membros da sua igreja')
    })

    it('deve permitir ADMINFILIAL editar membro da sua filial', async () => {
      prisma.member.findUnique
        .mockResolvedValueOnce(mockEditorADMINFILIAL)
        .mockResolvedValueOnce(mockTargetMemberSameBranch)

      await expect(
        validateMemberEditPermission(
          mockEditorADMINFILIAL.id,
          mockTargetMemberSameBranch.id
        )
      ).resolves.not.toThrow()
    })

    it('deve lançar erro se ADMINFILIAL tentar editar membro de outra filial', async () => {
      prisma.member.findUnique
        .mockResolvedValueOnce(mockEditorADMINFILIAL)
        .mockResolvedValueOnce(mockTargetMemberOtherBranch)

      await expect(
        validateMemberEditPermission(
          mockEditorADMINFILIAL.id,
          mockTargetMemberOtherBranch.id
        )
      ).rejects.toThrow('Você só pode editar membros da sua filial')
    })

    it('deve permitir membro editar a si mesmo', async () => {
      const member = {
        id: 'member-5',
        role: Role.MEMBER,
        branchId: mockBranchId,
        branch: {
          id: mockBranchId,
          churchId: mockChurchId,
          church: {
            id: mockChurchId,
            name: 'Igreja Teste',
          },
        },
      }

      prisma.member.findUnique
        .mockResolvedValueOnce(member)
        .mockResolvedValueOnce(member)

      await expect(
        validateMemberEditPermission(member.id, member.id)
      ).resolves.not.toThrow()
    })

    it('deve lançar erro se membro tentar editar outro membro', async () => {
      const member = {
        id: 'member-5',
        role: Role.MEMBER,
        branchId: mockBranchId,
        branch: {
          id: mockBranchId,
          churchId: mockChurchId,
          church: {
            id: mockChurchId,
            name: 'Igreja Teste',
          },
        },
      }

      prisma.member.findUnique
        .mockResolvedValueOnce(member)
        .mockResolvedValueOnce(mockTargetMemberSameBranch)

      await expect(
        validateMemberEditPermission(member.id, mockTargetMemberSameBranch.id)
      ).rejects.toThrow('Você só pode editar seu próprio perfil')
    })
  })

  describe('getMemberFromUserId', () => {
    it('deve retornar member quando existe', async () => {
      const mockUser = {
        id: 'user-1',
        member: {
          id: 'member-1',
          role: Role.ADMINGERAL,
          branch: {
            id: 'branch-1',
            church: {
              id: 'church-1',
            },
          },
          permissions: [],
        },
      }

      prisma.user.findUnique.mockResolvedValue(mockUser)

      const result = await getMemberFromUserId('user-1')

      expect(result).toEqual(mockUser.member)
    })

    it('deve retornar null quando user não tem member', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        member: null,
      })

      const result = await getMemberFromUserId('user-1')

      expect(result).toBeNull()
    })
  })
})

