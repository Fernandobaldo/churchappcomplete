import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

export async function validateCredentials(email: string, password: string) {
  const user = await prisma.member.findUnique({
    where: { email },
    include: { permissions: true },
  })

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return null
  }

  return user
}
