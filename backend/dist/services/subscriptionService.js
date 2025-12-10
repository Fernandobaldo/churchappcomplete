import { prisma } from '../lib/prisma';
import { SubscriptionStatus } from '@prisma/client';
export async function getMySubscription(userId) {
    return prisma.subscription.findFirst({
        where: { userId, status: SubscriptionStatus.active },
        include: { Plan: true }
    });
}
export async function listAllSubscriptions() {
    return prisma.subscription.findMany({
        include: { User: true, Plan: true }
    });
}
export async function changePlan(userId, planId) {
    // Opcional: encerrar assinaturas anteriores
    await prisma.subscription.updateMany({
        where: { userId, status: SubscriptionStatus.active },
        data: { status: SubscriptionStatus.canceled, endsAt: new Date() }
    });
    return prisma.subscription.create({
        data: {
            userId,
            planId,
            status: SubscriptionStatus.active
        }
    });
}
