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
    
    // Se não houver token e não houver branchId, trata como registro público
    // (registro público não precisa de branchId, apenas registro interno precisa)
    const isPublicRegistration = data.fromLandingPage === true || (!request.user && !data.branchId)
    
    // Se não for registro público, precisa estar autenticado
    if (!isPublicRegistration) {
      if (!request.user) {
        return reply.status(401).send({ error: 'Autenticação necessária para criar membros' })
      }

      // Adiciona o ID do usuário criador para validações
      data.creatorUserId = request.user.userId
    } else {
      // Marca explicitamente como registro público
      data.fromLandingPage = true
    }

    const result = await registerUserService(data)

    // Se for registro público, gera o token JWT
    if (isPublicRegistration) {
      try {
        // O serviço retorna { success: true, message: '...', user } para registro público
        const user = (result as any)?.user
        
        if (!user) {
          return reply.status(500).send({ 
            error: 'Erro ao processar registro: dados do usuário não encontrados' 
          })
        }
        
        const tokenPayload = {
          sub: user.id,
          email: user.email,
          name: user.name,
          type: 'user' as const,
          role: null, // Usuário não tem role (apenas membros têm)
          branchId: null, // Usuário não tem branchId (apenas membros têm)
          permissions: [], // Usuário não tem permissões (apenas membros têm)
        }
        
        if (!request.server?.jwt) {
          return reply.status(500).send({ 
            error: 'Erro ao gerar token: JWT não configurado' 
          })
        }
        
        const token = request.server.jwt.sign(tokenPayload, { expiresIn: '7d' })

        const response = {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
          token,
        }
        
        return reply.status(201).send(response)
      } catch (error: any) {
        console.error('❌ Erro ao gerar token no registro público:', error)
        return reply.status(500).send({ 
          error: 'Erro ao gerar token de autenticação',
          details: error.message 
        })
      }
    }

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
    // Verifica erros de hierarquia primeiro (antes de validação)
    const errorMsg = error.message || String(error)
    if (errorMsg.includes('Apenas o sistema pode criar um Administrador Geral') ||
        errorMsg.includes('Apenas o sistema pode criar') ||
        errorMsg.includes('não pode criar um Administrador') ||
        errorMsg.includes('Você não pode criar um Administrador Geral') ||
        errorMsg.includes('Administrador Geral') ||
        errorMsg.includes('Coordenadores só podem criar') ||
        errorMsg.includes('só pode criar membros com role')) {
      
      return reply.status(403).send({ error: errorMsg })
    }
    
    // Verifica outros erros de autorização/permissão
    if (error.message?.includes('permissão') || 
        error.message?.includes('Limite do plano') ||
        error.message?.includes('não pode criar') ||
        error.message?.includes('não pode atribuir') ||
        error.message?.includes('só pode criar membros na sua própria filial')) {
      
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
    // "Email já cadastrado" também é erro de validação
    if (error.message?.includes('obrigatório') || 
        error.message?.includes('Filial não encontrada') ||
        error.message?.includes('já cadastrado') ||
        error.message?.includes('Email já cadastrado')) {
      return reply.status(400).send({ error: error.message })
    }

    return reply.status(500).send({ error: 'Erro ao registrar usuário', details: error.message })
  }
}
