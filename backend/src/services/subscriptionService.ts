import { prisma } from '../lib/prisma';

export async function getMySubscription(userId: string) {
  return prisma.subscription.findFirst({
    where: { userId, status: 'active' },
    include: { plan: true }
  });
}

export async function listAllSubscriptions() {
  return prisma.subscription.findMany({
    include: { user: true, plan: true }
  });
}

export async function changePlan(userId: string, planId: string) {
  // Opcional: encerrar assinaturas anteriores
  await prisma.subscription.updateMany({
    where: { userId, status: 'active' },
    data: { status: 'canceled', endsAt: new Date() }
  });

  return prisma.subscription.create({
    data: {
      userId,
      planId,
      status: 'active'
    }
  });
}
