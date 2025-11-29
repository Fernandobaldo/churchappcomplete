import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import {
  generateInviteLink,
  getActiveLinksByBranch,
  getAllLinksByBranch,
  deactivateInviteLink,
  getInviteLinkByToken,
} from '../services/inviteLinkService'
import { generateQRCode } from '../services/qrCodeService'
import { generateInviteLinkPDF } from '../services/pdfService'
import { logAudit } from '../utils/auditHelper'
import { AuditAction } from '@prisma/client'

/**
 * Cria um novo link de convite
 */
export async function createInviteLinkController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const bodySchema = z.object({
    branchId: z.string().cuid(),
    maxUses: z.number().int().positive().nullable().optional(),
    expiresAt: z.string().datetime().nullable().optional(),
  })

  try {
    if (!request.user) {
      return reply.status(401).send({ error: 'Autenticação necessária' })
    }

    const bodyData = bodySchema.parse(request.body)
    const userId = request.user.userId

    let inviteLink
    try {
      inviteLink = await generateInviteLink({
        branchId: bodyData.branchId,
        createdBy: userId,
        maxUses: bodyData.maxUses ?? null,
        expiresAt: bodyData.expiresAt ? new Date(bodyData.expiresAt) : null,
      })
      console.log('✅ [INVITE LINK CONTROLLER] Link criado:', { id: inviteLink.id, token: inviteLink.token })
    } catch (error: any) {
      console.error('❌ [INVITE LINK CONTROLLER] Erro ao criar link:', error.message, error.code)
      if (error.code === 'PLAN_LIMIT_REACHED' || error.message === 'PLAN_LIMIT_REACHED') {
        return reply.status(403).send({
          error: 'PLAN_LIMIT_REACHED',
          message: 'Limite de membros do plano atingido. Faça upgrade do seu plano para criar mais links de convite.',
          code: 'PLAN_LIMIT_REACHED',
        })
      }
      throw error
    }

    // Criar objeto limpo para evitar problemas de serialização
    const responseData = {
      id: inviteLink.id,
      token: inviteLink.token,
      branchId: inviteLink.branchId,
      createdBy: inviteLink.createdBy,
      maxUses: inviteLink.maxUses,
      currentUses: inviteLink.currentUses,
      expiresAt: inviteLink.expiresAt ? inviteLink.expiresAt.toISOString() : null,
      isActive: inviteLink.isActive,
      createdAt: inviteLink.createdAt.toISOString(),
      updatedAt: inviteLink.updatedAt.toISOString(),
      Branch: inviteLink.Branch ? {
        id: inviteLink.Branch.id,
        name: inviteLink.Branch.name,
        churchId: inviteLink.Branch.churchId,
        Church: inviteLink.Branch.Church ? {
          id: inviteLink.Branch.Church.id,
          name: inviteLink.Branch.Church.name,
        } : null,
      } : null,
    }
    
    // Log de auditoria (não bloqueia a resposta)
    logAudit(
      request,
      AuditAction.INVITE_LINK_CREATED,
      'MemberInviteLink',
      `Link de convite criado para filial ${bodyData.branchId}`,
      {
        entityId: inviteLink.id,
        metadata: {
          branchId: bodyData.branchId,
          maxUses: bodyData.maxUses,
          expiresAt: bodyData.expiresAt,
        },
      }
    ).catch(err => console.error('Erro ao criar log de auditoria:', err))
    
    console.log('✅ [INVITE LINK CONTROLLER] Retornando link:', JSON.stringify(responseData, null, 2))
    return reply.status(201).send(responseData)
  } catch (error: any) {
    // Verificar se é erro de limite de plano (já tratado no try acima)
    if (error.code === 'PLAN_LIMIT_REACHED' || error.message === 'PLAN_LIMIT_REACHED') {
      return reply.status(403).send({
        error: 'PLAN_LIMIT_REACHED',
        message: 'Limite de membros do plano atingido. Faça upgrade do seu plano para criar mais links de convite.',
        code: 'PLAN_LIMIT_REACHED',
      })
    }

    if (error.name === 'ZodError') {
      return reply.status(400).send({ error: 'Dados inválidos', details: error.errors })
    }

    if (
      error.message?.includes('permissão') ||
      error.message?.includes('não pode criar') ||
      error.message?.includes('não encontrado')
    ) {
      return reply.status(403).send({ error: error.message })
    }

    if (error.message?.includes('Limite do plano')) {
      return reply.status(403).send({ 
        error: 'PLAN_LIMIT_REACHED',
        message: error.message,
        code: 'PLAN_LIMIT_REACHED',
      })
    }

    console.error('❌ Erro ao criar link de convite:', error)
    return reply.status(500).send({ error: 'Erro ao criar link de convite', details: error.message })
  }
}

/**
 * Lista links de uma filial
 */
export async function getInviteLinksByBranchController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const paramsSchema = z.object({
    branchId: z.string().cuid(),
  })

  try {
    if (!request.user) {
      return reply.status(401).send({ error: 'Autenticação necessária' })
    }

    const { branchId } = paramsSchema.parse(request.params)
    const userId = request.user.userId

    // Buscar todos os links (ativos e inativos)
    const links = await getAllLinksByBranch(branchId, userId)

    return reply.status(200).send(links)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return reply.status(400).send({ error: 'Dados inválidos', details: error.errors })
    }

    if (error.message?.includes('não encontrado') || error.message?.includes('não pode visualizar')) {
      return reply.status(403).send({ error: error.message })
    }

    console.error('❌ Erro ao listar links de convite:', error)
    return reply.status(500).send({ error: 'Erro ao listar links de convite', details: error.message })
  }
}

/**
 * Desativa um link de convite
 */
export async function deactivateInviteLinkController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const paramsSchema = z.object({
    id: z.string().cuid(),
  })

  try {
    if (!request.user) {
      return reply.status(401).send({ error: 'Autenticação necessária' })
    }

    const { id } = paramsSchema.parse(request.params)
    const userId = request.user.userId

    const deactivatedLink = await deactivateInviteLink(id, userId)

    // Log de auditoria
    await logAudit(
      request,
      AuditAction.INVITE_LINK_DEACTIVATED,
      'MemberInviteLink',
      `Link de convite desativado: ${id}`,
      {
        entityId: id,
      }
    )

    // Criar objeto limpo para evitar problemas de serialização
    const responseData = {
      id: deactivatedLink.id,
      token: deactivatedLink.token,
      branchId: deactivatedLink.branchId,
      createdBy: deactivatedLink.createdBy,
      maxUses: deactivatedLink.maxUses,
      currentUses: deactivatedLink.currentUses,
      expiresAt: deactivatedLink.expiresAt ? deactivatedLink.expiresAt.toISOString() : null,
      isActive: deactivatedLink.isActive,
      createdAt: deactivatedLink.createdAt.toISOString(),
      updatedAt: deactivatedLink.updatedAt.toISOString(),
    }
    
    return reply.status(200).send(responseData)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return reply.status(400).send({ error: 'Dados inválidos', details: error.errors })
    }

    if (error.message?.includes('não encontrado') || error.message?.includes('permissão')) {
      return reply.status(403).send({ error: error.message })
    }

    console.error('❌ Erro ao desativar link de convite:', error)
    return reply.status(500).send({ error: 'Erro ao desativar link de convite', details: error.message })
  }
}

/**
 * Retorna o QR code de um link
 */
export async function getQRCodeController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const paramsSchema = z.object({
    token: z.string(),
  })

  try {
    const { token } = paramsSchema.parse(request.params)

    const inviteLink = await getInviteLinkByToken(token)
    if (!inviteLink) {
      return reply.status(404).send({ error: 'Link de convite não encontrado' })
    }

    // Gerar URL completa do link
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    const inviteUrl = `${frontendUrl}/register/invite/${token}`

    const qrCodeBuffer = await generateQRCode(inviteUrl)

    reply.type('image/png')
    return reply.send(qrCodeBuffer)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return reply.status(400).send({ error: 'Dados inválidos', details: error.errors })
    }

    console.error('❌ Erro ao gerar QR code:', error)
    return reply.status(500).send({ error: 'Erro ao gerar QR code', details: error.message })
  }
}

/**
 * Retorna PDF com QR code do link
 */
export async function downloadPDFController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const paramsSchema = z.object({
    token: z.string(),
  })

  try {
    const { token } = paramsSchema.parse(request.params)

    const inviteLink = await getInviteLinkByToken(token)
    if (!inviteLink) {
      return reply.status(404).send({ error: 'Link de convite não encontrado' })
    }

    // Gerar URL completa do link
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    const inviteUrl = `${frontendUrl}/register/invite/${token}`

    const pdfBuffer = await generateInviteLinkPDF({
      token: inviteLink.token,
      branchName: inviteLink.Branch.name,
      churchName: inviteLink.Branch.Church.name,
      expiresAt: inviteLink.expiresAt || undefined,
      maxUses: inviteLink.maxUses || undefined,
      currentUses: inviteLink.currentUses,
      inviteUrl,
    })

    reply.header('Content-Disposition', `attachment; filename="convite-${token}.pdf"`)
    reply.type('application/pdf')
    return reply.send(pdfBuffer)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return reply.status(400).send({ error: 'Dados inválidos', details: error.errors })
    }

    console.error('❌ Erro ao gerar PDF:', error)
    return reply.status(500).send({ error: 'Erro ao gerar PDF', details: error.message })
  }
}

/**
 * Retorna informações do link (público, para validação antes do registro)
 */
export async function getInviteLinkInfoController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const paramsSchema = z.object({
    token: z.string(),
  })

  try {
    const { token } = paramsSchema.parse(request.params)

    const inviteLink = await getInviteLinkByToken(token)
    if (!inviteLink) {
      return reply.status(404).send({ error: 'Link de convite não encontrado' })
    }

    // Verificar se Branch e Church existem
    if (!inviteLink.Branch) {
      console.error('❌ [GET INVITE LINK INFO] Branch não encontrada para o link:', inviteLink.id)
      return reply.status(500).send({ error: 'Dados do link incompletos' })
    }

    if (!inviteLink.Branch.Church) {
      console.error('❌ [GET INVITE LINK INFO] Church não encontrada para a branch:', inviteLink.Branch.id)
      return reply.status(500).send({ error: 'Dados do link incompletos' })
    }

    // Retornar apenas informações públicas
    const responseData = {
      id: inviteLink.id,
      branchName: inviteLink.Branch.name,
      churchName: inviteLink.Branch.Church.name,
      expiresAt: inviteLink.expiresAt ? inviteLink.expiresAt.toISOString() : null,
      maxUses: inviteLink.maxUses,
      currentUses: inviteLink.currentUses,
      isActive: inviteLink.isActive,
    }

    console.log('✅ [GET INVITE LINK INFO] Retornando dados:', JSON.stringify(responseData, null, 2))
    return reply.status(200).send(responseData)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return reply.status(400).send({ error: 'Dados inválidos', details: error.errors })
    }

    console.error('❌ Erro ao buscar informações do link:', error)
    return reply.status(500).send({ error: 'Erro ao buscar informações do link', details: error.message })
  }
}

