import { ServiceScheduleController } from '../controllers/serviceScheduleController';
import { checkPermission } from '../middlewares/checkPermission';
import { checkRole } from '../middlewares/checkRole';
import { authenticate } from '../middlewares/authenticate';
export async function serviceScheduleRoutes(app) {
    const controller = new ServiceScheduleController();
    // Todas as rotas requerem autenticação
    app.addHook('onRequest', authenticate);
    // Criar novo horário de culto
    app.post('/', {
        preHandler: [
            checkRole(['ADMINGERAL', 'ADMINFILIAL', 'COORDINATOR']),
            checkPermission(['church_manage']),
        ],
    }, controller.create.bind(controller));
    // Listar horários por filial
    app.get('/branch/:branchId', {
        preHandler: [
            checkRole(['ADMINGERAL', 'ADMINFILIAL', 'COORDINATOR', 'MEMBER']),
        ],
    }, controller.getByBranch.bind(controller));
    // Obter horário por ID
    app.get('/:id', {
        preHandler: [
            checkRole(['ADMINGERAL', 'ADMINFILIAL', 'COORDINATOR', 'MEMBER']),
        ],
    }, controller.getById.bind(controller));
    // Atualizar horário
    app.put('/:id', {
        preHandler: [
            checkRole(['ADMINGERAL', 'ADMINFILIAL', 'COORDINATOR']),
            checkPermission(['church_manage']),
        ],
    }, controller.update.bind(controller));
    // Contar eventos relacionados a um horário
    app.get('/:id/related-events-count', {
        preHandler: [
            checkRole(['ADMINGERAL', 'ADMINFILIAL', 'COORDINATOR']),
            checkPermission(['church_manage']),
        ],
    }, controller.getRelatedEventsCount.bind(controller));
    // Deletar horário
    app.delete('/:id', {
        preHandler: [
            checkRole(['ADMINGERAL', 'ADMINFILIAL', 'COORDINATOR']),
            checkPermission(['church_manage']),
        ],
    }, controller.delete.bind(controller));
    // Definir horário como padrão
    app.patch('/:id/set-default', {
        preHandler: [
            checkRole(['ADMINGERAL', 'ADMINFILIAL', 'COORDINATOR']),
            checkPermission(['church_manage']),
        ],
    }, controller.setDefault.bind(controller));
    // Criar eventos a partir do horário
    app.post('/:id/create-events', {
        preHandler: [
            checkRole(['ADMINGERAL', 'ADMINFILIAL', 'COORDINATOR']),
            checkPermission(['church_manage', 'events_manage']),
        ],
    }, controller.createEvents.bind(controller));
}
