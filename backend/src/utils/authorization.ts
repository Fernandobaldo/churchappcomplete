import { prisma } from '../lib/prisma'
import { Role } from '@prisma/client'

/**
 * Obtém os dados completos do membro a partir do ID do usuário
 */
export async function getMemberFromUserId(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
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

  return user?.Member
}

/**
 * Verifica se um membro pode criar outro membro
 * @param creatorMemberId ID do membro que está criando
 * @param targetBranchId ID da branch onde o membro será criado
 * @param targetRole Role que será atribuído ao novo membro
 * @throws Error se não tiver permissão
 */
export async function validateMemberCreationPermission(
  creatorMemberId: string,
  targetBranchId: string,
  targetRole?: Role
): Promise<void> {
  // 1. Buscar dados do criador
  const creator = await prisma.member.findUnique({
    where: { id: creatorMemberId },
    include: {
      Branch: {
        include: { Church: true },
      },
      Permission: true,
    },
  })
  if (!creator) {
    throw new Error('Membro criador não encontrado')
  }

  // 2. Verificar se o criador tem permissão baseada no role
  // ADMINGERAL e ADMINFILIAL têm permissão implícita (não precisam de permissão explícita)
  if (creator.role === Role.ADMINGERAL || creator.role === Role.ADMINFILIAL) {
    // Admins têm permissão implícita, pode continuar
  } else if (creator.role === Role.MEMBER) {
    // MEMBER só pode criar se tiver permissão members_manage
    const hasPermission = creator.Permission.some(
      (p) => p.type === 'members_manage'
    )
    if (!hasPermission) {
      throw new Error('Você não tem permissão para criar membros')
    }
  } else if (creator.role === Role.COORDINATOR) {
    // COORDINATOR só pode criar se tiver permissão members_manage
    const hasPermission = creator.Permission.some(
      (p) => p.type === 'members_manage'
    )
    if (!hasPermission) {
      throw new Error('Você não tem permissão para criar membros. É necessária a permissão members_manage')
    }
  }

  // 3. Validar hierarquia de roles PRIMEIRO (antes de verificar branch)
  // Isso garante que erros de hierarquia sejam retornados como 403, não 400
  if (targetRole) {
    validateRoleHierarchy(creator.role, targetRole)
  }

  // 4. Verificar se a branch de destino existe e pertence à mesma igreja
  const targetBranch = await prisma.branch.findUnique({
    where: { id: targetBranchId },
  })

  if (!targetBranch) {
    throw new Error('Filial não encontrada')
  }

  // 5. Verificar se ADMINFILIAL está tentando criar em outra filial (ANTES de verificar igreja)
  if (creator.role === Role.ADMINFILIAL && creator.branchId !== targetBranchId) {
    throw new Error('Você só pode criar membros na sua própria filial')
  }

  // 6. Verificar se a branch pertence à mesma igreja do criador
  if (targetBranch.churchId !== creator.Branch.churchId) {
    throw new Error('Você não pode criar membros em filiais de outras igrejas')
  }

  // 7. Verificar se COORDINATOR está tentando criar em outra filial
  if (creator.role === Role.COORDINATOR && creator.branchId !== targetBranchId) {
    throw new Error('Você só pode criar membros na sua própria filial')
  }
}

/**
 * Valida se um role pode atribuir outro role
 * @param creatorRole Role do criador
 * @param targetRole Role que será atribuído
 * @throws Error se não puder atribuir
 */
export function validateRoleHierarchy(
  creatorRole: Role,
  targetRole: Role
): void {
  // ADMINFILIAL não pode criar ADMINGERAL (verificar ANTES da verificação geral)
  if (creatorRole === Role.ADMINFILIAL && targetRole === Role.ADMINGERAL) {
    throw new Error('Você não pode criar um Administrador Geral')
  }

  // ADMINGERAL não pode criar outro ADMINGERAL (apenas o sistema pode)
  if (targetRole === Role.ADMINGERAL) {
    throw new Error('Apenas o sistema pode criar um Administrador Geral')
  }

  // COORDINATOR só pode criar MEMBER
  if (creatorRole === Role.COORDINATOR && targetRole !== Role.MEMBER) {
    throw new Error('Coordenadores só podem criar membros com role MEMBER')
  }

  // MEMBER não pode atribuir roles
  if (creatorRole === Role.MEMBER) {
    throw new Error('Membros não podem atribuir roles')
  }
}

/**
 * Verifica se um membro pode editar outro membro
 * @param editorMemberId ID do membro que está editando
 * @param targetMemberId ID do membro que será editado
 * @throws Error se não tiver permissão
 */
export async function validateMemberEditPermission(
  editorMemberId: string,
  targetMemberId: string
): Promise<void> {
  // 1. Buscar dados do editor
  const editor = await prisma.member.findUnique({
    where: { id: editorMemberId },
    include: {
      Branch: true,
    },
  })

  if (!editor) {
    throw new Error('Membro editor não encontrado')
  }

  // 2. Buscar dados do membro alvo
  const target = await prisma.member.findUnique({
    where: { id: targetMemberId },
    include: {
      Branch: true,
    },
  })

  if (!target) {
    throw new Error('Membro alvo não encontrado')
  }

  // 3. ADMINGERAL pode editar qualquer membro da igreja
  if (editor.role === Role.ADMINGERAL) {
    if (editor.Branch.churchId !== target.Branch.churchId) {
      throw new Error('Você só pode editar membros da sua igreja')
    }
    return
  }

  // 4. ADMINFILIAL pode editar apenas membros da sua filial
  if (editor.role === Role.ADMINFILIAL) {
    if (editor.branchId !== target.branchId) {
      throw new Error('Você só pode editar membros da sua filial')
    }
    return
  }

  // 5. Outros roles só podem editar a si mesmos
  if (editor.id !== target.id) {
    throw new Error('Você só pode editar seu próprio perfil')
  }
}

/**
 * Verifica se um membro pode alterar o cargo (position) de outro membro
 * @param editorMemberId ID do membro que está editando
 * @param targetMemberId ID do membro que terá o cargo alterado
 * @param editorRole Role do editor
 * @param editorPermissions Permissões do editor
 * @throws Error se não tiver permissão
 */
export async function validatePositionChangePermission(
  editorMemberId: string,
  targetMemberId: string,
  editorRole: Role,
  editorPermissions: Array<{ type: string }>
): Promise<void> {
  // Verifica se tem permissão para editar membros
  const hasMembersManage = editorPermissions.some(p => p.type === 'members_manage')
  
  // Verifica se o usuário tem uma das permissões necessárias
  const hasPermission = 
    editorRole === Role.ADMINGERAL || 
    editorRole === Role.ADMINFILIAL || 
    editorRole === Role.COORDINATOR ||
    hasMembersManage
  
  if (!hasPermission) {
    throw new Error('Você não tem permissão para alterar o cargo. Apenas administradores, coordenadores ou usuários com permissão para editar membros podem fazer isso.')
  }
  
  // Se é o próprio perfil e tem permissão, pode alterar
  if (editorMemberId === targetMemberId) {
    return
  }
  
  // Se está editando outro membro, usa a mesma lógica de validateMemberEditPermission
  // mas também verifica se tem permissão members_manage
  const editor = await prisma.member.findUnique({
    where: { id: editorMemberId },
    include: {
      Branch: true,
      Permission: true,
    },
  })

  if (!editor) {
    throw new Error('Membro editor não encontrado')
  }

  const target = await prisma.member.findUnique({
    where: { id: targetMemberId },
    include: {
      Branch: true,
    },
  })

  if (!target) {
    throw new Error('Membro alvo não encontrado')
  }

  // Verifica se tem permissão members_manage (buscando do banco para garantir dados atualizados)
  const editorHasMembersManage = editor.Permission.some(p => p.type === 'members_manage')

  // ADMINGERAL pode alterar cargo de qualquer membro da igreja
  if (editor.role === Role.ADMINGERAL) {
    if (editor.Branch.churchId !== target.Branch.churchId) {
      throw new Error('Você só pode editar membros da sua igreja')
    }
    return
  }

  // ADMINFILIAL pode alterar cargo de membros da sua filial
  if (editor.role === Role.ADMINFILIAL) {
    if (editor.branchId !== target.branchId) {
      throw new Error('Você só pode editar membros da sua filial')
    }
    return
  }

  // COORDINATOR pode alterar cargo se tiver permissão members_manage
  if (editor.role === Role.COORDINATOR && editorHasMembersManage) {
    if (editor.branchId !== target.branchId) {
      throw new Error('Você só pode editar membros da sua filial')
    }
    return
  }

  // Se não tem permissão, não pode alterar
  throw new Error('Você não tem permissão para alterar o cargo. Apenas administradores, coordenadores ou usuários com permissão para editar membros podem fazer isso.')
}

/**
 * Verifica se um membro pode alterar a role de outro membro
 * @param editorMemberId ID do membro que está editando
 * @param targetMemberId ID do membro que terá a role alterada
 * @param newRole Nova role que será atribuída
 * @throws Error se não tiver permissão
 */
export async function validateRoleChangePermission(
  editorMemberId: string,
  targetMemberId: string,
  newRole: Role
): Promise<void> {
  // 1. Buscar dados do editor
  const editor = await prisma.member.findUnique({
    where: { id: editorMemberId },
    include: {
      Branch: true,
    },
  })

  if (!editor) {
    throw new Error('Membro editor não encontrado')
  }

  // 2. Verificar se COORDINATOR ou MEMBER podem alterar roles (não podem)
  if (editor.role === Role.COORDINATOR || editor.role === Role.MEMBER) {
    throw new Error('Você não tem permissão para alterar roles')
  }

  // 3. Buscar dados do membro alvo para validar mudança de role
  const targetMember = await prisma.member.findUnique({
    where: { id: targetMemberId },
  })

  if (!targetMember) {
    throw new Error('Membro alvo não encontrado')
  }

  // 4. Validar hierarquia de roles (apenas para criação de ADMINGERAL)
  // Para downgrades e outras mudanças, permitir se o editor tem permissão
  if (newRole === Role.ADMINGERAL) {
    // Apenas o sistema pode criar ADMINGERAL
    throw new Error('Apenas o sistema pode criar um Administrador Geral')
  }

  // 5. Validar se o editor pode editar o membro alvo (mesma igreja/filial)
  await validateMemberEditPermission(editorMemberId, targetMemberId)
}

/**
 * Verifica se um membro tem uma permissão específica
 * @param member Membro com Permission incluído
 * @param permission Tipo de permissão a verificar
 * @returns true se tiver permissão, false caso contrário
 */
export function hasAccess(member: { role: Role; Permission: Array<{ type: string }> }, permission: string): boolean {
  // ADMINGERAL e ADMINFILIAL têm acesso a tudo
  if (member.role === Role.ADMINGERAL || member.role === Role.ADMINFILIAL) {
    return true
  }
  
  // Verifica se tem a permissão específica
  return member.Permission.some((p) => p.type === permission)
}

