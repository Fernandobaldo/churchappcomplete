import { prisma } from '../lib/prisma'

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
        where: { status: 'active' },
        include: { Plan: true },
      },
      Member: {
        include: {
          Branch: true,
        },
      },
    },
  })

  if (!user?.Subscription[0]?.Plan) {
    throw new Error('Plano não encontrado para o usuário')
  }

  const plan = user.Subscription[0].Plan
  const churchId = user.Member?.Branch.churchId

  if (!churchId) {
    throw new Error('Igreja não encontrada para o usuário')
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
  
  console.log('🔍 [PLAN LIMITS] Verificando limite:', {
    churchId,
    planMaxMembers: plan.maxMembers,
    totalMembers,
    branchesCount: branches.length,
    branches: branches.map(b => ({ id: b.id, name: b.name, members: b._count.Member }))
  })

  // 4. Verificar limite
  if (totalMembers >= plan.maxMembers) {
    const errorMsg = `Limite do plano atingido: máximo de ${plan.maxMembers} membros excedido. Você tem ${totalMembers} membros.`
    console.error('❌ [PLAN LIMITS]', errorMsg)
    throw new Error(errorMsg)
  }
  
  console.log('✅ [PLAN LIMITS] Limite OK:', totalMembers, '<', plan.maxMembers)
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
        where: { status: 'active' },
        include: { Plan: true },
      },
      Member: {
        include: {
          Branch: true,
        },
      },
    },
  })

  if (!user?.Subscription[0]?.Plan) {
    throw new Error('Plano não encontrado para o usuário')
  }

  const plan = user.Subscription[0].Plan
  const churchId = user.Member?.Branch.churchId

  if (!churchId) {
    throw new Error('Igreja não encontrada para o usuário')
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

