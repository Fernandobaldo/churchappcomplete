import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'
import dotenv from 'dotenv'
dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET || 'secret_dev_key'

export class AuthService {
  async validateCredentials(email: string, password: string) {
    const user = await prisma.member.findUnique({
      where: { email },
      include: { permissions: true },
    })

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return null
    }

    return user
  }

  async login(email: string, password: string) {
    const user = await this.validateCredentials(email, password)
    if (!user) throw new Error('Credenciais inválidas')

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        permissions: user.permissions.map((p) => p.type),
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return { token, user }
  }
}
