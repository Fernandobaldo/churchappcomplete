// Atualização para suportar soft delete para usuários comuns e hard delete para admin do SaaS

import { prisma } from '../lib/prisma'
import { Role } from '@prisma/client'
import { ALL_PERMISSION_TYPES } from '../constants/permissions'

interface CreateChurchData {
  name: string
  logoUrl?: string
  avatarUrl?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  socialMedia?: any
  branchName?: string
  pastorName?: string
  withBranch?: boolean
}

interface UserData {
  id: string
  firstName: string
  lastName: string
  email: string
  password: string // já deve estar criptografada
}

export class ChurchService {
  async createChurchWithMainBranch(data: CreateChurchData, user: UserData) {
    return await prisma.$transaction(async (tx) => {
      const church = await tx.church.create({
        data: {
          name: data.name,
          logoUrl: data.logoUrl,
          avatarUrl: data.avatarUrl,
          address: data.address,
          phone: data.phone,
          email: data.email,
          website: data.website,
          socialMedia: data.socialMedia,
          isActive: true,
          createdByUserId: user.id, // Salvar quem criou a igreja
        },
      })

      // Sempre cria branch principal (obrigatório para Member)
      const branch = await tx.branch.create({
        data: {
          name: data.branchName || 'Sede',
          churchId: church.id,
          isMainBranch: true,
        },
      })

      // Verifica se já existe um Member com esse userId ou email
      let existingMember = await tx.member.findFirst({
        where: {
          OR: [
            { userId: user.id },
            { email: user.email },
          ],
        },
      })

      let member
      if (existingMember) {
        // Se já existe, atualiza para associar à nova branch e role
        member = await tx.member.update({
          where: { id: existingMember.id },
          data: {
            role: Role.ADMINGERAL,
            branchId: branch.id,
            userId: user.id,
          },
        })
      } else {
        // Se não existe, cria novo Member (sem senha - usa senha do User)
        const { getUserFullName } = await import('../utils/userUtils')
        member = await tx.member.create({
          data: {
            name: getUserFullName(user),
            email: user.email,
            role: Role.ADMINGERAL,
            branchId: branch.id,
            userId: user.id,
          },
        })
      }

      // Cria as permissões diretamente para o member (apenas se não existirem)
      // Permission tem memberId obrigatório, então não pode existir sem um member
      await tx.permission.createMany({
        data: ALL_PERMISSION_TYPES.map((type) => ({
          memberId: member.id,
          type,
        })),
        skipDuplicates: true,
      })

      return {
        church,
        branch,
        member,
      }
    })
  }

  async getAllChurches(userBranchId?: string | null, userId?: string | null) {
    // Se não tem userId nem userBranchId, retornar array vazio (não retornar dados de outros)
    if (!userId && !userBranchId) {
      return []
    }
    
    // Se o usuário tem branchId, retorna apenas a igreja da branch do usuário
    if (userBranchId) {
      const branch = await prisma.branch.findUnique({
        where: { id: userBranchId },
        include: {
          Church: {
            include: {
              Branch: true,
            },
          },
        },
      })
      
      if (branch?.Church) {
        return [branch.Church]
      }
      
      // Se não encontrou a branch, retorna array vazio
      return []
    }
    
    // Se não tem branchId mas tem userId, tenta buscar através do createdByUserId
    if (userId) {
      const church = await prisma.church.findFirst({
        where: {
          createdByUserId: userId,
        },
        include: {
          Branch: true,
        },
      })
      
      if (church) {
        return [church]
      }
      
      // Também tenta buscar através do Member
      const member = await prisma.member.findFirst({
        where: {
          userId: userId,
        },
        include: {
          Branch: {
            include: {
              Church: {
                include: {
                  Branch: true,
                },
              },
            },
          },
        },
      })
      
      if (member?.Branch?.Church) {
        return [member.Branch.Church]
      }
    }
    
    // Se não encontrou nada, retorna array vazio
    return []
  }

  async getChurchById(id: string) {
    return prisma.church.findUnique({
      where: { id },
      include: {
        Branch: true,
      },
    })
  }

  async updateChurch(id: string, data: CreateChurchData) {
    return prisma.church.update({
      where: { id },
      data: {
        name: data.name,
        logoUrl: data.logoUrl,
        avatarUrl: data.avatarUrl,
        address: data.address,
        phone: data.phone,
        email: data.email,
        website: data.website,
        socialMedia: data.socialMedia,
      },
    })
  }

  // Soft delete para usuários normais
  async deactivateChurch(id: string) {
    return prisma.church.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        isActive: true,
      },
    })
  }

  // Hard delete apenas para admin do SaaS
  async deleteChurch(id: string) {
    return prisma.$transaction(async (tx) => {
      // Busca todas as branches da igreja
      const branches = await tx.branch.findMany({
        where: { churchId: id },
        include: {
          Member: true, // Inclui membros para deletar permissões primeiro
        },
      })

      // Para cada branch, deleta permissões dos membros e depois os membros
      for (const branch of branches) {
        // Deleta permissões dos membros da branch
        const memberIds = branch.Member.map(m => m.id)
        if (memberIds.length > 0) {
          await tx.permission.deleteMany({
            where: { memberId: { in: memberIds } },
          })
        }
        
        // Deleta membros da branch
        await tx.member.deleteMany({ where: { branchId: branch.id } })
      }

      // Apaga branches da igreja
      await tx.branch.deleteMany({ where: { churchId: id } })

      // Apaga a igreja
      return await tx.church.delete({ where: { id } })
    })
  }

  async getUserData(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
    })
  }
}
