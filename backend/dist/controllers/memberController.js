import { memberIdParamSchema, updateMemberBodySchema } from '../schemas/memberSchemas';
import { findAllMembers, findMemberById, formatDate, updateMember } from '../services/memberService';
import { parse } from 'date-fns';
import { getMemberFromUserId, validateMemberEditPermission } from '../utils/authorization';
import { AuditLogger } from '../utils/auditHelper';
export async function getAllMembers(request, reply) {
    try {
        const user = request.user;
        if (!user || !user.memberId) {
            return reply.status(401).send({ error: 'Autenticação necessária' });
        }
        // Buscar dados completos do membro para obter churchId
        const currentMember = await getMemberFromUserId(user.userId);
        if (!currentMember) {
            return reply.status(404).send({ error: 'Membro não encontrado' });
        }
        if (!currentMember.Branch) {
            return reply.status(404).send({ error: 'Filial do membro não encontrada' });
        }
        const churchId = currentMember.Branch.churchId;
        const branchId = user.branchId || currentMember.branchId;
        const userRole = user.role || currentMember.role;
        const memberId = user.memberId || currentMember.id;
        const members = await findAllMembers(branchId, churchId, userRole, memberId);
        return reply.send(members);
    }
    catch (error) {
        return reply.status(500).send({ error: error.message });
    }
}
export async function getMemberById(request, reply) {
    try {
        const { id } = memberIdParamSchema.parse(request.params);
        const user = request.user;
        if (!user || !user.memberId) {
            return reply.status(401).send({ error: 'Autenticação necessária' });
        }
        const member = await findMemberById(id);
        if (!member) {
            return reply.code(404).send({ message: 'Membro não encontrado' });
        }
        // Buscar dados completos do membro atual
        const currentMember = await getMemberFromUserId(user.userId);
        if (!currentMember) {
            return reply.status(404).send({ error: 'Membro atual não encontrado' });
        }
        if (!currentMember.Branch) {
            return reply.status(404).send({ error: 'Filial do membro atual não encontrada' });
        }
        if (!member.branch) {
            return reply.status(404).send({ error: 'Filial do membro não encontrada' });
        }
        // ADMINGERAL pode ver qualquer membro da igreja
        if (currentMember.role === 'ADMINGERAL') {
            if (member.branch.churchId !== currentMember.Branch.churchId) {
                return reply.status(403).send({ error: 'Você só pode visualizar membros da sua igreja' });
            }
        }
        // ADMINFILIAL e COORDINATOR só podem ver membros da sua filial
        else if (currentMember.role === 'ADMINFILIAL' || currentMember.role === 'COORDINATOR') {
            if (member.branchId !== currentMember.branchId) {
                return reply.status(403).send({ error: 'Você só pode visualizar membros da sua filial' });
            }
        }
        // MEMBER só pode ver a si mesmo
        else {
            if (member.id !== currentMember.id) {
                return reply.status(403).send({ error: 'Você só pode visualizar seu próprio perfil' });
            }
        }
        return reply.send({
            ...member,
            birthDate: formatDate(member.birthDate),
        });
    }
    catch (error) {
        return reply.status(500).send({ error: error.message });
    }
}
export async function getMyProfile(request, reply) {
    const user = request.user;
    if (!user) {
        return reply.status(401).send({ message: 'Usuário não autenticado.' });
    }
    // Se o usuário não tem memberId, significa que não tem membro associado
    if (!user.memberId) {
        return reply.status(404).send({ message: 'Membro não encontrado' });
    }
    const member = await findMemberById(user.memberId);
    if (!member) {
        return reply.code(404).send({ message: 'Membro não encontrado' });
    }
    return reply.send({
        ...member,
        birthDate: formatDate(member.birthDate),
    });
}
export async function updateMemberById(request, reply) {
    try {
        const { id } = memberIdParamSchema.parse(request.params);
        const body = updateMemberBodySchema.parse(request.body);
        const user = request.user;
        if (!user || !user.memberId) {
            return reply.status(401).send({ error: 'Autenticação necessária' });
        }
        // Validar permissão de edição
        await validateMemberEditPermission(user.memberId, id);
        const dataToUpdate = { ...body };
        if (body.birthDate) {
            const parsedDate = parse(body.birthDate, 'dd/MM/yyyy', new Date());
            if (isNaN(parsedDate.getTime())) {
                return reply.status(400).send({ message: 'Data de nascimento inválida.' });
            }
            dataToUpdate.birthDate = parsedDate;
        }
        if (Object.keys(dataToUpdate).length === 0) {
            return reply.status(400).send({ message: 'Nenhum dado para atualizar.' });
        }
        const updated = await updateMember(id, dataToUpdate);
        // Log de auditoria
        await AuditLogger.memberUpdated(request, id, dataToUpdate);
        return reply.send(updated);
    }
    catch (error) {
        // Erros de permissão/autorização
        if (error.message?.includes('permissão') ||
            error.message?.includes('não pode') ||
            error.message?.includes('só pode') ||
            error.message?.includes('Apenas') ||
            error.message?.includes('Você não pode') ||
            error.message?.includes('Você só pode')) {
            return reply.status(403).send({ error: error.message });
        }
        // Erro quando membro não encontrado (do validateMemberEditPermission ou do Prisma)
        if (error.code === 'P2025' ||
            error.message?.includes('Record to update not found') ||
            error.message?.includes('Membro alvo não encontrado') ||
            error.message?.includes('Membro editor não encontrado') ||
            error.message?.includes('não encontrado')) {
            return reply.status(404).send({ error: 'Membro não encontrado' });
        }
        // Erro de validação do Zod
        if (error.name === 'ZodError') {
            return reply.status(400).send({ error: 'Dados inválidos', details: error.errors });
        }
        return reply.status(500).send({ error: error.message || 'Erro ao atualizar membro' });
    }
}
