import { prisma } from '../../lib/prisma'
import bcrypt from 'bcryptjs'
import { Role } from '@prisma/client'
import { ALL_PERMISSION_TYPES } from '../../constants/permissions'
import { checkPlanMembersLimit } from '../../utils/planLimits'
import {
  validateMemberCreationPermission,
  getMemberFromUserId,
} from '../../utils/authorization'
import { AuditLogger } from '../../utils/auditHelper'

interface RegisterUserInput {
  name: string
  email: string
  password: string
  branchId?: string
  role?: Role
  permissions?: string[]
  birthDate?: string
  phone?: string
  address?: string
  avatarUrl?: string
  fromLandingPage?: boolean // ← usado para distinguir cadastro externo
  creatorUserId?: string // ID do usuário que está criando (para validações)
}

export async function registerUserService(data: RegisterUserInput) {
  const {
    name,
    email,
    password,
    branchId,
    role,
    permissions,
    birthDate,
    phone,
    address,
    avatarUrl,
    fromLandingPage,
    creatorUserId,
  } = data

  const hashedPassword = await bcrypt.hash(password, 10)

  // ⚙️ Se for landing page → cria User e assina plano Free
  if (fromLandingPage) {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) throw new Error('Email já cadastrado como usuário.')

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })

    // Busca o plano gratuito (tenta diferentes variações do nome)
    let freePlan = await prisma.plan.findFirst({ where: { name: 'free' } })
    if (!freePlan) {
      freePlan = await prisma.plan.findFirst({ where: { name: 'Free' } })
    }
    if (!freePlan) {
      freePlan = await prisma.plan.findFirst({ where: { name: 'Free Plan' } })
    }
    if (!freePlan) {
      throw new Error('Plano Free não encontrado. Execute o seed do banco de dados.')
    }

    await prisma.subscription.create({
      data: {
        userId: user.id,
        planId: freePlan.id,
        status: 'active',
      },
    })

    return { success: true, message: 'Usuário criado com plano Free', user }
  }

  // 🧱 Caso seja criação de membro interno
  // Validações de segurança
  if (!branchId) {
    throw new Error('branchId é obrigatório para criação de membros internos')
  }

  if (!creatorUserId) {
    throw new Error('Usuário criador não identificado')
  }

  // 1. Buscar dados do criador
  const creatorMember = await getMemberFromUserId(creatorUserId)
  if (!creatorMember) {
    throw new Error('Membro criador não encontrado. Você precisa estar logado como membro para criar outros membros.')
  }

  // 2. Validar permissões de criação
  await validateMemberCreationPermission(
    creatorMember.id,
    branchId,
    role
  )

  // 3. Validar limite de plano
  await checkPlanMembersLimit(creatorUserId)

  // 4. Determinar role final (padrão: MEMBER)
  const finalRole = role || Role.MEMBER

  // 5. Verificar se email já existe
  const existingMember = await prisma.member.findUnique({ where: { email } })
  if (existingMember) {
    throw new Error('Email já cadastrado como membro.')
  }

  // 6. Criar membro
  const member = await prisma.member.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: finalRole,
      branchId,
      birthDate: birthDate ? new Date(birthDate) : undefined,
      phone,
      address,
      avatarUrl,
    },
  })

  // 7. Adiciona permissões
  const typesToAssign =
    finalRole === Role.ADMINGERAL || finalRole === Role.ADMINFILIAL
      ? ALL_PERMISSION_TYPES
      : permissions ?? []

  if (typesToAssign.length > 0) {
    const perms = await prisma.permission.findMany({
      where: { type: { in: typesToAssign } },
    })

    await prisma.member.update({
      where: { id: member.id },
      data: {
        Permission: {
          connect: perms.map((p) => ({ id: p.id })),
        },
      },
    })
  }

  const memberWithPerms = await prisma.member.findUnique({
    where: { id: member.id },
    include: { Permission: true },
  })

  // Log de auditoria (assíncrono, não bloqueia a resposta)
  // Nota: request precisa ser passado como parâmetro para obter contexto
  // Por enquanto, criamos o log sem o request (será adicionado no controller)

  return memberWithPerms
}
