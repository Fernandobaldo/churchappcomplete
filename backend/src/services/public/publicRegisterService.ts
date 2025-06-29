// src/services/public/publicRegisterService.ts
import { prisma } from '../../lib/prisma'
import bcrypt from 'bcryptjs'
import { env } from '../../env'
import jwt from 'jsonwebtoken'

export async function publicRegisterUserService(data: {
  name: string
  email: string
  password: string
}) {
  const { name, email, password } = data

  // Verifica se o email já está em uso
  const emailAlreadyUsed = await prisma.user.findUnique({ where: { email } })
  if (emailAlreadyUsed) {
    throw new Error('Email já está em uso.')
  }

  // Criptografa a senha
  const hashedPassword = await bcrypt.hash(password, 10)

  // Busca o plano gratuito (free)
  const freePlan = await prisma.plan.findFirst({ where: { name: 'free' } })
  if (!freePlan) {
    throw new Error('Plano gratuito não encontrado.')
  }

  // Cria o usuário e associa o plano
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      subscriptions: {
        create: {
          planId: freePlan.id,
          status: 'active',
        },
      },
    },
  })

  // Gera o token JWT
  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    env.JWT_SECRET,
    {
      expiresIn: '7d',
    }
  )

  return { user, token }
}
