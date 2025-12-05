import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import dotenv from 'dotenv'

// Carrega .env.test se estiver em ambiente de teste
if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
  dotenv.config({ path: '.env.test' })
} else {
  dotenv.config()
}

import { AdminAuthService } from '../services/adminAuthService'
import { adminAuthenticate } from '../middlewares/adminAuthenticate'
import { prisma } from '../lib/prisma'

export async function adminAuthRoutes(app: FastifyInstance) {
  const adminAuthService = new AdminAuthService()

  // POST /admin/auth/login - Login de administrador
  app.post('/admin/auth/login', {
    schema: {
      description: `
Autentica um administrador do SaaS e retorna um token JWT.

O token JWT contém:
- \`sub\`: ID do admin
- \`adminUserId\`: ID do admin
- \`adminRole\`: Role do admin (SUPERADMIN, SUPPORT, FINANCE)
- \`email\`: Email do admin
- \`name\`: Nome do admin
- \`type\`: "admin"

Use este token no header \`Authorization: Bearer <token>\` para acessar endpoints administrativos.
      `,
      tags: ['Admin - Autenticação'],
      summary: 'Fazer login como administrador',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'Email do administrador',
          },
          password: {
            type: 'string',
            format: 'password',
            description: 'Senha do administrador',
          },
        },
      },
      response: {
        200: {
          description: 'Login realizado com sucesso',
          type: 'object',
          properties: {
            token: {
              type: 'string',
              description: 'Token JWT para autenticação',
            },
            admin: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                adminRole: {
                  type: 'string',
                  enum: ['SUPERADMIN', 'SUPPORT', 'FINANCE'],
                },
                isActive: { type: 'boolean' },
                lastLoginAt: { type: 'string', format: 'date-time', nullable: true },
                createdAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
        401: {
          description: 'Credenciais inválidas ou conta inativa',
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
        400: {
          description: 'Erro de validação',
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const bodySchema = z.object({
      email: z.string().email('Email inválido'),
      password: z.string().min(1, 'Senha é obrigatória'),
    })

    try {
      const { email, password } = bodySchema.parse(request.body)
      const result = await adminAuthService.loginAdmin(email, password)
      return reply.send(result)
    } catch (error: any) {
      return reply.status(401).send({ message: error.message || 'Credenciais inválidas' })
    }
  })

  // POST /admin/auth/logout - Logout (opcional)
  app.post('/admin/auth/logout', {
    preHandler: [adminAuthenticate],
    schema: {
      description: `
Registra logout do administrador no AuditLog.

**Nota**: Como JWT é stateless, o logout normalmente é feito no frontend removendo o token do armazenamento (localStorage, cookies, etc.). Este endpoint serve principalmente para registrar a ação no AuditLog.
      `,
      tags: ['Admin - Autenticação'],
      summary: 'Fazer logout (registrar em log)',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'Logout registrado com sucesso',
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
        401: {
          description: 'Não autenticado',
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    if (!request.adminUser) {
      return reply.status(401).send({ message: 'Não autenticado' })
    }

    // Registra ADMIN_LOGOUT em AuditLog
    await prisma.auditLog.create({
      data: {
        action: 'ADMIN_LOGOUT',
        entityType: 'AdminUser',
        entityId: request.adminUser.id,
        userId: request.adminUser.id,
        userEmail: request.adminUser.email,
        userRole: request.adminUser.adminRole,
        description: `Admin ${request.adminUser.email} fez logout`,
        adminUserId: request.adminUser.id,
      },
    })

    return reply.send({ message: 'Logout realizado com sucesso' })
  })

  // GET /admin/auth/me - Retorna dados do admin logado
  app.get('/admin/auth/me', {
    preHandler: [adminAuthenticate],
    schema: {
      description: `
Retorna os dados do administrador autenticado (sem passwordHash).
      `,
      tags: ['Admin - Autenticação'],
      summary: 'Obter dados do admin logado',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'Dados do administrador',
          type: 'object',
          properties: {
            admin: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                adminRole: {
                  type: 'string',
                  enum: ['SUPERADMIN', 'SUPPORT', 'FINANCE'],
                },
                isActive: { type: 'boolean' },
                lastLoginAt: { type: 'string', format: 'date-time', nullable: true },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
        401: {
          description: 'Não autenticado',
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    if (!request.adminUser) {
      return reply.status(401).send({ message: 'Não autenticado' })
    }

    // Busca dados completos do admin (sem passwordHash)
    const admin = await prisma.adminUser.findUnique({
      where: { id: request.adminUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        adminRole: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!admin) {
      return reply.status(404).send({ message: 'Administrador não encontrado' })
    }

    return reply.send({ admin })
  })
}

