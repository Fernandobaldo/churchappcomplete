import { prisma } from '../lib/prisma'
import { SubscriptionStatus } from '@prisma/client'

/**
 * Verifica se o plano permite criar mais membros
 * @param userId ID do usuário (User)
 * @returns true se pode criar, false caso contrário
 * @throws Error se o plano não permite criar mais membros
 */
export async function checkPlanMembersLimit(userId: string): Promise<void> {
  // 1. Buscar User e Subscription ativa
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      Subscription: {
        where: { status: SubscriptionStatus.active },
        include: { Plan: true },
      },
      Member: {
        include: {
          Branch: true,
        },
      },
    },
  })

  if (!user?.Member?.Branch?.churchId) {
    throw new Error('Igreja não encontrada para o usuário')
  }

  const churchId = user.Member.Branch.churchId
  let plan = user?.Subscription[0]?.Plan

  // Debug: Se não encontrou plano ativo, verificar todas as subscriptions do usuário
  if (!plan) {
    const allUserSubscriptions = await prisma.subscription.findMany({
      where: { userId },
      include: { Plan: true },
      orderBy: { startedAt: 'desc' },
    })
    
    console.log(`🔍 [PLAN LIMITS] Usuário ${userId} não tem subscription ativa. Subscriptions encontradas:`, {
      count: allUserSubscriptions.length,
      subscriptions: allUserSubscriptions.map(s => ({
        id: s.id,
        status: s.status,
        planName: s.Plan.name,
        planId: s.planId,
        startedAt: s.startedAt,
      })),
    })

    // Tentar usar a subscription mais recente do plano Free se existir
    // Buscar por code primeiro, depois fallback para name (backward compatibility)
    const freeSubscription = allUserSubscriptions.find(s => 
      (s.Plan.code === 'FREE' || s.Plan.name.toLowerCase() === 'free') && 
      (s.status === SubscriptionStatus.active || s.status === SubscriptionStatus.pending)
    )
    
    if (freeSubscription) {
      console.log(`✅ [PLAN LIMITS] Usando subscription Free encontrada (status: ${freeSubscription.status})`)
      plan = freeSubscription.Plan
    }
  }

  // 2. Se o usuário não tiver plano, buscar o plano do ADMINGERAL da igreja
  if (!plan) {
    const adminMember = await prisma.member.findFirst({
      where: {
        Branch: {
          churchId,
        },
        role: 'ADMINGERAL',
      },
      include: {
        User: {
          include: {
            Subscription: {
              where: { status: SubscriptionStatus.active },
              include: { Plan: true },
            },
          },
        },
      },
    })

    // Debug: Se não encontrou admin com plano ativo, verificar todas as subscriptions do admin
    if (!adminMember?.User?.Subscription[0]?.Plan) {
      if (adminMember?.User) {
        const allAdminSubscriptions = await prisma.subscription.findMany({
          where: { userId: adminMember.User.id },
          include: { Plan: true },
          orderBy: { startedAt: 'desc' },
        })
        
        console.log(`🔍 [PLAN LIMITS] ADMINGERAL ${adminMember.User.id} não tem subscription ativa. Subscriptions encontradas:`, {
          count: allAdminSubscriptions.length,
          subscriptions: allAdminSubscriptions.map(s => ({
            id: s.id,
            status: s.status,
            planName: s.Plan.name,
            planId: s.planId,
            startedAt: s.startedAt,
          })),
        })

        // Tentar usar a subscription mais recente do plano Free se existir
        // Buscar por code primeiro, depois fallback para name (backward compatibility)
        const freeSubscription = allAdminSubscriptions.find(s => 
          (s.Plan.code === 'FREE' || s.Plan.name.toLowerCase() === 'free') && 
          (s.status === SubscriptionStatus.active || s.status === SubscriptionStatus.pending)
        )
        
        if (freeSubscription) {
          console.log(`✅ [PLAN LIMITS] Usando subscription Free do ADMINGERAL (status: ${freeSubscription.status})`)
          plan = freeSubscription.Plan
        }
      } else {
        console.log(`🔍 [PLAN LIMITS] Nenhum ADMINGERAL encontrado para a igreja ${churchId}`)
      }
      
      if (!plan) {
        throw new Error(`Plano não encontrado para o usuário ou para a igreja (churchId: ${churchId}). Verifique se há uma assinatura ativa para o usuário ou para o administrador geral da igreja.`)
      }
    } else {
      plan = adminMember.User.Subscription[0].Plan
    }
  }

  // 2. Se maxMembers for null, significa ilimitado
  if (plan.maxMembers === null) {
    return
  }

  // 3. Contar membros existentes em todas as branches da igreja
  const branches = await prisma.branch.findMany({
    where: { churchId },
    include: { _count: { select: { Member: true } } },
  })

  const totalMembers = branches.reduce((sum, b) => sum + b._count.Member, 0)

  // 4. Verificar limite
  if (totalMembers >= plan.maxMembers) {
    const errorMsg = `Limite do plano atingido: máximo de ${plan.maxMembers} membros excedido. Você tem ${totalMembers} membros.`
    throw new Error(errorMsg)
  }
}

/**
 * Verifica se o plano permite criar mais branches
 * @param userId ID do usuário (User)
 * @returns true se pode criar, false caso contrário
 * @throws Error se o plano não permite criar mais branches
 */
export async function checkPlanBranchesLimit(userId: string): Promise<void> {
  // 1. Buscar User e Subscription ativa
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      Subscription: {
        where: { status: SubscriptionStatus.active },
        include: { Plan: true },
      },
      Member: {
        include: {
          Branch: true,
        },
      },
    },
  })

  if (!user?.Member?.Branch?.churchId) {
    throw new Error('Igreja não encontrada para o usuário')
  }

  const churchId = user.Member.Branch.churchId
  let plan = user?.Subscription[0]?.Plan

  // Debug: Se não encontrou plano ativo, verificar todas as subscriptions do usuário
  if (!plan) {
    const allUserSubscriptions = await prisma.subscription.findMany({
      where: { userId },
      include: { Plan: true },
      orderBy: { startedAt: 'desc' },
    })
    
    console.log(`🔍 [PLAN LIMITS - BRANCHES] Usuário ${userId} não tem subscription ativa. Subscriptions encontradas:`, {
      count: allUserSubscriptions.length,
      subscriptions: allUserSubscriptions.map(s => ({
        id: s.id,
        status: s.status,
        planName: s.Plan.name,
        planId: s.planId,
        startedAt: s.startedAt,
      })),
    })

    // Tentar usar a subscription mais recente do plano Free se existir
    // Buscar por code primeiro, depois fallback para name (backward compatibility)
    const freeSubscription = allUserSubscriptions.find(s => 
      (s.Plan.code === 'FREE' || s.Plan.name.toLowerCase() === 'free') && 
      (s.status === SubscriptionStatus.active || s.status === SubscriptionStatus.pending)
    )
    
    if (freeSubscription) {
      console.log(`✅ [PLAN LIMITS - BRANCHES] Usando subscription Free encontrada (status: ${freeSubscription.status})`)
      plan = freeSubscription.Plan
    }
  }

  // 2. Se o usuário não tiver plano, buscar o plano do ADMINGERAL da igreja
  if (!plan) {
    const adminMember = await prisma.member.findFirst({
      where: {
        Branch: {
          churchId,
        },
        role: 'ADMINGERAL',
      },
      include: {
        User: {
          include: {
            Subscription: {
              where: { status: SubscriptionStatus.active },
              include: { Plan: true },
            },
          },
        },
      },
    })

    // Debug: Se não encontrou admin com plano ativo, verificar todas as subscriptions do admin
    if (!adminMember?.User?.Subscription[0]?.Plan) {
      if (adminMember?.User) {
        const allAdminSubscriptions = await prisma.subscription.findMany({
          where: { userId: adminMember.User.id },
          include: { Plan: true },
          orderBy: { startedAt: 'desc' },
        })
        
        console.log(`🔍 [PLAN LIMITS - BRANCHES] ADMINGERAL ${adminMember.User.id} não tem subscription ativa. Subscriptions encontradas:`, {
          count: allAdminSubscriptions.length,
          subscriptions: allAdminSubscriptions.map(s => ({
            id: s.id,
            status: s.status,
            planName: s.Plan.name,
            planId: s.planId,
            startedAt: s.startedAt,
          })),
        })

        // Tentar usar a subscription mais recente do plano Free se existir
        const freeSubscription = allAdminSubscriptions.find(s => 
          s.Plan.name.toLowerCase() === 'free' && 
          (s.status === SubscriptionStatus.active || s.status === SubscriptionStatus.pending)
        )
        
        if (freeSubscription) {
          console.log(`✅ [PLAN LIMITS - BRANCHES] Usando subscription Free do ADMINGERAL (status: ${freeSubscription.status})`)
          plan = freeSubscription.Plan
        }
      } else {
        console.log(`🔍 [PLAN LIMITS - BRANCHES] Nenhum ADMINGERAL encontrado para a igreja ${churchId}`)
      }
      
      if (!plan) {
        throw new Error(`Plano não encontrado para o usuário ou para a igreja (churchId: ${churchId}). Verifique se há uma assinatura ativa para o usuário ou para o administrador geral da igreja.`)
      }
    } else {
      plan = adminMember.User.Subscription[0].Plan
    }
  }

  // 2. Se maxBranches for null, significa ilimitado
  if (plan.maxBranches === null) {
    return
  }

  // 3. Contar branches existentes da igreja
  const branchesCount = await prisma.branch.count({
    where: { churchId },
  })

  // 4. Verificar limite
  if (branchesCount >= plan.maxBranches) {
    throw new Error(
      `Limite do plano atingido: máximo de ${plan.maxBranches} filiais excedido. Você tem ${branchesCount} filiais.`
    )
  }
}

