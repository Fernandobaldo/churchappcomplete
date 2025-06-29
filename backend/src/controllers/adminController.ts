import { FastifyRequest, FastifyReply } from 'fastify';
import {
getAllUsers,
getAllChurches,
getAllSubscriptions,
getDashboardOverview
} from '../services/adminService';

export async function getAllUsersHandler(req: FastifyRequest, reply: FastifyReply) {
  const users = await getAllUsers();
  return reply.send(users);
}

export async function getAllChurchesHandler(req: FastifyRequest, reply: FastifyReply) {
  const churches = await getAllChurches();
  return reply.send(churches);
}

export async function getAllSubscriptionsHandler(req: FastifyRequest, reply: FastifyReply) {
  const subs = await getAllSubscriptions();
  return reply.send(subs);
}

export async function getDashboardOverviewHandler(req: FastifyRequest, reply: FastifyReply) {
  const stats = await getDashboardOverview();
  return reply.send(stats);
}
export async function updateUserRoleHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const { role } = req.body as { role: string };

  const updated = await updateUserRole(id, role);
  return reply.send(updated);
}

export async function deleteUserHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  await deleteUser(id);
  return reply.status(204).send();
}

export async function updateSubscriptionPlanHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const { planId } = req.body as { planId: string };

  const updated = await updateSubscriptionPlan(id, planId);
  return reply.send(updated);
}

export async function updateSubscriptionStatusHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const { status } = req.body as { status: string };

  const updated = await updateSubscriptionStatus(id, status);
  return reply.send(updated);
}

export async function deleteChurchHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  await deleteChurch(id);
  return reply.status(204).send();
}
