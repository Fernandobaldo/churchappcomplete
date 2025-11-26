import { prisma } from '../lib/prisma';
export async function getAllUsers() {
    return prisma.user.findMany({
        include: {
            subscriptions: {
                include: { plan: true }
            }
        }
    });
}
export async function getAllChurches() {
    return prisma.church.findMany({
        include: {
            branches: true
        }
    });
}
export async function getAllSubscriptions() {
    return prisma.subscription.findMany({
        include: {
            user: true,
            plan: true
        }
    });
}
export async function getDashboardOverview() {
    const totalUsers = await prisma.user.count();
    const totalChurches = await prisma.church.count();
    const plans = await prisma.plan.findMany({
        include: { subscriptions: true }
    });
    return {
        totalUsers,
        totalChurches,
        plans: plans.map(p => ({
            name: p.name,
            subscribers: p.subscriptions.length
        }))
    };
}
export async function updateUserRole(userId, role) {
    return prisma.user.update({
        where: { id: userId },
        data: { role }
    });
}
export async function deleteUser(userId) {
    await prisma.subscription.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
}
export async function updateSubscriptionPlan(subscriptionId, planId) {
    return prisma.subscription.update({
        where: { id: subscriptionId },
        data: { planId }
    });
}
export async function updateSubscriptionStatus(subscriptionId, status) {
    return prisma.subscription.update({
        where: { id: subscriptionId },
        data: { status }
    });
}
export async function deleteChurch(churchId) {
    await prisma.branch.deleteMany({ where: { churchId } });
    await prisma.church.delete({ where: { id: churchId } });
}
