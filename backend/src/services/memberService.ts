import { prisma } from '../lib/prisma'
import { parse } from 'date-fns'
import { Role } from '@prisma/client'
import { ALL_PERMISSION_TYPES } from '../constants/permissions'

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
          select: { id: true, type: true },
        },
        Branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    const mappedMembers = members.map(member => {
      const { Permission, Branch, email, phone, address, ...rest } = member
      const result: any = {
        ...rest,
        permissions: Permission.map(p => ({ id: p.id, type: p.type })),
        branch: Branch,
      }
      
      console.log(`[PERMISSIONS DEBUG] findAllMembers (ADMINGERAL) - Membro ${member.id} (${member.name}):`, {
        permissionsCount: Permission.length,
        permissions: Permission.map(p => p.type)
      })
      
      // Inclui dados sensíveis apenas se tiver permissão members_manage
      if (hasManagePermission || userRole === 'ADMINGERAL' || userRole === 'ADMINFILIAL') {
        result.email = email
        result.phone = phone
        result.address = address
      }
      
      return result
    })
    
    console.log(`[PERMISSIONS DEBUG] findAllMembers (ADMINGERAL) retornando ${mappedMembers.length} membros`)
    
    return mappedMembers
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
        select: { id: true, type: true },
      },
    },
  })

  const mappedMembers = members.map(member => {
    const { Permission, email, phone, address, ...rest } = member
    const result: any = {
      ...rest,
      permissions: Permission.map(p => ({ id: p.id, type: p.type })),
    }
    
    console.log(`[PERMISSIONS DEBUG] findAllMembers - Membro ${member.id} (${member.name}):`, {
      permissionsCount: Permission.length,
      permissions: Permission.map(p => p.type)
    })
    
    // Inclui dados sensíveis apenas se tiver permissão members_manage
    if (hasManagePermission || userRole === 'ADMINGERAL' || userRole === 'ADMINFILIAL') {
      result.email = email
      result.phone = phone
      result.address = address
    }
    
    return result
  })
  
  console.log(`[PERMISSIONS DEBUG] findAllMembers retornando ${mappedMembers.length} membros`)
  
  return mappedMembers
}

export async function findMemberById(id: string, hasManagePermission: boolean = false) {
  console.log(`[PERMISSIONS DEBUG] findMemberById chamado para membro ${id}, hasManagePermission: ${hasManagePermission}`)
  
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
        select: { id: true, type: true },
      },
      Branch: {
        include: { Church: true },
      },
    },
  })

  if (!member) {
    console.log(`[PERMISSIONS DEBUG] Membro ${id} não encontrado`)
    return null
  }

  console.log(`[PERMISSIONS DEBUG] Permissões encontradas no banco para ${id}:`, member.Permission)
  console.log(`[PERMISSIONS DEBUG] Quantidade de permissões:`, member.Permission.length)

  const { Permission, Branch, email, phone, address, ...rest } = member
  const result: any = {
    ...rest,
    permissions: Permission.map(p => ({ id: p.id, type: p.type })),
    branch: Branch,
  }
  
  console.log(`[PERMISSIONS DEBUG] Resultado final do findMemberById para ${id}:`, {
    permissionsCount: result.permissions.length,
    permissions: result.permissions
  })
  
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

/**
 * Atualiza a role de um membro e atribui permissões padrão
 * @param memberId ID do membro
 * @param newRole Nova role a ser atribuída
 * @returns Membro atualizado com permissões
 */
export async function updateMemberRole(memberId: string, newRole: Role) {
  // Buscar membro atual com permissões
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: {
      Permission: true,
    },
  })

  if (!member) {
    throw new Error('Membro não encontrado')
  }

  // Atualizar role
  await prisma.member.update({
    where: { id: memberId },
    data: { role: newRole },
  })

  // Determinar permissões padrão baseadas na nova role
  let permissionsToAssign: string[] = []

  if (newRole === Role.ADMINGERAL || newRole === Role.ADMINFILIAL) {
    // ADMINGERAL e ADMINFILIAL recebem todas as permissões
    permissionsToAssign = [...ALL_PERMISSION_TYPES]
  } else {
    // COORDINATOR e MEMBER mantêm apenas members_view
    // Se já tiver permissões, mantém apenas members_view
    permissionsToAssign = ['members_view']
  }

  // Remover todas as permissões antigas
  await prisma.permission.deleteMany({
    where: { memberId },
  })

  // Criar novas permissões
  if (permissionsToAssign.length > 0) {
    await prisma.permission.createMany({
      data: permissionsToAssign.map((type) => ({
        memberId,
        type,
      })),
      skipDuplicates: true,
    })
  }

  // Retornar membro atualizado com permissões
  const updatedMember = await prisma.member.findUnique({
    where: { id: memberId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      branchId: true,
      Permission: {
        select: { id: true, type: true },
      },
    },
  })

  if (!updatedMember) {
    throw new Error('Erro ao buscar membro atualizado')
  }

  return {
    ...updatedMember,
    permissions: updatedMember.Permission.map(p => ({ id: p.id, type: p.type })),
  }
}
