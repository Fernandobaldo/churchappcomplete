import { adminAuthenticate } from '../middlewares/adminAuthenticate';
import { requireAdminRole } from '../middlewares/adminAuthorize';
import { getDashboardStatsHandler, getAllUsersHandler, getUserByIdHandler, blockUserHandler, unblockUserHandler, sendPasswordResetHandler, impersonateUserHandler, getAllChurchesHandler, getChurchByIdHandler, getChurchBranchesHandler, getChurchMembersHandler, suspendChurchHandler, reactivateChurchHandler, changeChurchPlanHandler, impersonateChurchOwnerHandler, getAllMembersHandler, getMemberByIdHandler, getAllPlansHandler, getPlanByIdHandler, createPlanHandler, updatePlanHandler, activatePlanHandler, deactivatePlanHandler, getAllSubscriptionsHandler, getSubscriptionByIdHandler, getSubscriptionHistoryHandler, changeSubscriptionPlanHandler, updateSubscriptionStatusHandler, cancelSubscriptionHandler, reactivateSubscriptionHandler, getAuditLogsHandler, getSystemConfigHandler, updateSystemConfigHandler, } from '../controllers/adminController';
export async function adminRoutes(app) {
    // ==================== DASHBOARD ====================
    app.get('/admin/dashboard/stats', {
        preHandler: [adminAuthenticate],
        handler: getDashboardStatsHandler,
    });
    // ==================== USERS ====================
    app.get('/admin/users', {
        preHandler: [
            adminAuthenticate,
            requireAdminRole(['SUPERADMIN', 'SUPPORT']),
        ],
        handler: getAllUsersHandler,
    });
    app.get('/admin/users/:id', {
        preHandler: [
            adminAuthenticate,
            requireAdminRole(['SUPERADMIN', 'SUPPORT']),
        ],
        handler: getUserByIdHandler,
    });
    app.patch('/admin/users/:id/block', {
        preHandler: [adminAuthenticate, requireAdminRole(['SUPERADMIN'])],
        handler: blockUserHandler,
    });
    app.patch('/admin/users/:id/unblock', {
        preHandler: [adminAuthenticate, requireAdminRole(['SUPERADMIN'])],
        handler: unblockUserHandler,
    });
    app.post('/admin/users/:id/reset-password', {
        preHandler: [
            adminAuthenticate,
            requireAdminRole(['SUPERADMIN', 'SUPPORT']),
        ],
        handler: sendPasswordResetHandler,
    });
    app.post('/admin/users/:id/impersonate', {
        preHandler: [
            adminAuthenticate,
            requireAdminRole(['SUPERADMIN', 'SUPPORT']),
        ],
        handler: impersonateUserHandler,
    });
    // ==================== CHURCHES ====================
    app.get('/admin/churches', {
        preHandler: [
            adminAuthenticate,
            requireAdminRole(['SUPERADMIN', 'SUPPORT']),
        ],
        handler: getAllChurchesHandler,
    });
    app.get('/admin/churches/:id', {
        preHandler: [
            adminAuthenticate,
            requireAdminRole(['SUPERADMIN', 'SUPPORT']),
        ],
        handler: getChurchByIdHandler,
    });
    app.get('/admin/churches/:id/branches', {
        preHandler: [
            adminAuthenticate,
            requireAdminRole(['SUPERADMIN', 'SUPPORT']),
        ],
        handler: getChurchBranchesHandler,
    });
    app.get('/admin/churches/:id/members', {
        preHandler: [
            adminAuthenticate,
            requireAdminRole(['SUPERADMIN', 'SUPPORT']),
        ],
        handler: getChurchMembersHandler,
    });
    app.patch('/admin/churches/:id/suspend', {
        preHandler: [adminAuthenticate, requireAdminRole(['SUPERADMIN'])],
        handler: suspendChurchHandler,
    });
    app.patch('/admin/churches/:id/reactivate', {
        preHandler: [adminAuthenticate, requireAdminRole(['SUPERADMIN'])],
        handler: reactivateChurchHandler,
    });
    app.patch('/admin/churches/:id/plan', {
        preHandler: [
            adminAuthenticate,
            requireAdminRole(['SUPERADMIN', 'FINANCE']),
        ],
        handler: changeChurchPlanHandler,
    });
    app.post('/admin/churches/:id/impersonate', {
        preHandler: [
            adminAuthenticate,
            requireAdminRole(['SUPERADMIN', 'SUPPORT']),
        ],
        handler: impersonateChurchOwnerHandler,
    });
    // ==================== MEMBERS ====================
    app.get('/admin/members', {
        preHandler: [
            adminAuthenticate,
            requireAdminRole(['SUPERADMIN', 'SUPPORT']),
        ],
        handler: getAllMembersHandler,
    });
    app.get('/admin/members/:id', {
        preHandler: [
            adminAuthenticate,
            requireAdminRole(['SUPERADMIN', 'SUPPORT']),
        ],
        handler: getMemberByIdHandler,
    });
    // ==================== PLANS ====================
    app.get('/admin/plans', {
        preHandler: [adminAuthenticate],
        handler: getAllPlansHandler,
    });
    app.get('/admin/plans/:id', {
        preHandler: [adminAuthenticate],
        handler: getPlanByIdHandler,
    });
    app.post('/admin/plans', {
        preHandler: [adminAuthenticate, requireAdminRole(['SUPERADMIN'])],
        handler: createPlanHandler,
    });
    app.patch('/admin/plans/:id', {
        preHandler: [adminAuthenticate, requireAdminRole(['SUPERADMIN'])],
        handler: updatePlanHandler,
    });
    app.patch('/admin/plans/:id/activate', {
        preHandler: [adminAuthenticate, requireAdminRole(['SUPERADMIN'])],
        handler: activatePlanHandler,
    });
    app.patch('/admin/plans/:id/deactivate', {
        preHandler: [adminAuthenticate, requireAdminRole(['SUPERADMIN'])],
        handler: deactivatePlanHandler,
    });
    // ==================== SUBSCRIPTIONS ====================
    app.get('/admin/subscriptions', {
        preHandler: [
            adminAuthenticate,
            requireAdminRole(['SUPERADMIN', 'FINANCE']),
        ],
        handler: getAllSubscriptionsHandler,
    });
    app.get('/admin/subscriptions/:id', {
        preHandler: [
            adminAuthenticate,
            requireAdminRole(['SUPERADMIN', 'FINANCE']),
        ],
        handler: getSubscriptionByIdHandler,
    });
    app.get('/admin/subscriptions/:id/history', {
        preHandler: [
            adminAuthenticate,
            requireAdminRole(['SUPERADMIN', 'FINANCE']),
        ],
        handler: getSubscriptionHistoryHandler,
    });
    app.patch('/admin/subscriptions/:id/plan', {
        preHandler: [
            adminAuthenticate,
            requireAdminRole(['SUPERADMIN', 'FINANCE']),
        ],
        handler: changeSubscriptionPlanHandler,
    });
    app.patch('/admin/subscriptions/:id/status', {
        preHandler: [
            adminAuthenticate,
            requireAdminRole(['SUPERADMIN', 'FINANCE']),
        ],
        handler: updateSubscriptionStatusHandler,
    });
    app.patch('/admin/subscriptions/:id/cancel', {
        preHandler: [
            adminAuthenticate,
            requireAdminRole(['SUPERADMIN', 'FINANCE']),
        ],
        handler: cancelSubscriptionHandler,
    });
    app.patch('/admin/subscriptions/:id/reactivate', {
        preHandler: [
            adminAuthenticate,
            requireAdminRole(['SUPERADMIN', 'FINANCE']),
        ],
        handler: reactivateSubscriptionHandler,
    });
    // ==================== CONFIG ====================
    app.get('/admin/config', {
        preHandler: [adminAuthenticate, requireAdminRole(['SUPERADMIN'])],
        handler: getSystemConfigHandler,
    });
    app.patch('/admin/config', {
        preHandler: [adminAuthenticate, requireAdminRole(['SUPERADMIN'])],
        handler: updateSystemConfigHandler,
    });
    // ==================== AUDIT ====================
    app.get('/admin/audit', {
        preHandler: [adminAuthenticate, requireAdminRole(['SUPERADMIN'])],
        handler: getAuditLogsHandler,
    });
}
