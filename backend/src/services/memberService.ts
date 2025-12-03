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
      
      console.log(`[PERMISSIONS DEBUG] findAllMembers (ADMINGERAL) - Membro ${member.id} (${member.name}):`, {
        permissionsCount: Permission.length,
        permissions: Permission.map(p => p.type),
        avatarUrlFromDB: avatarUrl,
        avatarUrlType: typeof avatarUrl,
        avatarUrlInResult: result.avatarUrl,
        resultKeys: Object.keys(result),
        fullResult: JSON.stringify(result, null, 2)
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
      
      console.log(`[PERMISSIONS DEBUG] findAllMembers - Membro ${member.id} (${member.name}):`, {
        permissionsCount: Permission.length,
        permissions: Permission.map(p => p.type),
        avatarUrlFromDB: avatarUrl,
        avatarUrlType: typeof avatarUrl,
        avatarUrlInResult: result.avatarUrl,
        resultKeys: Object.keys(result),
        fullResult: JSON.stringify(result, null, 2)
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

export async function findMemberById(
  id: string, 
  hasManagePermission: boolean = false,
  canViewPermissions: boolean = false
) {
  console.log(`[PERMISSIONS DEBUG] findMemberById chamado para membro ${id}, hasManagePermission: ${hasManagePermission}, canViewPermissions: ${canViewPermissions}`)
  
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
    console.log(`[PERMISSIONS DEBUG] Membro ${id} não encontrado`)
    return null
  }
  
  // Buscar o avatar da igreja para usar como fallback
  const churchAvatarUrl = member.Branch?.Church?.avatarUrl || null

  console.log(`[DB DEBUG] ========== DADOS DO BANCO DE DADOS ==========`)
  console.log(`[DB DEBUG] Membro ID: ${member.id}`)
  console.log(`[DB DEBUG] positionId (raw):`, member.positionId)
  console.log(`[DB DEBUG] positionId (type):`, typeof member.positionId)
  console.log(`[DB DEBUG] Position (raw):`, JSON.stringify(member.Position, null, 2))
  console.log(`[DB DEBUG] Position (type):`, typeof member.Position)
  console.log(`[DB DEBUG] Todos os campos do member:`, Object.keys(member))
  console.log(`[DB DEBUG] ============================================`)
  console.log(`[PERMISSIONS DEBUG] Permissões encontradas no banco para ${id}:`, member.Permission)
  console.log(`[PERMISSIONS DEBUG] Quantidade de permissões:`, member.Permission.length)
  console.log(`[AVATAR DEBUG] Avatar encontrado no banco para ${id}:`, {
    avatarUrl: member.avatarUrl,
    avatarUrlType: typeof member.avatarUrl,
    hasAvatar: !!member.avatarUrl
  })

  // Desestruturação explícita para garantir que positionId não seja perdido
  const { Permission, Branch, Position, email, phone, address, positionId, ...rest } = member
  
  console.log(`[TRANSFORM DEBUG] ========== TRANSFORMAÇÃO DOS DADOS ==========`)
  console.log(`[TRANSFORM DEBUG] positionId após desestruturação:`, positionId)
  console.log(`[TRANSFORM DEBUG] positionId (type):`, typeof positionId)
  console.log(`[TRANSFORM DEBUG] Position após desestruturação:`, Position)
  console.log(`[TRANSFORM DEBUG] Position (type):`, typeof Position)
  console.log(`[TRANSFORM DEBUG] Rest keys:`, Object.keys(rest))
  console.log(`[TRANSFORM DEBUG] ============================================`)
  
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
  
  console.log(`[RESULT DEBUG] ========== RESULTADO DO findMemberById ==========`)
  console.log(`[RESULT DEBUG] result.positionId:`, result.positionId)
  console.log(`[RESULT DEBUG] result.positionId (type):`, typeof result.positionId)
  console.log(`[RESULT DEBUG] result.position:`, JSON.stringify(result.position, null, 2))
  console.log(`[RESULT DEBUG] result keys:`, Object.keys(result))
  console.log(`[RESULT DEBUG] JSON completo do result:`, JSON.stringify(result, null, 2))
  console.log(`[RESULT DEBUG] =================================================`)
  
  console.log(`[PERMISSIONS DEBUG] Resultado final do findMemberById para ${id}:`, {
    permissionsCount: result.permissions.length,
    permissions: result.permissions,
    canViewPermissions,
    positionId: result.positionId,
    position: result.position,
  })
  
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
  
  console.log(`[PROFILE DEBUG] findMemberById retornando para ${id}:`, {
    hasManagePermission,
    canViewPermissions,
    email: result.email,
    phone: result.phone,
    address: result.address,
    positionId: result.positionId,
    position: result.position,
  })
  
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
  console.log(`[updateMemberRole] Iniciando atualização de role para membro ${memberId}, nova role: ${newRole}`)
  
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

      console.log(`[updateMemberRole] Membro encontrado: ${member.name}, role atual: ${oldRole}, role nova: ${newRole}`)
      console.log(`[updateMemberRole] Permissões atuais:`, currentPermissions)

      // Determinar permissões a manter/atribuir baseadas na nova role
      let permissionsToAssign: string[] = []

      if (newRole === Role.ADMINGERAL || newRole === Role.ADMINFILIAL) {
        // ADMINGERAL e ADMINFILIAL recebem todas as permissões
        permissionsToAssign = [...ALL_PERMISSION_TYPES]
        console.log(`[updateMemberRole] Role ${newRole}: atribuindo todas as permissões`)
      } else if (newRole === Role.COORDINATOR) {
        // COORDINATOR: mantém todas as permissões ativas (pode ter todas, incluindo restritas)
        // Upgrade: mantém todas as permissões que já estavam ativas
        permissionsToAssign = [...currentPermissions]
        // Garante que members_view sempre está presente
        if (!permissionsToAssign.includes('members_view')) {
          permissionsToAssign.push('members_view')
        }
        console.log(`[updateMemberRole] Role COORDINATOR: mantendo permissões ativas`)
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
        console.log(`[updateMemberRole] Role MEMBER: removendo permissões restritas`)
        console.log(`[updateMemberRole] Permissões restritas removidas:`, 
          currentPermissions.filter(perm => RESTRICTED_PERMISSIONS.includes(perm)))
      }

      console.log(`[updateMemberRole] Permissões a atribuir:`, permissionsToAssign)

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

      console.log(`[updateMemberRole] Role atualizada e permissões antigas removidas`)

      // Criar novas permissões uma por uma para melhor tratamento de erros
      if (permissionsToAssign.length > 0) {
        console.log(`[updateMemberRole] Criando ${permissionsToAssign.length} permissões:`, permissionsToAssign)
        
        // Criar permissões uma por uma para capturar erros específicos
        for (const permissionType of permissionsToAssign) {
          try {
            await tx.permission.create({
              data: {
                memberId,
                type: permissionType,
              },
            })
            console.log(`[updateMemberRole] Permissão ${permissionType} criada com sucesso`)
          } catch (error: any) {
            // Se for erro de duplicata, ignora (não deveria acontecer já que deletamos todas antes)
            if (error.code === 'P2002') {
              console.warn(`[updateMemberRole] Permissão ${permissionType} já existe, ignorando`)
            } else {
              console.error(`[updateMemberRole] Erro ao criar permissão ${permissionType}:`, error)
              throw new Error(`Erro ao criar permissão ${permissionType}: ${error.message}`)
            }
          }
        }
        
        console.log(`[updateMemberRole] Todas as permissões criadas com sucesso`)
      } else {
        console.log(`[updateMemberRole] Nenhuma permissão a criar`)
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

      console.log(`[updateMemberRole] Membro atualizado com sucesso:`, {
        id: result.id,
        role: result.role,
        permissionsCount: result.permissions.length,
        permissions: result.permissions.map(p => p.type),
      })

      return result
    })
  } catch (error: any) {
    console.error(`[updateMemberRole] Erro na transação:`, {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack,
    })
    throw error
  }
}
