import { prisma } from '../lib/prisma';

type CreateBranchInput = {
  name: string;
  pastorName: string;
  churchId: string;
};

export async function createBranch(data: CreateBranchInput) {
  return prisma.branch.create({ data });
}

export async function getAllBranches() {
  return prisma.branch.findMany();
}

export async function getBranchById(id: string) {
  return prisma.branch.findUnique({ where: { id } });
}

export async function deleteBranchById(id: string) {
  return prisma.branch.delete({ where: { id } });
}
