// src/routes/public/register.ts
import { FastifyInstance } from 'fastify'
import { publicRegisterController } from '../../controllers/public/publicRegisterController'
import { registerController } from '../../controllers/auth/registerController'

export async function publicRegisterRoute(app: FastifyInstance) {
  app.post('/register', {
    schema: {
      description: `
Registro público para novos usuários na landing page.

Cria um User e associa automaticamente ao plano Free.

**Fluxo**:
1. Cria User no sistema
2. Cria Subscription com plano Free
3. Retorna token JWT para login imediato

**Nota**: Este endpoint não requer autenticação e é usado apenas para registro inicial.
      `,
      tags: ['Autenticação'],
      summary: 'Registro público (landing page)',
      body: {
        type: 'object',
        required: ['firstName', 'lastName', 'email', 'password', 'phone', 'document'],
        properties: {
          firstName: {
            type: 'string',
            description: 'Primeiro nome',
          },
          lastName: {
            type: 'string',
            description: 'Sobrenome',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Email único',
          },
          password: {
            type: 'string',
            format: 'password',
            minLength: 6,
            description: 'Senha (mínimo 6 caracteres)',
          },
          phone: {
            type: 'string',
            description: 'Telefone (obrigatório, formato livre)',
          },
          document: {
            type: 'string',
            minLength: 11,
            description: 'CPF (11 dígitos) ou CNPJ (14 dígitos) - Obrigatório',
          },
        },
      },
      response: {
        201: {
          description: 'Usuário criado com sucesso',
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                email: { type: 'string' },
              },
            },
            token: {
              type: 'string',
              description: 'Token JWT para autenticação',
            },
          },
        },
        400: {
          description: 'Erro de validação',
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, publicRegisterController)

  // Rota pública para registro via link de convite
  app.post('/register/invite', {
    schema: {
      description: `
Registro público via link de convite.

Permite que novos membros se registrem usando um link de convite gerado por um administrador.
O membro será automaticamente vinculado à filial associada ao link.

**Fluxo**:
1. Valida o token do link de convite
2. Verifica se o link está ativo e não expirou
3. Verifica limite de membros do plano
4. Cria User e Member
5. Vincula Member ao link usado
6. Envia email de boas-vindas
7. Retorna token JWT para login imediato

**Nota**: Este endpoint não requer autenticação.
      `,
      tags: ['Autenticação'],
      summary: 'Registro via link de convite',
      body: {
        type: 'object',
        required: ['name', 'email', 'password', 'inviteToken'],
        properties: {
          name: {
            type: 'string',
            description: 'Nome completo do membro',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Email único',
          },
          password: {
            type: 'string',
            format: 'password',
            minLength: 6,
            description: 'Senha (mínimo 6 caracteres)',
          },
          inviteToken: {
            type: 'string',
            description: 'Token do link de convite',
          },
          birthDate: {
            type: ['string', 'null'],
            description: 'Data de nascimento (formato ISO YYYY-MM-DD ou dd/MM/yyyy). Pode ser null ou string vazia.',
          },
          phone: {
            type: ['string', 'null'],
            description: 'Telefone. Pode ser null ou string vazia.',
          },
          address: {
            type: ['string', 'null'],
            description: 'Endereço. Pode ser null ou string vazia.',
          },
          avatarUrl: {
            type: ['string', 'null'],
            description: 'URL do avatar (após upload). Pode ser null ou string vazia. Se fornecido, deve ser uma URI válida.',
          },
        },
      },
      response: {
        201: {
          description: 'Membro registrado com sucesso',
          type: 'object',
          properties: {
            member: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string' },
                branchId: { type: 'string' },
                userId: { type: 'string' },
                inviteLinkId: { type: 'string' },
                phone: { type: ['string', 'null'] },
                address: { type: ['string', 'null'] },
                birthDate: { type: ['string', 'null'] },
                avatarUrl: { type: ['string', 'null'] },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' },
              },
              additionalProperties: true,
            },
            token: {
              type: 'string',
              description: 'Token JWT para autenticação',
            },
          },
          additionalProperties: true,
        },
        400: {
          description: 'Erro de validação',
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        403: {
          description: 'Link inválido ou limite atingido',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
        404: {
          description: 'Link não encontrado',
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, registerController)
}
