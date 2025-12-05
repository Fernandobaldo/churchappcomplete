import { prisma } from '../lib/prisma'
import { parse } from 'date-fns'
import { Role } from '@prisma/client'
import { ALL_PERMISSION_TYPES, RESTRICTED_PERMISSIONS } from '../constants/permissions'

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
    // Buscar o avatar da igreja para usar como fallback
    const church = await prisma.church.findUnique({
      where: { id: churchId },
      select: {
        avatarUrl: true,
      },
    })
    
    const churchAvatarUrl = church?.avatarUrl || null

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
        positionId: true,
        Permission: {
          select: { id: true, type: true },
        },
        Branch: {
          select: {
            id: true,
            name: true,
          },
        },
        Position: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    const mappedMembers = members.map(member => {
      const { Permission, Branch, Position, email, phone, address, avatarUrl, ...rest } = member
      // Usa o avatar do membro se existir, senão usa o avatar da igreja
      const finalAvatarUrl = avatarUrl || churchAvatarUrl
      const result: any = {
        ...rest,
        avatarUrl: finalAvatarUrl, // Usa avatar do membro ou da igreja como fallback
        permissions: Permission.map(p => ({ id: p.id, type: p.type })),
        branch: Branch,
        position: Position ? { id: Position.id, name: Position.name } : null,
      }
      
      // Inclui dados sensíveis apenas se tiver permissão members_manage
      if (hasManagePermission || userRole === 'ADMINGERAL' || userRole === 'ADMINFILIAL') {
        result.email = email
        result.phone = phone
        result.address = address
      }
      
      return result
    })
    
    return mappedMembers
  }

  // Para outros roles (incluindo MEMBER), busca membros da branch especificada
  // MEMBER pode ver todos os membros da sua filial, mas sem dados sensíveis
  if (!branchId) {
    throw new Error('branchId é obrigatório para buscar membros')
  }

  // Buscar o avatar da igreja para usar como fallback
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: {
      Church: {
        select: {
          avatarUrl: true,
        },
      },
    },
  })
  
  const churchAvatarUrl = branch?.Church?.avatarUrl || null

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
      positionId: true,
      Permission: {
        select: { id: true, type: true },
      },
      Position: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

    const mappedMembers = members.map(member => {
      const { Permission, Position, email, phone, address, avatarUrl, ...rest } = member
      // Usa o avatar do membro se existir, senão usa o avatar da igreja
      const finalAvatarUrl = avatarUrl || churchAvatarUrl
      const result: any = {
        ...rest,
        avatarUrl: finalAvatarUrl, // Usa avatar do membro ou da igreja como fallback
        permissions: Permission.map(p => ({ id: p.id, type: p.type })),
        position: Position ? { id: Position.id, name: Position.name } : null,
      }
      
    // Inclui dados sensíveis apenas se tiver permissão members_manage
    if (hasManagePermission || userRole === 'ADMINGERAL' || userRole === 'ADMINFILIAL') {
      result.email = email
      result.phone = phone
      result.address = address
    }
    
    return result
  })
  
  return mappedMembers
}

export async function findMemberById(
  id: string, 
  hasManagePermission: boolean = false,
  canViewPermissions: boolean = false
) {
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
      positionId: true,
      Permission: {
        select: { id: true, type: true },
      },
      Branch: {
        include: { Church: true },
      },
      Position: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  if (!member) {
    return null
  }
  
  // Buscar o avatar da igreja para usar como fallback
  const churchAvatarUrl = member.Branch?.Church?.avatarUrl || null

  // Desestruturação explícita para garantir que positionId não seja perdido
  const { Permission, Branch, Position, email, phone, address, positionId, ...rest } = member
  
  // Construir resultado explicitamente para garantir que todos os campos estejam presentes
  // IMPORTANTE: Usar null em vez de undefined para garantir que campos sejam serializados no JSON
  // Usa o avatar do membro se existir, senão usa o avatar da igreja
  const finalAvatarUrl = member.avatarUrl || churchAvatarUrl
  const result: any = {
    id: member.id,
    name: member.name,
    branchId: member.branchId,
    birthDate: member.birthDate,
    avatarUrl: finalAvatarUrl, // Usa avatar do membro ou da igreja como fallback
    role: member.role,
    positionId: positionId !== undefined && positionId !== null ? String(positionId) : null, // Garante que positionId sempre esteja presente como string ou null
    permissions: canViewPermissions ? Permission.map(p => ({ id: p.id, type: p.type })) : [],
    branch: Branch,
    position: Position ? { id: String(Position.id), name: Position.name } : null,
  }
  
  // Garantir que positionId não seja undefined (JSON remove campos undefined)
  if (result.positionId === undefined) {
    result.positionId = null
  }
  
  // Garantir que position não seja undefined
  if (result.position === undefined) {
    result.position = null
  }
  
  // Inclui dados sensíveis apenas se tiver permissão members_manage
  // Para o próprio perfil (getMyProfile), sempre inclui email, phone e address
  // Sempre inclui os campos, mesmo que sejam null, para garantir que o frontend receba todos os campos
  if (hasManagePermission) {
    result.email = email ?? null
    result.phone = phone ?? null
    result.address = address ?? null
  } else {
    // Mesmo sem permissão, inclui como null para manter a estrutura consistente
    result.email = null
    result.phone = null
    result.address = null
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
      positionId: true,
      Position: {
        select: {
          id: true,
          name: true,
        },
      },
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
  // Usar transação para garantir atomicidade
  try {
    return await prisma.$transaction(async (tx) => {
      // Buscar membro atual com permissões
      const member = await tx.member.findUnique({
        where: { id: memberId },
        include: {
          Permission: true,
        },
      })

      if (!member) {
        throw new Error('Membro não encontrado')
      }

      const oldRole = member.role
      const currentPermissions = member.Permission.map(p => p.type)

      // Determinar permissões a manter/atribuir baseadas na nova role
      let permissionsToAssign: string[] = []

      if (newRole === Role.ADMINGERAL || newRole === Role.ADMINFILIAL) {
        // ADMINGERAL e ADMINFILIAL recebem todas as permissões
        permissionsToAssign = [...ALL_PERMISSION_TYPES]
      } else if (newRole === Role.COORDINATOR) {
        // COORDINATOR: mantém todas as permissões ativas (pode ter todas, incluindo restritas)
        // Upgrade: mantém todas as permissões que já estavam ativas
        permissionsToAssign = [...currentPermissions]
        // Garante que members_view sempre está presente
        if (!permissionsToAssign.includes('members_view')) {
          permissionsToAssign.push('members_view')
        }
      } else {
        // MEMBER: mantém apenas permissões não restritas
        // Downgrade: remove permissões que requerem COORDINATOR ou superior
        permissionsToAssign = currentPermissions.filter(perm => 
          !RESTRICTED_PERMISSIONS.includes(perm)
        )
        // Garante que members_view sempre está presente
        if (!permissionsToAssign.includes('members_view')) {
          permissionsToAssign.push('members_view')
        }
      }

      // Atualizar role e remover todas as permissões antigas em paralelo
      await Promise.all([
        tx.member.update({
          where: { id: memberId },
          data: { role: newRole },
        }),
        tx.permission.deleteMany({
          where: { memberId },
        }),
      ])

      // Criar novas permissões uma por uma para melhor tratamento de erros
      if (permissionsToAssign.length > 0) {
        // Criar permissões uma por uma para capturar erros específicos
        for (const permissionType of permissionsToAssign) {
          try {
            await tx.permission.create({
              data: {
                memberId,
                type: permissionType,
              },
            })
          } catch (error: any) {
            // Se for erro de duplicata, ignora (não deveria acontecer já que deletamos todas antes)
            if (error.code !== 'P2002') {
              console.error(`[updateMemberRole] Erro ao criar permissão ${permissionType}:`, error)
              throw new Error(`Erro ao criar permissão ${permissionType}: ${error.message}`)
            }
          }
        }
      }

      // Retornar membro atualizado com permissões
      const updatedMember = await tx.member.findUnique({
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

      const result = {
        ...updatedMember,
        permissions: updatedMember.Permission.map(p => ({ id: p.id, type: p.type })),
      }

      return result
    })
  } catch (error: any) {
    console.error(`[updateMemberRole] Erro na transação:`, error)
    throw error
  }
}
