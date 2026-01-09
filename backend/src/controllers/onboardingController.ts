import { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../lib/prisma'
import type { AuthenticatedUser } from '../@types/fastify'
import { OnboardingProgressService } from '../services/onboardingProgressService'

export class OnboardingController {
  private progressService = new OnboardingProgressService()

  async getState(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as AuthenticatedUser | undefined
      if (!user) {
        return reply.code(401).send({ message: 'Usuário não autenticado.' })
      }

      const userId = user.userId || user.id
      const memberId = user.memberId
      const branchId = user.branchId

      // Se tem memberId e branchId, onboarding está completo
      if (memberId && branchId) {
        // Buscar dados completos
        const member = await prisma.member.findUnique({
          where: { id: memberId },
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
          return reply.send({
            status: 'COMPLETE',
            church: {
              id: member.Branch.Church.id,
              name: member.Branch.Church.name,
              address: member.Branch.Church.address,
              logoUrl: member.Branch.Church.logoUrl,
              avatarUrl: member.Branch.Church.avatarUrl,
            },
            branch: member.Branch ? {
              id: member.Branch.id,
              name: member.Branch.name,
            } : null,
            member: {
              id: member.id,
              role: member.role,
            },
          })
        }
      }

      // Se não está completo, verificar se existe igreja pendente
      // Buscar igreja criada por esse usuário
      const pendingChurch = await prisma.church.findFirst({
        where: {
          createdByUserId: userId,
        },
        include: {
          Branch: {
            include: {
              Member: {
                where: {
                  userId: userId,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc', // Pega a mais recente
        },
      })

      if (pendingChurch) {
        // Buscar member se existir
        const member = await prisma.member.findFirst({
          where: {
            userId: userId,
          },
          include: {
            Branch: {
              include: {
                Church: true,
              },
            },
          },
        })

        return reply.send({
          status: 'PENDING',
          church: {
            id: pendingChurch.id,
            name: pendingChurch.name,
            address: pendingChurch.address,
            logoUrl: pendingChurch.logoUrl,
            avatarUrl: pendingChurch.avatarUrl,
          },
          branch: pendingChurch.Branch.length > 0 ? {
            id: pendingChurch.Branch[0].id,
            name: pendingChurch.Branch[0].name,
          } : null,
          member: member ? {
            id: member.id,
            role: member.role,
            branchId: member.branchId,
          } : null,
        })
      }

      // Se não encontrou nada, status é NEW
      return reply.send({
        status: 'NEW',
      })
    } catch (error: any) {
      console.error('Erro ao buscar estado de onboarding:', error)
      return reply.status(500).send({
        error: 'Erro ao buscar estado de onboarding',
        message: error.message,
      })
    }
  }

  async getProgress(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as AuthenticatedUser | undefined
      if (!user) {
        return reply.code(401).send({ message: 'Usuário não autenticado.' })
      }

      const userId = user.userId || user.id
      const progress = await this.progressService.getOrCreateProgress(userId)

      return reply.send({
        churchConfigured: progress.churchConfigured,
        branchesConfigured: progress.branchesConfigured,
        settingsConfigured: progress.settingsConfigured,
        completed: progress.completed,
        completedAt: progress.completedAt,
      })
    } catch (error: any) {
      console.error('Erro ao buscar progresso de onboarding:', error)
      return reply.status(500).send({
        error: 'Erro ao buscar progresso de onboarding',
        message: error.message,
      })
    }
  }

  async markStepComplete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as AuthenticatedUser | undefined
      if (!user) {
        return reply.code(401).send({ message: 'Usuário não autenticado.' })
      }

      const userId = user.userId || user.id
      const { step } = request.params as { step: string }

      if (!['church', 'branches', 'settings'].includes(step)) {
        return reply.code(400).send({ message: 'Step inválido. Use: church, branches ou settings' })
      }

      await this.progressService.markStepComplete(userId, step as 'church' | 'branches' | 'settings')

      return reply.send({ message: 'Etapa marcada como completa' })
    } catch (error: any) {
      console.error('Erro ao marcar etapa como completa:', error)
      return reply.status(500).send({
        error: 'Erro ao marcar etapa como completa',
        message: error.message,
      })
    }
  }

  async markComplete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as AuthenticatedUser | undefined
      if (!user) {
        return reply.code(401).send({ message: 'Usuário não autenticado.' })
      }

      const userId = user.userId || user.id
      await this.progressService.markComplete(userId)

      // Buscar progresso atualizado para retornar
      const progress = await this.progressService.getProgress(userId)

      // Buscar User com Member para gerar token atualizado
      const userWithMember = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          Member: {
            include: {
              Permission: true,
              Branch: {
                include: {
                  Church: true,
                },
              },
            },
          },
        },
      })

      let newToken = null
      if (userWithMember?.Member) {
        const member = userWithMember.Member
        const onboardingCompleted = true // Acabamos de marcar como completo
        const tokenPayload = {
          sub: userWithMember.id,
          email: userWithMember.email,
          name: userWithMember.firstName && userWithMember.lastName 
            ? `${userWithMember.firstName} ${userWithMember.lastName}`.trim()
            : userWithMember.firstName || userWithMember.lastName || 'Usuário',
          type: 'member' as const,
          memberId: member.id,
          role: member.role,
          branchId: member.branchId,
          churchId: member.Branch?.Church?.id || null,
          permissions: member.Permission.map(p => p.type),
          onboardingCompleted,
        }
        
        newToken = request.server.jwt.sign(tokenPayload, { expiresIn: '7d' })
      }

      return reply.send({
        message: 'Onboarding marcado como completo',
        completed: progress?.completed ?? false,
        completedAt: progress?.completedAt,
        token: newToken,
      })
    } catch (error: any) {
      console.error('Erro ao marcar onboarding como completo:', error)
      return reply.status(500).send({
        error: 'Erro ao marcar onboarding como completo',
        message: error.message,
      })
    }
  }
}

