import { prisma } from '../../lib/prisma'

export async function getAllPermissionsService() {
  return prisma.permission.findMany({
    select: { type: true },
    distinct: ['type'],
  })
}

export async function assignPermissionsService(memberId: string, permissions: string[]) {
  const result = await prisma.permission.createMany({
    data: permissions.map((type) => ({ memberId, type })),
    skipDuplicates: true,
  })

  return {
    success: true,
    added: result.count,
  }
}
