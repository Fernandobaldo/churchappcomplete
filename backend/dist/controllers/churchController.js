import { z } from 'zod';
import { ChurchService } from '../services/churchService';
import { AuditLogger } from '../utils/auditHelper';
import { prisma } from '../lib/prisma';
export class ChurchController {
    constructor() {
        this.service = new ChurchService();
    }
    async create(request, reply) {
        const bodySchema = z.object({
            name: z.string(),
            logoUrl: z.string().url().optional(),
            withBranch: z.boolean().optional(),
            branchName: z.string().optional(),
            pastorName: z.string().optional(),
        });
        const data = bodySchema.parse(request.body);
        // Obtém o usuário logado a partir do token JWT
        const user = request.user;
        // Busca os dados do usuário no banco para ter nome, senha, etc
        const dbUser = await this.service.getUserData(user.sub);
        if (!dbUser) {
            return reply.code(401).send({ message: 'Usuário não encontrado.' });
        }
        const result = await this.service.createChurchWithMainBranch(data, dbUser);
        // Busca o User com Member associado para gerar o token atualizado
        let newToken = null;
        if (result.member) {
            // Busca User com Member associado (incluindo Branch e Church)
            const userWithMember = await prisma.user.findUnique({
                where: { id: dbUser.id },
                include: {
                    Member: {
                        include: {
                            Permission: true,
                            Branch: {
                                include: {
                                    Church: true,
                                },
                            },
                        },
                    },
                },
            });
            if (userWithMember?.Member) {
                const member = userWithMember.Member;
                const tokenPayload = {
                    sub: userWithMember.id,
                    email: userWithMember.email,
                    name: userWithMember.name,
                    type: 'member',
                    memberId: member.id,
                    role: member.role,
                    branchId: member.branchId,
                    churchId: member.Branch?.Church?.id || null,
                    permissions: member.Permission.map(p => p.type),
                };
                newToken = request.server.jwt.sign(tokenPayload, { expiresIn: '7d' });
                console.log(`[CHURCH] ✅ Token gerado para member ${member.id} com role ${member.role} e ${member.Permission.length} permissões`);
            }
            else {
                console.warn(`[CHURCH] ⚠️ Member não encontrado após criação para user ${dbUser.id}`);
            }
        }
        else {
            console.warn('[CHURCH] ⚠️ Member não foi criado (withBranch pode ser false)');
        }
        // Log de auditoria
        await AuditLogger.churchCreated(request, result.church.id, result.church.name);
        return reply.code(201).send({
            ...result,
            token: newToken, // Retorna o novo token (pode ser null se não criou member)
        });
    }
    async getAll(request, reply) {
        try {
            // Obtém o branchId do usuário do token (se disponível)
            const userBranchId = request.user?.branchId || null;
            const churches = await this.service.getAllChurches(userBranchId);
            return reply.send(churches);
        }
        catch (error) {
            console.error('Erro ao buscar igrejas:', error);
            return reply.status(500).send({
                error: 'Erro ao buscar igrejas',
                message: error.message
            });
        }
    }
    async getById(request, reply) {
        const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
        const church = await this.service.getChurchById(id);
        if (!church) {
            return reply.code(404).send({ message: 'Igreja não encontrada.' });
        }
        return reply.send(church);
    }
    async update(request, reply) {
        const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
        const data = z
            .object({
            name: z.string(),
            logoUrl: z.string().url().optional(),
            withBranch: z.boolean().optional(),
            branchName: z.string().optional(),
            pastorName: z.string().optional(),
        })
            .parse(request.body);
        const church = await this.service.updateChurch(id, data);
        return reply.send(church);
    }
    async delete(request, reply) {
        const { id } = request.params;
        const user = request.user;
        const userId = request.user?.id;
        if (!user || user.role !== 'SAASADMIN') {
            return reply.status(403).send({ error: 'Apenas o administrador do sistema pode deletar uma igreja.' });
        }
        const church = await this.service.getChurchById(id);
        if (!church) {
            return reply.status(404).send({ error: 'Igreja não encontrada.' });
        }
        //  validar se o usuário é o administrador da igreja
        if (church.ownerId !== userId)
            return reply.status(403).send({ error: 'Acesso negado.' });
        await this.service.deleteChurch(id);
        return reply.status(200).send({ message: 'Igreja deletada com sucesso.' });
    }
    async deactivate(request, reply) {
        const { id } = request.params;
        const user = request.user;
        const church = await this.service.getChurchById(id);
        if (!church) {
            return reply.status(404).send({ error: 'Igreja não encontrada.' });
        }
        // Permitir se for SAASADMIN ou ADMINGERAL dessa igreja
        const isSaasAdmin = user.role === 'SAASADMIN';
        const isChurchOwner = user.role === 'ADMINGERAL' && church.Branch?.some(branch => branch.members?.some(member => member.userId === user.id));
        if (!isSaasAdmin && !isChurchOwner) {
            return reply.status(403).send({ error: 'Apenas o administrador da igreja ou do sistema pode desativar.' });
        }
        await this.service.deactivateChurch(id);
        return reply.status(200).send({ message: 'Igreja desativada com sucesso.' });
    }
}
