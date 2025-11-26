// src/services/public/publicRegisterService.ts
import { prisma } from '../../lib/prisma'
import bcrypt from 'bcryptjs'
import { env } from '../../env'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

// Garante que as variáveis de ambiente estão carregadas
dotenv.config()
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: '.env.test' })
}

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

  // Busca o plano gratuito (tenta diferentes variações do nome)
  let freePlan = await prisma.plan.findFirst({ where: { name: 'free' } })
  if (!freePlan) {
    freePlan = await prisma.plan.findFirst({ where: { name: 'Free' } })
  }
  if (!freePlan) {
    freePlan = await prisma.plan.findFirst({ where: { name: 'Free Plan' } })
  }
  if (!freePlan) {
    throw new Error('Plano gratuito não encontrado. Execute o seed do banco de dados.')
  }

  // Cria o usuário e associa o plano
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      Subscription: {
        create: {
          planId: freePlan.id,
          status: 'active',
        },
      },
    },
  })

  // Gera o token JWT com type: 'user' (sem Member ainda)
  // Omite campos de Member (não inclui no payload) quando não há Member associado
  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      type: 'user' as const,
      // Não inclui memberId, role, branchId, churchId quando não há Member
      // Isso indica que o onboarding não foi completado
      permissions: [],
    },
    env.JWT_SECRET,
    {
      expiresIn: '7d',
    }
  )

  return { user, token }
}
