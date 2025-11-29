import { z } from 'zod';
import { registerUserService } from '../../services/auth/registerService';
import { logAudit, AuditLogger } from '../../utils/auditHelper';
import { prisma } from '../../lib/prisma';
import { AuditAction } from '@prisma/client';
export async function registerController(request, reply) {
    const bodySchema = z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6),
        branchId: z.string().optional(),
        role: z.enum(['MEMBER', 'COORDINATOR', 'ADMINFILIAL', 'ADMINGERAL']).optional(),
        permissions: z.array(z.string()).optional(),
        birthDate: z.string().optional().transform((val) => val === '' ? undefined : val),
        phone: z.string().optional().transform((val) => val === '' ? undefined : val),
        address: z.string().optional().transform((val) => val === '' ? undefined : val),
        avatarUrl: z.preprocess((val) => {
            if (val === '' || val === null || val === undefined)
                return undefined;
            return val;
        }, z.string().url().optional()),
        fromLandingPage: z.boolean().optional(), // ← indica se é externo
        inviteToken: z.string().optional(), // Token do link de convite
    });
    try {
        const bodyData = bodySchema.parse(request.body);
        // Se tiver inviteToken, é registro via link de convite (público)
        const isInviteRegistration = !!bodyData.inviteToken;
        // Se não houver token e não houver branchId, trata como registro público
        // (registro público não precisa de branchId, apenas registro interno precisa)
        const isPublicRegistration = bodyData.fromLandingPage === true || (!request.user && !bodyData.branchId && !isInviteRegistration);
        // Prepara os dados para o serviço
        const serviceData = { ...bodyData };
        // Se for registro via link de convite, não precisa autenticação
        if (isInviteRegistration) {
            // Validação especial para erro de limite
            try {
                const result = await registerUserService(serviceData);
                // O serviço retorna um Member, que tem userId
                if (!result || !result.userId) {
                    console.error('❌ [REGISTER INVITE] Result do serviço inválido:', result);
                    return reply.status(500).send({
                        error: 'Erro ao processar registro: userId não encontrado no membro',
                        details: result ? 'Member sem userId' : 'Result é null/undefined'
                    });
                }
                // Gerar token JWT para o novo membro
                const user = await prisma.user.findUnique({
                    where: { id: result.userId },
                });
                if (!user) {
                    console.error('❌ [REGISTER INVITE] User não encontrado após criação:', result.userId);
                    return reply.status(500).send({
                        error: 'Erro ao processar registro: usuário não encontrado',
                        details: `userId: ${result.userId}`
                    });
                }
                const tokenPayload = {
                    sub: user.id,
                    email: user.email,
                    name: user.name,
                    type: 'member',
                    memberId: result.id,
                    role: result.role,
                    branchId: result.branchId,
                    permissions: [],
                };
                if (!request.server?.jwt) {
                    return reply.status(500).send({ error: 'Erro ao gerar token: JWT não configurado' });
                }
                const token = request.server.jwt.sign(tokenPayload, { expiresIn: '7d' });
                // Log de auditoria para registro via link
                await logAudit(request, AuditAction.MEMBER_CREATED, 'Member', `Membro registrado via link de convite: ${result.email}`, {
                    entityId: result.id,
                    metadata: {
                        memberEmail: result.email,
                        role: result.role,
                        branchId: result.branchId,
                        inviteLinkId: result.inviteLinkId,
                    },
                });
                // Garantir que o objeto member está completo antes de enviar
                const memberResponse = {
                    id: result.id,
                    name: result.name,
                    email: result.email,
                    role: result.role,
                    branchId: result.branchId,
                    userId: result.userId,
                    inviteLinkId: result.inviteLinkId,
                    phone: result.phone || null,
                    address: result.address || null,
                    birthDate: result.birthDate ? (result.birthDate instanceof Date ? result.birthDate.toISOString() : result.birthDate) : null,
                    avatarUrl: result.avatarUrl || null,
                    createdAt: result.createdAt ? (result.createdAt instanceof Date ? result.createdAt.toISOString() : result.createdAt) : new Date().toISOString(),
                    updatedAt: result.updatedAt ? (result.updatedAt instanceof Date ? result.updatedAt.toISOString() : result.updatedAt) : new Date().toISOString(),
                };
                return reply.status(201).send({
                    member: memberResponse,
                    token,
                });
            }
            catch (error) {
                console.error('❌ [REGISTER INVITE] Erro no registro via link:', error.message);
                // Tratamento específico para erros de email já cadastrado PRIMEIRO (deve retornar 400)
                // Isso deve ser verificado ANTES de qualquer outra verificação para garantir que retorne 400
                if (error.message?.includes('já cadastrado') ||
                    error.message?.includes('Email já cadastrado') ||
                    error.message?.includes('já está em uso') ||
                    error.message?.toLowerCase().includes('email já')) {
                    return reply.status(400).send({ error: error.message });
                }
                if (error.message === 'LIMIT_REACHED') {
                    // Log de auditoria para tentativa de registro com limite atingido
                    try {
                        await logAudit(request, AuditAction.MEMBER_REGISTRATION_ATTEMPT, 'Member', `Tentativa de registro via link de convite bloqueada: limite de membros atingido`, {
                            metadata: {
                                email: bodyData.email,
                                name: bodyData.name,
                                inviteToken: bodyData.inviteToken,
                                reason: 'LIMIT_REACHED',
                            },
                        });
                    }
                    catch (auditError) {
                        console.error('❌ [REGISTER INVITE] Erro ao criar log de auditoria:', auditError);
                        // Não quebra o fluxo se o log falhar
                    }
                    return reply.status(403).send({
                        error: 'LIMIT_REACHED',
                        message: 'O limite de membros do plano foi atingido. Entre em contato com o administrador responsável.',
                    });
                }
                // Tratamento específico para erros de link de convite (limite de usos, expirado, desativado)
                // Verificar diretamente por "limite de usos" ou outras mensagens específicas
                if (error.message?.includes('limite de usos') ||
                    error.message?.includes('desativado') ||
                    error.message?.includes('expirado') ||
                    error.message?.includes('expirou') ||
                    error.message?.toLowerCase().includes('link de convite')) {
                    if (error.message.includes('não encontrado')) {
                        return reply.status(404).send({ error: error.message });
                    }
                    if (error.message.includes('desativado') || error.message.includes('expirado') || error.message.includes('expirou') || error.message.includes('limite de usos')) {
                        return reply.status(403).send({ error: error.message });
                    }
                }
                // Re-lança o erro para ser tratado no catch externo
                throw error;
            }
        }
        // Se não for registro público, precisa estar autenticado
        if (!isPublicRegistration) {
            if (!request.user) {
                return reply.status(401).send({ error: 'Autenticação necessária para criar membros' });
            }
            // Adiciona o ID do usuário criador para validações
            serviceData.creatorUserId = request.user.userId;
        }
        else {
            // Marca explicitamente como registro público
            serviceData.fromLandingPage = true;
        }
        const result = await registerUserService(serviceData);
        // Se for registro público, gera o token JWT
        if (isPublicRegistration) {
            try {
                // O serviço retorna { success: true, message: '...', user } para registro público
                const user = result?.user;
                if (!user) {
                    return reply.status(500).send({
                        error: 'Erro ao processar registro: dados do usuário não encontrados'
                    });
                }
                // Não inclui campos de Member no token quando não há Member associado
                // Isso mantém o token limpo e permite que o frontend verifique com toBeUndefined()
                const tokenPayload = {
                    sub: user.id,
                    email: user.email,
                    name: user.name,
                    type: 'user',
                    permissions: [], // Usuário não tem permissões (apenas membros têm)
                };
                if (!request.server?.jwt) {
                    return reply.status(500).send({
                        error: 'Erro ao gerar token: JWT não configurado'
                    });
                }
                const token = request.server.jwt.sign(tokenPayload, { expiresIn: '7d' });
                const response = {
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                    },
                    token,
                };
                return reply.status(201).send(response);
            }
            catch (error) {
                console.error('❌ Erro ao gerar token no registro público:', error);
                return reply.status(500).send({
                    error: 'Erro ao gerar token de autenticação',
                    details: error.message
                });
            }
        }
        // Log de auditoria para criação de membros internos
        if (!serviceData.fromLandingPage && result && 'id' in result) {
            await AuditLogger.memberCreated(request, result.id, result.email, result.role, result.branchId);
        }
        return reply.status(201).send(result);
    }
    catch (error) {
        // Erros de validação do Zod retornam 400
        if (error.name === 'ZodError') {
            return reply.status(400).send({ error: 'Dados inválidos', details: error.errors });
        }
        console.error('❌ Erro ao registrar usuário:', error);
        console.error('❌ Error name:', error.name);
        console.error('❌ Error message:', error.message);
        // Retorna erro 403 para erros de autorização/permissão/hierarquia
        // IMPORTANTE: Verificar erros de hierarquia PRIMEIRO (antes de outros)
        // Verifica erros de hierarquia primeiro (antes de validação)
        const errorMsg = error.message || String(error);
        if (errorMsg.includes('Apenas o sistema pode criar um Administrador Geral') ||
            errorMsg.includes('Apenas o sistema pode criar') ||
            errorMsg.includes('não pode criar um Administrador') ||
            errorMsg.includes('Você não pode criar um Administrador Geral') ||
            errorMsg.includes('Administrador Geral') ||
            errorMsg.includes('Coordenadores só podem criar') ||
            errorMsg.includes('só pode criar membros com role')) {
            return reply.status(403).send({ error: errorMsg });
        }
        // Retorna erro 400 para erros de validação PRIMEIRO (antes de outras verificações)
        // "Filial não encontrada" é erro de validação (branchId inválido)
        // "Email já cadastrado" também é erro de validação
        if (error.message?.includes('obrigatório') ||
            error.message?.includes('Filial não encontrada') ||
            error.message?.includes('já cadastrado') ||
            error.message?.includes('Email já cadastrado') ||
            error.message?.includes('já está em uso') ||
            error.message?.toLowerCase().includes('email já')) {
            return reply.status(400).send({ error: error.message });
        }
        // Verifica outros erros de autorização/permissão
        if (error.message?.includes('permissão') ||
            error.message?.includes('Limite do plano') ||
            error.message?.includes('não pode criar') ||
            error.message?.includes('não pode atribuir') ||
            error.message?.includes('só pode criar membros na sua própria filial')) {
            // Log de tentativa não autorizada
            if (error.message?.includes('permissão') ||
                error.message?.includes('não pode criar') ||
                error.message?.includes('não pode atribuir')) {
                await AuditLogger.unauthorizedAccessAttempt(request, 'CREATE_MEMBER', error.message);
            }
            // Log de limite excedido
            if (error.message?.includes('Limite do plano')) {
                const limitMatch = error.message.match(/(\d+)\s*membros/);
                if (limitMatch) {
                    await AuditLogger.planLimitExceeded(request, 'members', parseInt(limitMatch[1]), parseInt(limitMatch[1]));
                }
            }
            return reply.status(403).send({ error: error.message });
        }
        // Erros de link de convite
        // Verificar diretamente por "limite de usos" ou outras mensagens específicas
        if (error.message?.includes('limite de usos') ||
            error.message?.includes('desativado') ||
            error.message?.includes('expirado') ||
            error.message?.includes('expirou') ||
            error.message?.toLowerCase().includes('link de convite')) {
            if (error.message.includes('não encontrado')) {
                return reply.status(404).send({ error: error.message });
            }
            if (error.message.includes('desativado') || error.message.includes('expirado') || error.message.includes('expirou') || error.message.includes('limite de usos')) {
                return reply.status(403).send({ error: error.message });
            }
        }
        // Erro específico de LIMIT_REACHED (pode vir de validateInviteLink)
        if (error.message === 'LIMIT_REACHED') {
            return reply.status(403).send({
                error: 'LIMIT_REACHED',
                message: 'O limite de membros do plano foi atingido. Entre em contato com o administrador responsável.',
            });
        }
        return reply.status(500).send({ error: 'Erro ao registrar usuário', details: error.message });
    }
}
