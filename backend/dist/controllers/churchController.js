import { z } from 'zod';
import { ChurchService } from '../services/churchService';
import { AuditLogger } from '../utils/auditHelper';
import { prisma } from '../lib/prisma';
import { getMemberFromUserId } from '../utils/authorization';
import { OnboardingProgressService } from '../services/onboardingProgressService';
export class ChurchController {
    constructor() {
        this.service = new ChurchService();
        this.progressService = new OnboardingProgressService();
    }
    async create(request, reply) {
        try {
            const bodySchema = z.object({
                name: z.string(),
                logoUrl: z.string().url().optional(),
                avatarUrl: z.string().nullable().optional(),
                address: z.string().optional(),
                phone: z.string().optional(),
                email: z.string().email().optional(),
                website: z.string().url().optional(),
                socialMedia: z.object({
                    facebook: z.string().url().optional(),
                    instagram: z.string().url().optional(),
                    youtube: z.string().url().optional(),
                    twitter: z.string().url().optional(),
                }).optional(),
                withBranch: z.boolean().optional(),
                branchName: z.string().optional(),
                pastorName: z.string().optional(),
            });
            const data = bodySchema.parse(request.body);
            // Obtém o usuário logado a partir do token JWT
            const user = request.user;
            if (!user) {
                return reply.code(401).send({ message: 'Usuário não autenticado.' });
            }
            // Busca os dados do usuário no banco para ter nome, senha, etc
            const userId = user.userId || user.id;
            // Verificar se o usuário já tem uma igreja criada (via createdByUserId)
            const existingChurch = await prisma.church.findFirst({
                where: {
                    createdByUserId: userId,
                },
                include: {
                    Branch: true,
                },
            });
            // Se já existe uma igreja criada por esse usuário, retornar ela em vez de criar nova
            if (existingChurch) {
                // Verificar se existe Branch principal
                let mainBranch = existingChurch.Branch?.find(b => b.isMainBranch)
                    || existingChurch.Branch?.[0];
                // Se não tem Branch, criar
                if (!mainBranch) {
                    mainBranch = await prisma.branch.create({
                        data: {
                            name: data.branchName || 'Sede',
                            churchId: existingChurch.id,
                            isMainBranch: true,
                        },
                    });
                }
                // Buscar member associado se existir
                let existingMember = await prisma.member.findFirst({
                    where: {
                        userId: userId,
                    },
                    include: {
                        Branch: {
                            include: {
                                Church: true,
                            },
                        },
                    },
                });
                // Se não tem Member, criar
                if (!existingMember) {
                    const dbUser = await this.service.getUserData(userId);
                    if (dbUser) {
                        const { getUserFullName } = await import('../utils/userUtils');
                        const { Role } = await import('@prisma/client');
                        const { ALL_PERMISSION_TYPES } = await import('../constants/permissions');
                        const newMember = await prisma.member.create({
                            data: {
                                name: getUserFullName(dbUser),
                                email: dbUser.email,
                                role: Role.ADMINGERAL,
                                branchId: mainBranch.id,
                                userId: dbUser.id,
                            },
                            include: {
                                Branch: {
                                    include: {
                                        Church: true,
                                    },
                                },
                            },
                        });
                        existingMember = newMember;
                        // Criar permissões
                        await prisma.permission.createMany({
                            data: ALL_PERMISSION_TYPES.map((type) => ({
                                memberId: newMember.id,
                                type,
                            })),
                            skipDuplicates: true,
                        });
                    }
                }
                // Gerar token atualizado se Member existe
                let newToken = null;
                if (existingMember) {
                    const userWithMember = await prisma.user.findUnique({
                        where: { id: userId },
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
                        const onboardingCompleted = await this.progressService.isCompleted(userId);
                        const tokenPayload = {
                            sub: userWithMember.id,
                            email: userWithMember.email,
                            name: userWithMember.firstName && userWithMember.lastName
                                ? `${userWithMember.firstName} ${userWithMember.lastName}`.trim()
                                : userWithMember.firstName || userWithMember.lastName || 'Usuário',
                            type: 'member',
                            memberId: member.id,
                            role: member.role,
                            branchId: member.branchId,
                            churchId: member.Branch?.Church?.id || null,
                            permissions: member.Permission.map(p => p.type),
                            onboardingCompleted,
                        };
                        newToken = request.server.jwt.sign(tokenPayload, { expiresIn: '7d' });
                    }
                }
                return reply.code(200).send({
                    church: {
                        id: existingChurch.id,
                        name: existingChurch.name,
                        logoUrl: existingChurch.logoUrl,
                        avatarUrl: existingChurch.avatarUrl,
                        isActive: existingChurch.isActive,
                    },
                    branch: mainBranch,
                    member: existingMember,
                    token: newToken,
                    existing: true, // Flag para indicar que é igreja existente
                });
            }
            // Verificar se o usuário já tem uma igreja através do Member
            const existingMember = await prisma.member.findFirst({
                where: {
                    userId: userId,
                },
                include: {
                    Branch: {
                        include: {
                            Church: true,
                        },
                    },
                },
            });
            if (existingMember?.Branch?.Church) {
                return reply.code(400).send({
                    message: 'Você já possui uma igreja. Use a rota de atualização para modificar os dados.',
                    churchId: existingMember.Branch.Church.id,
                });
            }
            const dbUser = await this.service.getUserData(userId);
            if (!dbUser) {
                return reply.code(401).send({ message: 'Usuário não encontrado.' });
            }
            // Converter null para undefined para avatarUrl
            const churchData = {
                ...data,
                avatarUrl: data.avatarUrl ?? undefined
            };
            const result = await this.service.createChurchWithMainBranch(churchData, dbUser);
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
                    const onboardingCompleted = await this.progressService.isCompleted(dbUser.id);
                    const tokenPayload = {
                        sub: userWithMember.id,
                        email: userWithMember.email,
                        name: userWithMember.firstName && userWithMember.lastName
                            ? `${userWithMember.firstName} ${userWithMember.lastName}`.trim()
                            : userWithMember.firstName || userWithMember.lastName || 'Usuário',
                        type: 'member',
                        memberId: member.id,
                        role: member.role,
                        branchId: member.branchId,
                        churchId: member.Branch?.Church?.id || null,
                        permissions: member.Permission.map(p => p.type),
                        onboardingCompleted,
                    };
                    newToken = request.server.jwt.sign(tokenPayload, { expiresIn: '7d' });
                }
            }
            // Log de auditoria
            await AuditLogger.churchCreated(request, result.church.id, result.church.name);
            return reply.code(201).send({
                church: {
                    id: result.church.id,
                    name: result.church.name,
                    logoUrl: result.church.logoUrl,
                    avatarUrl: result.church.avatarUrl,
                    isActive: result.church.isActive,
                },
                branch: result.branch,
                member: result.member,
                token: newToken, // Retorna o novo token (pode ser null se não criou member)
            });
        }
        catch (error) {
            // Trata erros de validação Zod
            if (error.name === 'ZodError' || error.issues) {
                return reply.code(400).send({
                    message: 'Dados inválidos',
                    errors: error.errors || error.issues
                });
            }
            // Outros erros
            console.error('Erro ao criar igreja:', error);
            return reply.code(500).send({
                message: error.message || 'Erro ao criar igreja'
            });
        }
    }
    async getAll(request, reply) {
        try {
            // Obtém o branchId e userId do usuário do token (se disponível)
            const user = request.user;
            const userBranchId = user?.branchId || null;
            const userId = user?.userId || user?.id || null;
            const churches = await this.service.getAllChurches(userBranchId, userId);
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
        try {
            const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
            const church = await this.service.getChurchById(id);
            if (!church) {
                return reply.code(404).send({ message: 'Igreja não encontrada.' });
            }
            return reply.send(church);
        }
        catch (error) {
            if (error.name === 'ZodError' || error.issues) {
                return reply.code(400).send({
                    message: 'ID inválido',
                    errors: error.errors || error.issues
                });
            }
            return reply.code(500).send({ message: error.message || 'Erro ao buscar igreja' });
        }
    }
    async update(request, reply) {
        try {
            const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
            const data = z
                .object({
                name: z.string().optional(),
                logoUrl: z.string().url().optional(),
                avatarUrl: z.string().nullable().optional(),
                address: z.string().optional(),
                phone: z.string().optional(),
                email: z.string().email().optional(),
                website: z.string().url().optional(),
                socialMedia: z.object({
                    facebook: z.string().url().optional(),
                    instagram: z.string().url().optional(),
                    youtube: z.string().url().optional(),
                    twitter: z.string().url().optional(),
                }).optional(),
                withBranch: z.boolean().optional(),
                branchName: z.string().optional(),
                pastorName: z.string().optional(),
            })
                .parse(request.body);
            const user = request.user;
            if (!user) {
                return reply.code(401).send({ message: 'Usuário não autenticado.' });
            }
            // Verifica se a igreja existe e se o usuário é o criador (para permitir edição durante onboarding)
            const church = await prisma.church.findUnique({
                where: { id },
                select: { createdByUserId: true },
            });
            if (!church) {
                return reply.code(404).send({ message: 'Igreja não encontrada.' });
            }
            // Permite edição se o usuário é o criador da igreja (durante onboarding)
            const isCreator = church.createdByUserId === user.userId || church.createdByUserId === user.id;
            // Verifica se o usuário tem permissão church_manage ou é ADMINGERAL/ADMINFILIAL
            const hasPermission = user.permissions?.includes('church_manage');
            const hasRole = user.role === 'ADMINGERAL' || user.role === 'ADMINFILIAL';
            if (!isCreator && !hasPermission && !hasRole) {
                return reply.code(403).send({
                    message: 'Você não tem permissão para editar a igreja.',
                });
            }
            // Verifica se o usuário pertence à igreja (apenas se não for o criador)
            if (!isCreator && user.branchId) {
                const branch = await prisma.branch.findUnique({
                    where: { id: user.branchId },
                });
                if (!branch || branch.churchId !== id) {
                    // Se não for da mesma igreja, verifica se é ADMINGERAL
                    if (user.role !== 'ADMINGERAL') {
                        return reply.code(403).send({
                            message: 'Você só pode editar sua própria igreja.',
                        });
                    }
                }
            }
            // Converter null para undefined e garantir que name existe
            const updateData = {
                ...data,
            };
            if (data.name !== undefined) {
                updateData.name = data.name;
            }
            if (data.avatarUrl !== undefined) {
                updateData.avatarUrl = data.avatarUrl ?? undefined;
            }
            const updatedChurch = await this.service.updateChurch(id, updateData);
            // Verificar e criar Branch/Member se necessário
            const userId = user.userId || user.id;
            if (userId) {
                // Buscar igreja com branches
                const churchWithBranches = await prisma.church.findUnique({
                    where: { id },
                    include: {
                        Branch: true,
                    },
                });
                // Verificar se existe Branch principal
                let mainBranch = churchWithBranches?.Branch?.find(b => b.isMainBranch)
                    || churchWithBranches?.Branch?.[0];
                // Se não tem Branch, criar
                if (!mainBranch && churchWithBranches) {
                    mainBranch = await prisma.branch.create({
                        data: {
                            name: data.branchName || 'Sede',
                            churchId: id,
                            isMainBranch: true,
                        },
                    });
                }
                // Verificar se existe Member
                let existingMember = await prisma.member.findFirst({
                    where: {
                        userId: userId,
                    },
                    include: {
                        Branch: {
                            include: {
                                Church: true,
                            },
                        },
                    },
                });
                // Se não tem Member e tem Branch, criar
                if (!existingMember && mainBranch) {
                    const dbUser = await this.service.getUserData(userId);
                    if (dbUser) {
                        const { getUserFullName } = await import('../utils/userUtils');
                        const { Role } = await import('@prisma/client');
                        const { ALL_PERMISSION_TYPES } = await import('../constants/permissions');
                        const newMember = await prisma.member.create({
                            data: {
                                name: getUserFullName(dbUser),
                                email: dbUser.email,
                                role: Role.ADMINGERAL,
                                branchId: mainBranch.id,
                                userId: dbUser.id,
                            },
                            include: {
                                Branch: {
                                    include: {
                                        Church: true,
                                    },
                                },
                            },
                        });
                        existingMember = newMember;
                        // Criar permissões
                        await prisma.permission.createMany({
                            data: ALL_PERMISSION_TYPES.map((type) => ({
                                memberId: newMember.id,
                                type,
                            })),
                            skipDuplicates: true,
                        });
                    }
                }
                // Buscar User com Member atualizado para gerar token
                const userWithMember = await prisma.user.findUnique({
                    where: { id: userId },
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
                    const onboardingCompleted = await this.progressService.isCompleted(userId);
                    const tokenPayload = {
                        sub: userWithMember.id,
                        email: userWithMember.email,
                        name: userWithMember.firstName && userWithMember.lastName
                            ? `${userWithMember.firstName} ${userWithMember.lastName}`.trim()
                            : userWithMember.firstName || userWithMember.lastName || 'Usuário',
                        type: 'member',
                        memberId: member.id,
                        role: member.role,
                        branchId: member.branchId,
                        churchId: member.Branch?.Church?.id || null,
                        permissions: member.Permission.map(p => p.type),
                        onboardingCompleted,
                    };
                    const newToken = request.server.jwt.sign(tokenPayload, { expiresIn: '7d' });
                    return reply.send({
                        ...updatedChurch,
                        token: newToken,
                    });
                }
            }
            return reply.send(updatedChurch);
        }
        catch (error) {
            // Trata erro do Prisma quando a igreja não existe
            if (error.code === 'P2025' || error.message?.includes('Record to update not found')) {
                return reply.code(404).send({ message: 'Igreja não encontrada.' });
            }
            // Trata erros de validação Zod
            if (error.name === 'ZodError' || error.issues) {
                return reply.code(400).send({
                    message: 'Dados inválidos',
                    errors: error.errors || error.issues
                });
            }
            return reply.code(500).send({ message: error.message || 'Erro ao atualizar igreja' });
        }
    }
    async delete(request, reply) {
        try {
            const { id } = request.params;
            const user = request.user;
            if (!user || !user.memberId) {
                return reply.status(401).send({ error: 'Autenticação necessária' });
            }
            // Verificar se a igreja existe PRIMEIRO (antes de buscar o membro)
            const church = await this.service.getChurchById(id);
            if (!church) {
                return reply.status(404).send({ error: 'Igreja não encontrada.' });
            }
            // Buscar dados do membro para verificar role e churchId
            const member = await getMemberFromUserId(user.userId || user.id);
            if (!member) {
                return reply.status(404).send({ error: 'Membro não encontrado' });
            }
            // Verificar se o membro tem Branch associada
            if (!member.Branch) {
                return reply.status(400).send({ error: 'Membro não está associado a uma filial.' });
            }
            // Apenas ADMINGERAL pode deletar igrejas
            if (member.role !== 'ADMINGERAL') {
                return reply.status(403).send({ error: 'Apenas Administradores Gerais podem deletar igrejas.' });
            }
            // Verificar se a igreja pertence ao membro
            if (member.Branch.churchId !== id) {
                return reply.status(403).send({ error: 'Você só pode deletar sua própria igreja.' });
            }
            await this.service.deleteChurch(id);
            return reply.status(200).send({ message: 'Igreja deletada com sucesso.' });
        }
        catch (error) {
            // Trata erro do Prisma quando a igreja não existe
            if (error.code === 'P2025' || error.message?.includes('Record to delete does not exist') || error.message?.includes('Record to update not found')) {
                return reply.status(404).send({ error: 'Igreja não encontrada.' });
            }
            return reply.status(500).send({ error: error.message || 'Erro ao deletar igreja' });
        }
    }
    async deactivate(request, reply) {
        try {
            const { id } = request.params;
            const user = request.user;
            if (!user || !user.memberId) {
                return reply.status(401).send({ error: 'Autenticação necessária' });
            }
            // Verificar se a igreja existe PRIMEIRO (antes de buscar o membro)
            const church = await this.service.getChurchById(id);
            if (!church) {
                return reply.status(404).send({ error: 'Igreja não encontrada.' });
            }
            // Buscar dados do membro para verificar role e churchId
            const member = await getMemberFromUserId(user.userId || user.id);
            if (!member) {
                return reply.status(404).send({ error: 'Membro não encontrado' });
            }
            // Verificar se o membro tem Branch associada
            if (!member.Branch) {
                return reply.status(400).send({ error: 'Membro não está associado a uma filial.' });
            }
            // Apenas ADMINGERAL pode desativar igrejas
            if (member.role !== 'ADMINGERAL') {
                return reply.status(403).send({ error: 'Apenas Administradores Gerais podem desativar igrejas.' });
            }
            // Verificar se a igreja pertence ao membro
            if (member.Branch.churchId !== id) {
                return reply.status(403).send({ error: 'Você só pode desativar sua própria igreja.' });
            }
            const updatedChurch = await this.service.deactivateChurch(id);
            if (!updatedChurch) {
                return reply.status(404).send({ error: 'Igreja não encontrada.' });
            }
            return reply.status(200).send(updatedChurch);
        }
        catch (error) {
            // Trata erro do Prisma quando a igreja não existe
            if (error.code === 'P2025' || error.message?.includes('Record to update not found')) {
                return reply.status(404).send({ error: 'Igreja não encontrada.' });
            }
            return reply.status(500).send({ error: error.message || 'Erro ao desativar igreja' });
        }
    }
}
