import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

// Carrega .env.test se estiver em ambiente de teste
if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
  dotenv.config({ path: '.env.test' })
} else {
  dotenv.config()
}

import { prisma } from '../lib/prisma'
import { env } from '../env'
import { AdminRole } from '@prisma/client'

const JWT_SECRET = env.JWT_SECRET

export class AdminAuthService {
  /**
   * Valida credenciais de admin
   * @param email Email do admin
   * @param password Senha em texto puro
   * @returns Dados do admin se válido, erro caso contrário
   */
  async validateAdminCredentials(email: string, password: string) {
    // Busca AdminUser por email
    const admin = await prisma.adminUser.findUnique({
      where: { email },
    })

    if (!admin) {
      return { userNotFound: true }
    }

    // Verifica se está ativo
    if (!admin.isActive) {
      return { inactive: true }
    }

    // Compara senha informada com passwordHash usando bcrypt.compare()
    const passwordMatch = await bcrypt.compare(password, admin.passwordHash)

    if (!passwordMatch) {
      return { invalidPassword: true }
    }

    return { admin }
  }

  /**
   * Realiza login de admin e retorna token JWT
   * @param email Email do admin
   * @param password Senha em texto puro
   * @returns Token JWT e dados do admin (sem passwordHash)
   */
  async loginAdmin(email: string, password: string) {
    const result = await this.validateAdminCredentials(email, password)

    // Verifica se o usuário não foi encontrado
    if (result && 'userNotFound' in result && result.userNotFound) {
      throw new Error('Email não encontrado. Verifique se o email está correto.')
    }

    // Verifica se está inativo
    if (result && 'inactive' in result && result.inactive) {
      throw new Error('Conta de administrador está inativa. Entre em contato com o suporte.')
    }

    // Verifica se a senha está incorreta
    if (result && 'invalidPassword' in result && result.invalidPassword) {
      throw new Error('Senha incorreta. Verifique sua senha e tente novamente.')
    }

    // Se result não é um objeto válido com admin, lança erro genérico
    if (!result || !('admin' in result) || !result.admin) {
      throw new Error('Credenciais inválidas')
    }

    const { admin } = result

    // Atualiza lastLoginAt
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    })

    // Monta payload do token JWT
    const tokenPayload = {
      sub: admin.id,
      adminUserId: admin.id,
      adminRole: admin.adminRole,
      email: admin.email,
      name: admin.name,
      type: 'admin' as const,
    }

    // Gera token JWT
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' })

    // Registra ADMIN_LOGIN em AuditLog
    await prisma.auditLog.create({
      data: {
        action: 'ADMIN_LOGIN',
        entityType: 'AdminUser',
        entityId: admin.id,
        userId: admin.id,
        userEmail: admin.email,
        userRole: admin.adminRole,
        description: `Admin ${admin.email} fez login`,
        adminUserId: admin.id,
      },
    })

    // Retorna token e dados do admin (sem passwordHash)
    return {
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        adminRole: admin.adminRole,
        isActive: admin.isActive,
        lastLoginAt: admin.lastLoginAt,
        createdAt: admin.createdAt,
      },
    }
  }

  /**
   * Renova token de admin (opcional)
   * @param token Token atual
   * @returns Novo token JWT
   */
  async refreshAdminToken(token: string) {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as {
        adminUserId?: string
        adminRole?: AdminRole
        email?: string
        name?: string
      }

      if (!payload.adminUserId) {
        throw new Error('Token inválido')
      }

      // Busca admin para verificar se ainda está ativo
      const admin = await prisma.adminUser.findUnique({
        where: { id: payload.adminUserId },
      })

      if (!admin || !admin.isActive) {
        throw new Error('Admin não encontrado ou inativo')
      }

      // Gera novo token
      const newTokenPayload = {
        sub: admin.id,
        adminUserId: admin.id,
        adminRole: admin.adminRole,
        email: admin.email,
        name: admin.name,
        type: 'admin' as const,
      }

      return {
        token: jwt.sign(newTokenPayload, JWT_SECRET, { expiresIn: '7d' }),
      }
    } catch (error) {
      throw new Error('Token inválido ou expirado')
    }
  }
}

