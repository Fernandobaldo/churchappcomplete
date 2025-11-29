import { prisma } from '../lib/prisma'
import { parse } from 'date-fns'

export function formatDate(date?: Date | null): string | null {
  if (!date) return null
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

/**
 * Busca todos os membros
 * @param branchId ID da branch (obrigatório para ADMINFILIAL e COORDINATOR)
 * @param churchId ID da igreja (obrigatório para ADMINGERAL, opcional para outros)
 * @param userRole Role do usuário que está buscando
 * @param memberId ID do membro (obrigatório para MEMBER, para retornar apenas si mesmo)
 * @param hasManagePermission Se o usuário tem permissão members_manage (para ver dados sensíveis)
 */
export async function findAllMembers(
  branchId: string | null,
  churchId: string | null = null,
  userRole: string | null = null,
  memberId: string | null = null,
  hasManagePermission: boolean = false
) {
  // Se for ADMINGERAL e tiver churchId, busca todos os membros da igreja
  if (userRole === 'ADMINGERAL' && churchId) {
    const members = await prisma.member.findMany({
      where: {
        Branch: {
          churchId,
        },
      },
      select: {
        id: true,
        name: true,
        branchId: true,
        birthDate: true,
        phone: true,
        address: true,
        avatarUrl: true,
        email: true,
        role: true,
        Permission: {
          select: { type: true },
        },
        Branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return members.map(member => {
      const { Permission, Branch, email, phone, address, ...rest } = member
      const result: any = {
        ...rest,
        permissions: Permission.map(p => ({ type: p.type })),
        branch: Branch,
      }
      
      // Inclui dados sensíveis apenas se tiver permissão members_manage
      if (hasManagePermission || userRole === 'ADMINGERAL' || userRole === 'ADMINFILIAL') {
        result.email = email
        result.phone = phone
        result.address = address
      }
      
      return result
    })
  }

  // Para outros roles (incluindo MEMBER), busca membros da branch especificada
  // MEMBER pode ver todos os membros da sua filial, mas sem dados sensíveis
  if (!branchId) {
    throw new Error('branchId é obrigatório para buscar membros')
  }

  const members = await prisma.member.findMany({
    where: { branchId },
    select: {
      id: true,
      name: true,
      branchId: true,
      birthDate: true,
      phone: true,
      address: true,
      avatarUrl: true,
      email: true,
      role: true,
      Permission: {
        select: { type: true },
      },
    },
  })

  return members.map(member => {
    const { Permission, email, phone, address, ...rest } = member
    const result: any = {
      ...rest,
      permissions: Permission.map(p => ({ type: p.type })),
    }
    
    // Inclui dados sensíveis apenas se tiver permissão members_manage
    if (hasManagePermission || userRole === 'ADMINGERAL' || userRole === 'ADMINFILIAL') {
      result.email = email
      result.phone = phone
      result.address = address
    }
    
    return result
  })
}

export async function findMemberById(id: string, hasManagePermission: boolean = false) {
  const member = await prisma.member.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      branchId: true,
      birthDate: true,
      phone: true,
      address: true,
      avatarUrl: true,
      email: true,
      role: true,
      Permission: {
        select: { type: true },
      },
      Branch: {
        include: { Church: true },
      },
    },
  })

  if (!member) return null

  const { Permission, Branch, email, phone, address, ...rest } = member
  const result: any = {
    ...rest,
    permissions: Permission.map(p => ({ type: p.type })),
    branch: Branch,
  }
  
  // Inclui dados sensíveis apenas se tiver permissão members_manage
  if (hasManagePermission) {
    result.email = email
    result.phone = phone
    result.address = address
  }
  
  return result
}

export async function updateMember(id: string, data: any) {
  return prisma.member.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      birthDate: true,
      phone: true,
      address: true,
      avatarUrl: true,
    },
  })
}
