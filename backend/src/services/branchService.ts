import { prisma } from '../lib/prisma';
import { checkPlanBranchesLimit } from '../utils/planLimits';
import { getMemberFromUserId } from '../utils/authorization';

type CreateBranchInput = {
  name: string;
  churchId: string;
  creatorUserId?: string; // ID do usuário que está criando (para validações)
};

export async function createBranch(data: CreateBranchInput) {
  const { creatorUserId, churchId } = data;

  // 1. Validar se a igreja existe (deve vir PRIMEIRO, antes de validar permissões)
  const church = await prisma.church.findUnique({ where: { id: churchId } });
  if (!church) {
    throw new Error('Igreja não encontrada');
  }

  // Validações de segurança
  if (creatorUserId) {
    // 2. Buscar dados do criador
    const creatorMember = await getMemberFromUserId(creatorUserId);
    if (!creatorMember) {
      throw new Error('Membro criador não encontrado. Você precisa estar logado como membro para criar filiais.');
    }

    // 3. Verificar se é ADMINGERAL (único que pode criar branches)
    if (creatorMember.role !== 'ADMINGERAL') {
      throw new Error('Apenas Administradores Gerais podem criar filiais');
    }

    // 4. Verificar se o criador tem Branch associada
    if (!creatorMember.Branch) {
      throw new Error('Membro criador não está associado a uma filial.');
    }

    // 5. Verificar se a igreja pertence ao criador
    if (creatorMember.Branch.churchId !== churchId) {
      throw new Error('Você não pode criar filiais para outras igrejas');
    }

    // 6. Validar limite de plano
    await checkPlanBranchesLimit(creatorUserId);
  }

  // Remove creatorUserId antes de criar (não é campo do modelo)
  const { creatorUserId: _, ...branchData } = data;
  return prisma.branch.create({ data: branchData });
}

export async function getAllBranches() {
  return prisma.branch.findMany();
}

export async function getBranchById(id: string) {
  return prisma.branch.findUnique({ where: { id } });
}

export async function deleteBranchById(id: string) {
  return prisma.branch.delete({ where: { id } });
}
