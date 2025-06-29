import { FastifyRequest, FastifyReply } from 'fastify';
import { createBranchSchema } from '../schemas/branchSchema';
import {
  createBranch,
  getAllBranches,
  getBranchById,
  deleteBranchById,
} from '../services/branchService';

export async function createBranchHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = createBranchSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({ error: parsed.error.flatten() });
  }

  const branch = await createBranch(parsed.data);
  return reply.status(201).send(branch);
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
