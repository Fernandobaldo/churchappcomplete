import { getAllUsers, getAllChurches, getAllSubscriptions, getDashboardOverview } from '../services/adminService';
export async function getAllUsersHandler(req, reply) {
    const users = await getAllUsers();
    return reply.send(users);
}
export async function getAllChurchesHandler(req, reply) {
    const churches = await getAllChurches();
    return reply.send(churches);
}
export async function getAllSubscriptionsHandler(req, reply) {
    const subs = await getAllSubscriptions();
    return reply.send(subs);
}
export async function getDashboardOverviewHandler(req, reply) {
    const stats = await getDashboardOverview();
    return reply.send(stats);
}
export async function updateUserRoleHandler(req, reply) {
    const { id } = req.params;
    const { role } = req.body;
    const updated = await updateUserRole(id, role);
    return reply.send(updated);
}
export async function deleteUserHandler(req, reply) {
    const { id } = req.params;
    await deleteUser(id);
    return reply.status(204).send();
}
export async function updateSubscriptionPlanHandler(req, reply) {
    const { id } = req.params;
    const { planId } = req.body;
    const updated = await updateSubscriptionPlan(id, planId);
    return reply.send(updated);
}
export async function updateSubscriptionStatusHandler(req, reply) {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await updateSubscriptionStatus(id, status);
    return reply.send(updated);
}
export async function deleteChurchHandler(req, reply) {
    const { id } = req.params;
    await deleteChurch(id);
    return reply.status(204).send();
}
