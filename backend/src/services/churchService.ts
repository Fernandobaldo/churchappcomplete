// Atualização para suportar soft delete para usuários comuns e hard delete para admin do SaaS

import { prisma } from '../lib/prisma'
import { Role } from '@prisma/client'
import { ALL_PERMISSION_TYPES } from '../constants/permissions'
import bcrypt from 'bcryptjs'

interface CreateChurchData {
  name: string
  logoUrl?: string
  branchName?: string
  pastorName?: string
  withBranch?: boolean
}

interface UserData {
  id: string
  name: string
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
          isActive: true,
        },
      })

      let branch = null
      let member = null

      // Só cria branch e member se withBranch não for false
      if (data.withBranch !== false) {
        branch = await tx.branch.create({
          data: {
            name: data.branchName || 'Sede',
            churchId: church.id,
            isMainBranch: true,
          },
        })

        const hashedPassword = await bcrypt.hash(user.password, 10)

        member = await tx.member.create({
          data: {
            name: user.name,
            email: user.email,
            password: hashedPassword,
            role: Role.ADMINGERAL,
            branchId: branch.id,
            userId: user.id,
          },
        })

        const allPermissions = await tx.permission.findMany({
          where: { type: { in: ALL_PERMISSION_TYPES } },
        })

        await tx.member.update({
          where: { id: member.id },
          data: {
            Permission: {
              connect: allPermissions.map((p) => ({ id: p.id })),
            },
          },
        })
      }

      return {
        church,
        branch,
        member,
      }
    })
  }

  async getAllChurches() {
    return prisma.church.findMany({
      where: { isActive: true },
      include: {
        Branch: true,
      },
    })
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
      },
    })
  }

  // Soft delete para usuários normais
  async deactivateChurch(id: string) {
    return prisma.church.update({
      where: { id },
      data: { isActive: false },
    })
  }

  // Hard delete apenas para admin do SaaS
  async deleteChurch(id: string) {
    return prisma.$transaction(async (tx) => {
      // Apaga membros relacionados a branches da igreja
      const branches = await tx.branch.findMany({
        where: { churchId: id },
      })

      for (const branch of branches) {
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
