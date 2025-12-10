import { ServiceScheduleService } from '../services/serviceScheduleService';
import { createServiceScheduleSchema, updateServiceScheduleSchema, serviceScheduleParamsSchema, branchIdParamsSchema, createEventsSchema, deleteServiceScheduleSchema, } from '../schemas/serviceScheduleSchemas';
import { getMemberFromUserId } from '../utils/authorization';
import { logAudit } from '../utils/auditHelper';
import { AuditAction } from '@prisma/client';
export class ServiceScheduleController {
    constructor() {
        this.service = new ServiceScheduleService();
    }
    async create(request, reply) {
        try {
            const user = request.user;
            if (!user?.branchId) {
                return reply.status(400).send({
                    message: 'Usuário não está associado a uma filial.',
                });
            }
            // Usa o branchId do usuário se não for fornecido no body
            const bodyData = createServiceScheduleSchema.body.parse(request.body);
            if (!user) {
                return reply.status(401).send({ message: 'Usuário não autenticado.' });
            }
            const finalBranchId = bodyData.branchId || user.branchId;
            if (!finalBranchId) {
                return reply.status(400).send({
                    message: 'Filial não especificada. Usuário não está associado a uma filial.',
                });
            }
            // Verifica se o branchId existe
            const { prisma } = await import('../lib/prisma');
            const targetBranch = await prisma.branch.findUnique({
                where: { id: finalBranchId },
            });
            if (!targetBranch) {
                return reply.status(404).send({
                    message: 'Filial não encontrada.',
                });
            }
            const data = {
                ...bodyData,
                branchId: finalBranchId,
            };
            // Verifica se o branchId do usuário existe (se estiver usando o branchId do usuário)
            if (data.branchId === user.branchId) {
                const userBranch = await prisma.branch.findUnique({
                    where: { id: user.branchId },
                });
                if (!userBranch) {
                    return reply.status(400).send({
                        message: 'Sua filial não foi encontrada no sistema. Entre em contato com o administrador.',
                    });
                }
            }
            else {
                // Se estiver tentando criar para outra filial, verifica permissões
                // Verifica se o usuário é ADMINGERAL e pertence à mesma igreja
                const member = await getMemberFromUserId(user.userId || user.id);
                if (!member || member.role !== 'ADMINGERAL') {
                    return reply.status(403).send({
                        message: 'Você só pode criar horários para sua própria filial.',
                    });
                }
                // Verifica se as filiais pertencem à mesma igreja
                const userBranch = await prisma.branch.findUnique({
                    where: { id: user.branchId },
                });
                if (!userBranch || userBranch.churchId !== targetBranch.churchId) {
                    return reply.status(403).send({
                        message: 'Você só pode criar horários para filiais da sua igreja.',
                    });
                }
            }
            const schedule = await this.service.create(data);
            await logAudit(request, AuditAction.SERVICE_SCHEDULE_CREATED, 'ServiceSchedule', `Horário de culto '${schedule.title}' criado para a filial ${user.branchId}`, {
                entityId: schedule.id,
                metadata: {
                    scheduleTitle: schedule.title,
                    branchId: user.branchId,
                    dayOfWeek: schedule.dayOfWeek,
                    time: schedule.time,
                },
            });
            // Se autoCreateEvents estiver ativado, cria os eventos automaticamente
            if (schedule.autoCreateEvents) {
                try {
                    const eventsResult = await this.service.createEventsFromSchedule(schedule.id, undefined, // startDate - usa hoje como padrão
                    undefined, // endDate - usa autoCreateDaysAhead
                    schedule.autoCreateDaysAhead ?? undefined);
                }
                catch (error) {
                    // Log do erro mas não falha a criação do horário
                    console.error('⚠️ Erro ao criar eventos automaticamente:', error.message);
                }
            }
            return reply.status(201).send(schedule);
        }
        catch (error) {
            if (error.name === 'ZodError' || error.issues) {
                return reply.status(400).send({
                    message: 'Dados inválidos',
                    errors: error.errors || error.issues,
                });
            }
            // Trata erro de chave estrangeira
            if (error.code === 'P2003') {
                const constraint = error.meta?.constraint || '';
                if (constraint.includes('branchId')) {
                    return reply.status(400).send({
                        message: 'Filial não encontrada. Verifique se a filial existe no sistema.',
                        details: `branchId fornecido pode não existir no banco de dados.`,
                    });
                }
                return reply.status(400).send({
                    message: 'Erro de validação: referência inválida.',
                });
            }
            console.error('Erro ao criar horário de culto:', error);
            return reply.status(500).send({
                message: error.message || 'Erro ao criar horário de culto',
            });
        }
    }
    async getByBranch(request, reply) {
        try {
            const { branchId } = branchIdParamsSchema.params.parse(request.params);
            const user = request.user;
            if (!user?.branchId) {
                return reply.status(400).send({
                    message: 'Usuário não está associado a uma filial.',
                });
            }
            // Verifica se o usuário tem acesso à filial
            if (branchId !== user.branchId) {
                const member = await getMemberFromUserId(user.userId || user.id);
                if (!member || member.role !== 'ADMINGERAL') {
                    return reply.status(403).send({
                        message: 'Você só pode visualizar horários da sua própria filial.',
                    });
                }
                // Verifica se as filiais pertencem à mesma igreja
                const { prisma } = await import('../lib/prisma');
                const userBranch = await prisma.branch.findUnique({
                    where: { id: user.branchId },
                });
                const targetBranch = await prisma.branch.findUnique({
                    where: { id: branchId },
                });
                if (!userBranch || !targetBranch || userBranch.churchId !== targetBranch.churchId) {
                    return reply.status(403).send({
                        message: 'Você só pode visualizar horários de filiais da sua igreja.',
                    });
                }
            }
            const schedules = await this.service.getByBranchId(branchId);
            return reply.send(schedules);
        }
        catch (error) {
            if (error.name === 'ZodError' || error.issues) {
                return reply.status(400).send({
                    message: 'ID inválido',
                    errors: error.errors || error.issues,
                });
            }
            console.error('Erro ao buscar horários de culto:', error);
            return reply.status(500).send({
                message: error.message || 'Erro ao buscar horários de culto',
            });
        }
    }
    async getById(request, reply) {
        try {
            const { id } = serviceScheduleParamsSchema.params.parse(request.params);
            const schedule = await this.service.getById(id);
            if (!schedule) {
                return reply.status(404).send({
                    message: 'Horário não encontrado.',
                });
            }
            // Verifica se o usuário tem acesso
            const user = request.user;
            if (!user) {
                return reply.status(401).send({ message: 'Usuário não autenticado.' });
            }
            if (schedule.branchId !== user.branchId) {
                const member = await getMemberFromUserId(user.userId || user.id);
                if (!member || member.role !== 'ADMINGERAL') {
                    return reply.status(403).send({
                        message: 'Você não tem permissão para visualizar este horário.',
                    });
                }
            }
            return reply.send(schedule);
        }
        catch (error) {
            if (error.name === 'ZodError' || error.issues) {
                return reply.status(400).send({
                    message: 'ID inválido',
                    errors: error.errors || error.issues,
                });
            }
            console.error('Erro ao buscar horário de culto:', error);
            return reply.status(500).send({
                message: error.message || 'Erro ao buscar horário de culto',
            });
        }
    }
    async update(request, reply) {
        try {
            const { id } = serviceScheduleParamsSchema.params.parse(request.params);
            const data = updateServiceScheduleSchema.body.parse(request.body);
            const schedule = await this.service.getById(id);
            if (!schedule) {
                return reply.status(404).send({
                    message: 'Horário não encontrado.',
                });
            }
            // Verifica se o usuário tem acesso
            const user = request.user;
            if (!user) {
                return reply.status(401).send({ message: 'Usuário não autenticado.' });
            }
            if (schedule.branchId !== user.branchId) {
                const member = await getMemberFromUserId(user.userId || user.id);
                if (!member || member.role !== 'ADMINGERAL') {
                    return reply.status(403).send({
                        message: 'Você não tem permissão para editar este horário.',
                    });
                }
            }
            const { updated: updatedSchedule, old: oldSchedule } = await this.service.update(id, data);
            // Atualiza eventos relacionados ANTES de criar novos eventos
            let updatedEventsCount = 0;
            try {
                // Verifica se algum campo relevante foi alterado (title, time, description, location)
                const hasRelevantChanges = (data.title !== undefined && data.title !== oldSchedule.title) ||
                    (data.time !== undefined && data.time !== oldSchedule.time) ||
                    (data.description !== undefined && data.description !== oldSchedule.description) ||
                    (data.location !== undefined && data.location !== oldSchedule.location);
                if (hasRelevantChanges) {
                    updatedEventsCount = await this.service.updateRelatedEvents({
                        title: oldSchedule.title,
                        time: oldSchedule.time,
                        branchId: oldSchedule.branchId,
                    }, {
                        title: updatedSchedule.title,
                        time: updatedSchedule.time,
                        description: updatedSchedule.description,
                        location: updatedSchedule.location,
                    });
                    if (updatedEventsCount > 0) {
                        await logAudit(request, AuditAction.SERVICE_SCHEDULE_UPDATED, 'ServiceSchedule', `${updatedEventsCount} evento(s) atualizado(s) junto com o horário '${updatedSchedule.title}'`, {
                            entityId: updatedSchedule.id,
                            metadata: {
                                scheduleTitle: updatedSchedule.title,
                                branchId: user.branchId,
                                updatedEventsCount,
                                changes: data,
                            },
                        });
                    }
                }
            }
            catch (error) {
                // Log do erro mas não falha a atualização do horário
                console.error('⚠️ Erro ao atualizar eventos relacionados:', error.message);
            }
            if (!user) {
                return reply.status(401).send({ message: 'Usuário não autenticado.' });
            }
            await logAudit(request, AuditAction.SERVICE_SCHEDULE_UPDATED, 'ServiceSchedule', `Horário de culto '${updatedSchedule.title}' atualizado para a filial ${user.branchId}`, {
                entityId: updatedSchedule.id,
                metadata: {
                    scheduleTitle: updatedSchedule.title,
                    branchId: user.branchId,
                    changes: data,
                    updatedEventsCount,
                },
            });
            // Se autoCreateEvents foi ativado ou atualizado, cria os eventos automaticamente
            // Verifica se foi ativado agora (antes era false e agora é true)
            const wasAutoCreateEnabled = oldSchedule.autoCreateEvents === false && updatedSchedule.autoCreateEvents === true;
            const isAutoCreateEnabled = updatedSchedule.autoCreateEvents === true;
            if (isAutoCreateEnabled && (wasAutoCreateEnabled || data.autoCreateEvents === true)) {
                try {
                    const eventsResult = await this.service.createEventsFromSchedule(updatedSchedule.id, undefined, // startDate - usa hoje como padrão
                    undefined, // endDate - usa autoCreateDaysAhead
                    updatedSchedule.autoCreateDaysAhead ?? undefined);
                }
                catch (error) {
                    // Log do erro mas não falha a atualização do horário
                    console.error('⚠️ Erro ao criar eventos automaticamente:', error.message);
                }
            }
            return reply.send({
                ...updatedSchedule,
                updatedEventsCount,
            });
        }
        catch (error) {
            if (error.code === 'P2025' || error.message?.includes('Record to update not found')) {
                return reply.status(404).send({
                    message: 'Horário não encontrado.',
                });
            }
            if (error.name === 'ZodError' || error.issues) {
                return reply.status(400).send({
                    message: 'Dados inválidos',
                    errors: error.errors || error.issues,
                });
            }
            console.error('Erro ao atualizar horário de culto:', error);
            return reply.status(500).send({
                message: error.message || 'Erro ao atualizar horário de culto',
            });
        }
    }
    async getRelatedEventsCount(request, reply) {
        try {
            const { id } = serviceScheduleParamsSchema.params.parse(request.params);
            const schedule = await this.service.getById(id);
            if (!schedule) {
                return reply.status(404).send({
                    message: 'Horário não encontrado.',
                });
            }
            // Verifica se o usuário tem acesso
            const user = request.user;
            if (!user) {
                return reply.status(401).send({ message: 'Usuário não autenticado.' });
            }
            if (schedule.branchId !== user.branchId) {
                const member = await getMemberFromUserId(user.userId || user.id);
                if (!member || member.role !== 'ADMINGERAL') {
                    return reply.status(403).send({
                        message: 'Você não tem permissão para visualizar este horário.',
                    });
                }
            }
            const count = await this.service.countRelatedEvents(id);
            return reply.send({
                count,
                scheduleTitle: schedule.title,
            });
        }
        catch (error) {
            if (error.name === 'ZodError' || error.issues) {
                return reply.status(400).send({
                    message: 'ID inválido',
                    errors: error.errors || error.issues,
                });
            }
            console.error('Erro ao contar eventos relacionados:', error);
            return reply.status(500).send({
                message: error.message || 'Erro ao contar eventos relacionados',
            });
        }
    }
    async delete(request, reply) {
        try {
            const { id } = serviceScheduleParamsSchema.params.parse(request.params);
            const body = deleteServiceScheduleSchema.body.parse(request.body || {});
            const { deleteEvents = false } = body;
            const schedule = await this.service.getById(id);
            if (!schedule) {
                return reply.status(404).send({
                    message: 'Horário não encontrado.',
                });
            }
            // Verifica se o usuário tem acesso
            const user = request.user;
            if (!user) {
                return reply.status(401).send({ message: 'Usuário não autenticado.' });
            }
            if (schedule.branchId !== user.branchId) {
                const member = await getMemberFromUserId(user.userId || user.id);
                if (!member || member.role !== 'ADMINGERAL') {
                    return reply.status(403).send({
                        message: 'Você não tem permissão para deletar este horário.',
                    });
                }
            }
            // Conta eventos relacionados antes de deletar
            const eventsCount = await this.service.countRelatedEvents(id);
            // Se deleteEvents for true, deleta os eventos relacionados
            let deletedEventsCount = 0;
            if (deleteEvents && eventsCount > 0) {
                deletedEventsCount = await this.service.deleteRelatedEvents(id);
                await logAudit(request, AuditAction.EVENTS_DELETED_FROM_SCHEDULE, 'ServiceSchedule', `${deletedEventsCount} eventos deletados junto com o horário '${schedule.title}'`, {
                    entityId: id,
                    metadata: {
                        scheduleTitle: schedule.title,
                        branchId: user.branchId,
                        deletedEventsCount,
                    },
                });
            }
            // Deleta o horário
            await this.service.delete(id);
            await logAudit(request, AuditAction.SERVICE_SCHEDULE_DELETED, 'ServiceSchedule', `Horário de culto '${schedule.title}' deletado da filial ${user.branchId}`, {
                entityId: id,
                metadata: {
                    scheduleTitle: schedule.title,
                    branchId: user.branchId,
                    deletedEventsCount,
                },
            });
            return reply.status(200).send({
                message: 'Horário deletado com sucesso.',
                deletedEventsCount: deleteEvents ? deletedEventsCount : 0,
                relatedEventsCount: eventsCount,
            });
        }
        catch (error) {
            if (error.code === 'P2025' || error.message?.includes('Record to delete does not exist')) {
                return reply.status(404).send({
                    message: 'Horário não encontrado.',
                });
            }
            if (error.name === 'ZodError' || error.issues) {
                return reply.status(400).send({
                    message: 'Dados inválidos',
                    errors: error.errors || error.issues,
                });
            }
            console.error('Erro ao deletar horário de culto:', error);
            return reply.status(500).send({
                message: error.message || 'Erro ao deletar horário de culto',
            });
        }
    }
    async setDefault(request, reply) {
        try {
            const { id } = serviceScheduleParamsSchema.params.parse(request.params);
            const schedule = await this.service.getById(id);
            if (!schedule) {
                return reply.status(404).send({
                    message: 'Horário não encontrado.',
                });
            }
            // Verifica se o usuário tem acesso
            const user = request.user;
            if (schedule.branchId !== user?.branchId) {
                const member = await getMemberFromUserId(user?.userId || user?.id || '');
                if (!member || member.role !== 'ADMINGERAL') {
                    return reply.status(403).send({
                        message: 'Você não tem permissão para definir este horário como padrão.',
                    });
                }
            }
            const updated = await this.service.setAsDefault(id, schedule.branchId);
            return reply.send(updated);
        }
        catch (error) {
            if (error.code === 'P2025' || error.message?.includes('Record to update not found')) {
                return reply.status(404).send({
                    message: 'Horário não encontrado.',
                });
            }
            if (error.name === 'ZodError' || error.issues) {
                return reply.status(400).send({
                    message: 'ID inválido',
                    errors: error.errors || error.issues,
                });
            }
            console.error('Erro ao definir horário como padrão:', error);
            return reply.status(500).send({
                message: error.message || 'Erro ao definir horário como padrão',
            });
        }
    }
    async createEvents(request, reply) {
        try {
            const { id } = serviceScheduleParamsSchema.params.parse(request.params);
            const body = createEventsSchema.body.parse(request.body);
            const schedule = await this.service.getById(id);
            if (!schedule) {
                return reply.status(404).send({
                    message: 'Horário não encontrado.',
                });
            }
            // Verifica se o usuário tem acesso
            const user = request.user;
            if (schedule.branchId !== user?.branchId) {
                const member = await getMemberFromUserId(user?.userId || user?.id || '');
                if (!member || member.role !== 'ADMINGERAL') {
                    return reply.status(403).send({
                        message: 'Você não tem permissão para criar eventos a partir deste horário.',
                    });
                }
            }
            const result = await this.service.createEventsFromSchedule(id, body.startDate, body.endDate, body.daysAhead);
            return reply.status(201).send(result);
        }
        catch (error) {
            if (error.name === 'ZodError' || error.issues) {
                return reply.status(400).send({
                    message: 'Dados inválidos',
                    errors: error.errors || error.issues,
                });
            }
            console.error('Erro ao criar eventos a partir do horário:', error);
            return reply.status(500).send({
                message: error.message || 'Erro ao criar eventos',
            });
        }
    }
}
