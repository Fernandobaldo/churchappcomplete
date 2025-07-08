import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'
import dotenv from 'dotenv'
dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET || 'secret_dev_key'

export class AuthService {
  async validateCredentials(email: string, password: string) {
  const member = await prisma.member.findUnique({
      where: { email },
      include: { permissions: true },
    })

    if (member && await bcrypt.compare(password, member.password)) {
      return { type: 'member', data: member }
    }

    // Tenta validar como User (Admin SaaS)
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (user && await bcrypt.compare(password, user.password)) {
      return { type: 'user', data: user }
    }

    return null
  }

 async login(email: string, password: string) {
   const result = await this.validateCredentials(email, password)
   if (!result) throw new Error('Credenciais inválidas')

   const { type, data } = result

   const token = jwt.sign(
     {
       sub: data.id,
       email: data.email,
       type,
       permissions: type === 'member' ? data.permissions?.map(p => p.type) : [],
     },
     JWT_SECRET,
     { expiresIn: '7d' }
   )
 // Remove a senha do objeto retornado
  const { password: _, ...sanitizedUser } = data

  return { token, user: sanitizedUser, type }

 }
 }