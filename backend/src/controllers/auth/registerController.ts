import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { registerUserService } from '../../services/auth/registerService'
import { AuditLogger } from '../../utils/auditHelper'

export async function registerController(request: FastifyRequest, reply: FastifyReply) {
  const bodySchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
    branchId: z.string().optional(),
    role: z.enum(['MEMBER', 'COORDINATOR', 'ADMINFILIAL', 'ADMINGERAL']).optional(),
    permissions: z.array(z.string()).optional(),
    birthDate: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    avatarUrl: z.string().url().optional(),
    fromLandingPage: z.boolean().optional(), // ← indica se é externo
  })

  try {
    const data = bodySchema.parse(request.body)
    // Se não for landing page, precisa estar autenticado
    if (!data.fromLandingPage) {
      if (!request.user) {
        return reply.status(401).send({ error: 'Autenticação necessária para criar membros' })
      }

      // Adiciona o ID do usuário criador para validações
      data.creatorUserId = request.user.userId
    }

    const result = await registerUserService(data)

    // Log de auditoria para criação de membros internos
    if (!data.fromLandingPage && result && 'id' in result) {
      await AuditLogger.memberCreated(
        request,
        result.id,
        result.email,
        result.role,
        result.branchId
      )
    }

    return reply.status(201).send(result)
  } catch (error: any) {
    // Erros de validação do Zod retornam 400
    if (error.name === 'ZodError') {
      return reply.status(400).send({ error: 'Dados inválidos', details: error.errors })
    }
    
    console.error('❌ Erro ao registrar usuário:', error)
    console.error('❌ Error name:', error.name)
    console.error('❌ Error message:', error.message)
    
    // Retorna erro 403 para erros de autorização/permissão/hierarquia
    // IMPORTANTE: Verificar erros de hierarquia PRIMEIRO (antes de outros)
    if (error.message?.includes('Apenas o sistema pode criar') ||
        error.message?.includes('não pode criar um Administrador') ||
        error.message?.includes('Você não pode criar um Administrador Geral') ||
        error.message?.includes('permissão') || 
        error.message?.includes('Limite do plano') ||
        error.message?.includes('não pode criar') ||
        error.message?.includes('não pode atribuir') ||
        error.message?.includes('só pode criar membros com role') ||
        error.message?.includes('só pode criar membros na sua própria filial') ||
        error.message?.includes('Coordenadores só podem criar')) {
      
      // Log de tentativa não autorizada
      if (error.message?.includes('permissão') || 
          error.message?.includes('não pode criar') ||
          error.message?.includes('não pode atribuir')) {
        await AuditLogger.unauthorizedAccessAttempt(
          request,
          'CREATE_MEMBER',
          error.message
        )
      }

      // Log de limite excedido
      if (error.message?.includes('Limite do plano')) {
        const limitMatch = error.message.match(/(\d+)\s*membros/)
        if (limitMatch) {
          await AuditLogger.planLimitExceeded(
            request,
            'members',
            parseInt(limitMatch[1]),
            parseInt(limitMatch[1])
          )
        }
      }

      return reply.status(403).send({ error: error.message })
    }

    // Retorna erro 400 para erros de validação
    // "Filial não encontrada" é erro de validação (branchId inválido)
    if (error.message?.includes('obrigatório') || 
        error.message?.includes('Filial não encontrada') ||
        error.message?.includes('já cadastrado')) {
      return reply.status(400).send({ error: error.message })
    }

    return reply.status(500).send({ error: 'Erro ao registrar usuário', details: error.message })
  }
}
