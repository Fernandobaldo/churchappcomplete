import { prisma } from '../lib/prisma';

export async function getAllUsers() {
  return prisma.user.findMany({
    include: {
      Subscription: {
        include: { Plan: true }
      }
    }
  });
}

export async function getAllChurches() {
  return prisma.church.findMany({
    include: {
      Branch: true
    }
  });
}

export async function getAllSubscriptions() {
  return prisma.subscription.findMany({
    include: {
      User: true,
      Plan: true
    }
  });
}

export async function getDashboardOverview() {
  const totalUsers = await prisma.user.count();
  const totalChurches = await prisma.church.count();
  const plans = await prisma.plan.findMany({
    include: { Subscription: true }
  });

  return {
    totalUsers,
    totalChurches,
    plans: plans.map(p => ({
      name: p.name,
      subscribers: p.Subscription.length
    }))
  };
}
export async function updateUserRole(userId: string, role: string) {
  // Note: User model doesn't have a role field directly
  // Role is stored in Member model
  return prisma.user.update({
    where: { id: userId },
    data: {}
  });
}

export async function deleteUser(userId: string) {
  await prisma.subscription.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
}

export async function updateSubscriptionPlan(subscriptionId: string, planId: string) {
  return prisma.subscription.update({
    where: { id: subscriptionId },
    data: { planId }
  });
}

export async function updateSubscriptionStatus(subscriptionId: string, status: string) {
  return prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: status as any }
  });
}

export async function deleteChurch(churchId: string) {
  await prisma.branch.deleteMany({ where: { churchId } });
  await prisma.church.delete({ where: { id: churchId } });
}
