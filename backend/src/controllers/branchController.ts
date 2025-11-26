import { FastifyRequest, FastifyReply } from 'fastify';
import { createBranchSchema } from '../schemas/branchSchema';
import {
  createBranch,
  getAllBranches,
  getBranchById,
  deleteBranchById,
} from '../services/branchService';
import { AuditLogger } from '../utils/auditHelper';

export async function createBranchHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = createBranchSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    // Adiciona o ID do usuário criador para validações
    if (!request.user) {
      return reply.status(401).send({ error: 'Autenticação necessária para criar filiais' });
    }

    const branch = await createBranch({
      ...parsed.data,
      creatorUserId: request.user.userId || request.user.id,
    });

    // Log de auditoria
    await AuditLogger.branchCreated(
      request,
      branch.id,
      branch.name,
      branch.churchId
    );

    return reply.status(201).send(branch);
  } catch (error: any) {
    console.error('❌ Erro ao criar filial:', error);
    
    // Retorna erro 403 para erros de autorização/permissão
    if (error.message?.includes('permissão') || 
        error.message?.includes('Limite do plano') ||
        error.message?.includes('não pode criar') ||
        error.message?.includes('Apenas Administradores')) {
      
      // Log de tentativa não autorizada
      if (error.message?.includes('Apenas Administradores') ||
          error.message?.includes('não pode criar')) {
        await AuditLogger.unauthorizedAccessAttempt(
          request,
          'CREATE_BRANCH',
          error.message
        );
      }

      // Log de limite excedido
      if (error.message?.includes('Limite do plano')) {
        const limitMatch = error.message.match(/(\d+)\s*filiais/)
        if (limitMatch) {
          await AuditLogger.planLimitExceeded(
            request,
            'branches',
            parseInt(limitMatch[1]),
            parseInt(limitMatch[1])
          );
        }
      }

      return reply.status(403).send({ error: error.message });
    }

    // Retorna erro 400 para erros de validação (incluindo recursos não encontrados fornecidos pelo usuário)
    if (error.message?.includes('obrigatório') || 
        error.message?.includes('já cadastrado') ||
        error.message?.includes('Igreja não encontrada') ||
        error.message?.includes('Filial não encontrada') ||
        error.message?.includes('não está associado a uma filial') ||
        error.message?.includes('Plano não encontrado')) {
      return reply.status(400).send({ error: error.message });
    }
    
    // Retorna erro 404 para recursos não encontrados em operações de leitura
    // Mas apenas se não for um erro de validação de dados do usuário
    if ((error.message?.includes('não encontrado') ||
         error.message?.includes('não encontrada')) &&
        !error.message?.includes('Igreja não encontrada') &&
        !error.message?.includes('Filial não encontrada') &&
        !error.message?.includes('Membro criador não encontrado') &&
        !error.message?.includes('Plano não encontrado')) {
      return reply.status(404).send({ error: error.message });
    }
    
    // Trata erro quando membro criador não é encontrado (pode ser 400 ou 404 dependendo do contexto)
    if (error.message?.includes('Membro criador não encontrado')) {
      return reply.status(400).send({ error: error.message });
    }

    return reply.status(500).send({ error: 'Erro ao criar filial', details: error.message });
  }
}

export async function listBranchesHandler(request: FastifyRequest, reply: FastifyReply) {
  const branches = await getAllBranches();
  return reply.send(branches);
}

export async function deleteBranchHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const { id } = request.params;

  const branch = await getBranchById(id);
  if (!branch) {
    return reply.status(404).send({ error: 'Filial não encontrada.' });
  }

  if (branch.isMainBranch) {
    return reply.status(400).send({ error: 'Não é permitido deletar a sede da igreja.' });
  }

  await deleteBranchById(id);
  return reply.status(200).send({ message: 'Filial deletada com sucesso.' });
}
