import { prisma } from '../../lib/prisma'
import bcrypt from 'bcryptjs'
import { Role } from '@prisma/client'
import { ALL_PERMISSION_TYPES } from '../../constants/permissions'

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

    const freePlan = await prisma.plan.findUnique({ where: { name: 'Free' } })
    if (!freePlan) throw new Error('Plano Free não encontrado.')

    await prisma.subscription.create({
      data: {
        userId: user.id,
        planId: freePlan.id,
      },
    })

    return { success: true, message: 'Usuário criado com plano Free', user }
  }

  // 🧱 Caso seja criação de membro interno
  let finalRole = role
  if (!finalRole) {
    const churchesCount = await prisma.church.count()
    finalRole = churchesCount === 0 ? Role.ADMINGERAL : Role.ADMINFILIAL
  }

  const member = await prisma.member.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: finalRole,
      branchId: branchId!,
      birthDate: birthDate ? new Date(birthDate) : undefined,
      phone,
      address,
      avatarUrl,
    },
  })

  // 🔐 Adiciona permissões
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
        permissions: {
          connect: perms.map((p) => ({ id: p.id })),
        },
      },
    })
  }

  const memberWithPerms = await prisma.member.findUnique({
    where: { id: member.id },
    include: { permissions: true },
  })

  return memberWithPerms
}
