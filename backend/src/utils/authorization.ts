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
  if (creator.role === Role.MEMBER) {
    // MEMBER só pode criar se tiver permissão members_manage
    const hasPermission = creator.Permission.some(
      (p) => p.type === 'members_manage'
    )
    if (!hasPermission) {
      throw new Error('Você não tem permissão para criar membros')
    }
  }

  // COORDINATOR só pode criar se tiver permissão members_manage
  if (creator.role === Role.COORDINATOR) {
    const hasPermission = creator.Permission.some(
      (p) => p.type === 'members_manage'
    )
    if (!hasPermission) {
      throw new Error('Você não tem permissão para criar membros. É necessária a permissão members_manage')
    }
  }

  // 3. Verificar se a branch de destino existe e pertence à mesma igreja
  const targetBranch = await prisma.branch.findUnique({
    where: { id: targetBranchId },
  })

  if (!targetBranch) {
    throw new Error('Filial não encontrada')
  }

  // 4. Verificar se ADMINFILIAL está tentando criar em outra filial (ANTES de verificar igreja)
  if (creator.role === Role.ADMINFILIAL && creator.branchId !== targetBranchId) {
    throw new Error('Você só pode criar membros na sua própria filial')
  }

  // 5. Verificar se a branch pertence à mesma igreja do criador
  if (targetBranch.churchId !== creator.Branch.churchId) {
    throw new Error('Você não pode criar membros em filiais de outras igrejas')
  }

  // 6. Verificar se COORDINATOR está tentando criar em outra filial
  if (creator.role === Role.COORDINATOR && creator.branchId !== targetBranchId) {
    throw new Error('Você só pode criar membros na sua própria filial')
  }

  // 7. Validar hierarquia de roles
  if (targetRole) {
    validateRoleHierarchy(creator.role, targetRole)
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
  // ADMINGERAL não pode criar outro ADMINGERAL (apenas o sistema pode)
  if (targetRole === Role.ADMINGERAL) {
    throw new Error('Apenas o sistema pode criar um Administrador Geral')
  }

  // ADMINFILIAL não pode criar ADMINGERAL
  if (creatorRole === Role.ADMINFILIAL && targetRole === Role.ADMINGERAL) {
    throw new Error('Você não pode criar um Administrador Geral')
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

