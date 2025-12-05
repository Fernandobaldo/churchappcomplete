import { prisma } from '../lib/prisma'
import { SubscriptionStatus } from '@prisma/client'
import { checkPlanMembersLimit } from '../utils/planLimits'
import { validateMemberCreationPermission, getMemberFromUserId } from '../utils/authorization'
import { sendMemberLimitReachedNotification } from './emailService'

interface CreateInviteLinkInput {
  branchId: string
  createdBy: string
  maxUses?: number | null
  expiresAt?: Date | null
}

/**
 * Gera um token único para o link de convite
 */
function generateToken(): string {
  // Usa cuid() do Prisma para gerar um token único
  // Mas precisamos de algo mais curto, então vamos usar uma combinação
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 15)
  return `inv_${timestamp}_${random}`.substring(0, 50)
}

/**
 * Gera um novo link de convite
 */
export async function generateInviteLink(data: CreateInviteLinkInput) {
  const { branchId, createdBy, maxUses, expiresAt } = data

  // 1. Validar permissões do criador
  const creatorMember = await getMemberFromUserId(createdBy)
  if (!creatorMember) {
    console.error('❌ [GENERATE INVITE LINK] Membro não encontrado para userId:', createdBy)
    // Tentar buscar diretamente pelo userId
    const user = await prisma.user.findUnique({
      where: { id: createdBy },
      include: {
        Member: {
          include: {
            Branch: {
              include: { Church: true },
            },
            Permission: true,
          },
        },
      },
    })
    console.error('❌ [GENERATE INVITE LINK] User encontrado:', user ? 'sim' : 'não')
    console.error('❌ [GENERATE INVITE LINK] Member encontrado:', user?.Member ? 'sim' : 'não')
    throw new Error('Membro criador não encontrado. Você precisa estar logado como membro para criar links de convite.')
  }

  // 2. Validar se pode criar membros (mesma validação de criação direta)
  await validateMemberCreationPermission(creatorMember.id, branchId)

  // 3. Verificar se a branch existe e pertence à mesma igreja
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    include: { Church: true },
  })

  if (!branch) {
    throw new Error('Filial não encontrada')
  }

  if (branch.churchId !== creatorMember.Branch.churchId) {
    throw new Error('Você não pode criar links de convite para filiais de outras igrejas')
  }

  // 4. Validar limite de plano (mas não bloqueia, apenas avisa)
  try {
    await checkPlanMembersLimit(createdBy)
  } catch (error: any) {
    // Se o limite foi atingido, lança erro com código específico
    // Verifica se a mensagem contém "Limite" e "plano" ou se já é PLAN_LIMIT_REACHED
    // Usa toLowerCase() para tornar a verificação case-insensitive
    const errorMessageLower = error.message?.toLowerCase() || ''
    const hasLimiteAndPlano = errorMessageLower.includes('limite') && errorMessageLower.includes('plano')
    const isPlanLimitReachedMessage = error.message === 'PLAN_LIMIT_REACHED'
    const isPlanLimitReachedCode = error.code === 'PLAN_LIMIT_REACHED'
    
    if (hasLimiteAndPlano || isPlanLimitReachedMessage || isPlanLimitReachedCode) {
      const limitError = new Error('Limite de membros do plano atingido. Não é possível criar novos links de convite.') as any
      limitError.code = 'PLAN_LIMIT_REACHED'
      throw limitError
    }
    // Re-lança outros erros
    throw error
  }

  // 5. Gerar token único
  let token = generateToken()
  let existingLink = await prisma.memberInviteLink.findUnique({ where: { token } })
  
  // Garantir que o token é único
  while (existingLink) {
    token = generateToken()
    existingLink = await prisma.memberInviteLink.findUnique({ where: { token } })
  }

  // 6. Criar o link
  const inviteLink = await prisma.memberInviteLink.create({
    data: {
      token,
      branchId,
      createdBy,
      maxUses: maxUses === null ? null : maxUses,
      expiresAt: expiresAt || null,
      isActive: true,
      currentUses: 0,
    },
    include: {
      Branch: {
        include: {
          Church: true,
        },
      },
    },
  })

  return inviteLink
}

/**
 * Busca um link de convite por token
 */
export async function getInviteLinkByToken(token: string) {
  const inviteLink = await prisma.memberInviteLink.findUnique({
    where: { token },
    include: {
      Branch: {
        include: {
          Church: true,
        },
      },
    },
  })

  return inviteLink
}

/**
 * Valida se um link de convite está válido e pode ser usado
 */
export async function validateInviteLink(token: string): Promise<{
  valid: boolean
  error?: string
  inviteLink?: any
}> {
  const inviteLink = await getInviteLinkByToken(token)

  if (!inviteLink) {
    return {
      valid: false,
      error: 'Link de convite não encontrado',
    }
  }

  if (!inviteLink.isActive) {
    return {
      valid: false,
      error: 'Este link de convite foi desativado',
    }
  }

  if (inviteLink.expiresAt && new Date() > inviteLink.expiresAt) {
    return {
      valid: false,
      error: 'Este link de convite expirou',
    }
  }

  if (inviteLink.maxUses !== null && inviteLink.currentUses >= inviteLink.maxUses) {
    return {
      valid: false,
      error: 'Este link de convite atingiu o limite de usos',
    }
  }

  // Verificar limite de membros do plano
  try {
    // Buscar qualquer usuário da igreja que tenha subscription ativa para verificar o plano
    // O plano é compartilhado por todos os membros da igreja
    const churchUser = await prisma.user.findFirst({
      where: {
        Member: {
          Branch: {
            churchId: inviteLink.Branch.churchId,
          },
        },
      },
      include: {
        Subscription: {
          where: { status: SubscriptionStatus.active },
          include: { Plan: true },
        },
      },
    })

    if (churchUser?.Subscription[0]?.Plan) {
      const plan = churchUser.Subscription[0].Plan
      if (plan.maxMembers !== null) {
        // Contar membros da igreja
        const branches = await prisma.branch.findMany({
          where: { churchId: inviteLink.Branch.churchId },
          include: { _count: { select: { Member: true } } },
        })

        const totalMembers = branches.reduce((sum, b) => sum + b._count.Member, 0)

        if (totalMembers >= plan.maxMembers) {
          // Notificar admins
          const admins = await prisma.member.findMany({
            where: {
              Branch: {
                churchId: inviteLink.Branch.churchId,
              },
              role: {
                in: ['ADMINGERAL', 'ADMINFILIAL'],
              },
            },
            include: {
              User: true,
            },
          })

          const adminEmails = admins.map((a) => a.email).filter(Boolean) as string[]

          if (adminEmails.length > 0) {
            try {
              await sendMemberLimitReachedNotification(
                adminEmails,
                inviteLink.Branch.Church.name,
                totalMembers,
                plan.maxMembers
              )
            } catch (emailError) {
              console.error('Erro ao enviar notificação de limite:', emailError)
              // Não quebra o fluxo se o email falhar
            }
          }

          return {
            valid: false,
            error: 'LIMIT_REACHED',
            inviteLink,
          }
        }
      }
    }
  } catch (error) {
    console.error('Erro ao verificar limite de plano:', error)
    // Se houver erro na verificação, não bloqueia o registro
    // Mas loga o erro para investigação
  }

  return {
    valid: true,
    inviteLink,
  }
}

/**
 * Incrementa o contador de uso de um link
 */
export async function incrementLinkUsage(token: string) {
  const inviteLink = await prisma.memberInviteLink.findUnique({
    where: { token },
  })

  if (!inviteLink) {
    throw new Error('Link de convite não encontrado')
  }

  const updatedLink = await prisma.memberInviteLink.update({
    where: { token },
    data: {
      currentUses: inviteLink.currentUses + 1,
    },
  })

  return updatedLink
}

/**
 * Desativa um link de convite manualmente
 */
export async function deactivateInviteLink(linkId: string, userId: string) {
  // 1. Buscar o link
  const inviteLink = await prisma.memberInviteLink.findUnique({
    where: { id: linkId },
    include: {
      Branch: {
        include: {
          Church: true,
        },
      },
    },
  })

  if (!inviteLink) {
    throw new Error('Link de convite não encontrado')
  }

  // 2. Validar permissões
  const creatorMember = await getMemberFromUserId(userId)
  if (!creatorMember) {
    throw new Error('Membro não encontrado')
  }

  // Buscar permissões do membro
  const memberWithPermissions = await prisma.member.findUnique({
    where: { id: creatorMember.id },
    include: { Permission: true },
  })

  if (!memberWithPermissions) {
    throw new Error('Membro não encontrado')
  }

  // Verificar se é o criador ou se tem permissão para gerenciar membros
  if (inviteLink.createdBy !== userId) {
    // Verificar se tem permissão members_manage ou é admin
    if (
      memberWithPermissions.role !== 'ADMINGERAL' &&
      memberWithPermissions.role !== 'ADMINFILIAL' &&
      !memberWithPermissions.Permission.some((p) => p.type === 'members_manage')
    ) {
      throw new Error('Você não tem permissão para desativar este link')
    }

    // Verificar se pertence à mesma igreja
    if (creatorMember.Branch.churchId !== inviteLink.Branch.churchId) {
      throw new Error('Você não pode desativar links de outras igrejas')
    }
  }

  // 3. Desativar o link
  const updatedLink = await prisma.memberInviteLink.update({
    where: { id: linkId },
    data: {
      isActive: false,
    },
    include: {
      Branch: {
        include: {
          Church: true,
        },
      },
    },
  })

  return updatedLink
}

/**
 * Lista links ativos de uma filial
 */
export async function getActiveLinksByBranch(branchId: string, userId: string) {
  // Validar permissões
  const creatorMember = await getMemberFromUserId(userId)
  if (!creatorMember) {
    throw new Error('Membro não encontrado')
  }

  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
  })

  if (!branch) {
    throw new Error('Filial não encontrada')
  }

  // Verificar se pertence à mesma igreja
  if (branch.churchId !== creatorMember.Branch.churchId) {
    throw new Error('Você não pode visualizar links de outras igrejas')
  }

  const links = await prisma.memberInviteLink.findMany({
    where: {
      branchId,
      isActive: true,
    },
    include: {
      Branch: {
        include: {
          Church: true,
        },
      },
      _count: {
        select: {
          Member: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Adicionar informações do criador
  const linksWithCreator = await Promise.all(
    links.map(async (link) => {
      const creator = await prisma.user.findUnique({
        where: { id: link.createdBy },
        select: { name: true, email: true },
      })
      return {
        ...link,
        creatorName: creator?.name || 'Usuário desconhecido',
        creatorEmail: creator?.email || null,
      }
    })
  )

  return linksWithCreator
}

/**
 * Lista todos os links (ativos e inativos) de uma filial
 */
export async function getAllLinksByBranch(branchId: string, userId: string) {
  // Validar permissões
  const creatorMember = await getMemberFromUserId(userId)
  if (!creatorMember) {
    throw new Error('Membro não encontrado')
  }

  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
  })

  if (!branch) {
    throw new Error('Filial não encontrada')
  }

  // Verificar se pertence à mesma igreja
  if (branch.churchId !== creatorMember.Branch.churchId) {
    throw new Error('Você não pode visualizar links de outras igrejas')
  }

  const links = await prisma.memberInviteLink.findMany({
    where: {
      branchId,
    },
    include: {
      Branch: {
        include: {
          Church: true,
        },
      },
      _count: {
        select: {
          Member: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Adicionar informações do criador
  const linksWithCreator = await Promise.all(
    links.map(async (link) => {
      const creator = await prisma.user.findUnique({
        where: { id: link.createdBy },
        select: { name: true, email: true },
      })
      return {
        ...link,
        creatorName: creator?.name || 'Usuário desconhecido',
        creatorEmail: creator?.email || null,
      }
    })
  )

  return linksWithCreator
}

