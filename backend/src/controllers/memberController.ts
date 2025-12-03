import { FastifyReply, FastifyRequest } from 'fastify'
import { memberIdParamSchema, updateMemberBodySchema, updateMemberRoleBodySchema } from '../schemas/memberSchemas'
import { findAllMembers, findMemberById, formatDate, updateMember, updateMemberRole } from '../services/memberService'
import { parse } from 'date-fns'
import { getMemberFromUserId, validateMemberEditPermission, validateRoleChangePermission, validatePositionChangePermission, hasAccess } from '../utils/authorization'
import { AuditLogger } from '../utils/auditHelper'
import { Role } from '@prisma/client'

export async function getAllMembers(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = request.user

    if (!user || !user.memberId) {
      return reply.status(401).send({ error: 'Autenticação necessária' })
    }

    // Buscar dados completos do membro para obter churchId
    const currentMember = await getMemberFromUserId(user.userId)
    if (!currentMember) {
      return reply.status(404).send({ error: 'Membro não encontrado' })
    }

    if (!currentMember.Branch) {
      return reply.status(404).send({ error: 'Filial do membro não encontrada' })
    }

    const churchId = currentMember.Branch.churchId
    const branchId = user.branchId || currentMember.branchId
    const userRole = user.role || currentMember.role
    const memberId = user.memberId || currentMember.id

    // Verifica se o usuário tem permissão members_manage para ver dados sensíveis
    // getMemberFromUserId já inclui Permission
    const hasManagePermission = hasAccess(
      { role: currentMember.role, Permission: currentMember.Permission || [] },
      'members_manage'
    )

    const members = await findAllMembers(branchId, churchId, userRole, memberId, hasManagePermission)
    return reply.send(members)
  } catch (error: any) {
    return reply.status(500).send({ error: error.message })
  }
}

export async function getMemberById(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = memberIdParamSchema.parse(request.params)
    const user = request.user

    if (!user || !user.memberId) {
      return reply.status(401).send({ error: 'Autenticação necessária' })
    }

    // Busca inicial apenas para verificar se o membro existe e obter branch
    // Não precisa de permissões neste ponto
    const member = await findMemberById(id, false, false)
    if (!member) {
      return reply.code(404).send({ message: 'Membro não encontrado' })
    }

    // Buscar dados completos do membro atual
    const currentMember = await getMemberFromUserId(user.userId)
    if (!currentMember) {
      return reply.status(404).send({ error: 'Membro atual não encontrado' })
    }

    if (!currentMember.Branch) {
      return reply.status(404).send({ error: 'Filial do membro atual não encontrada' })
    }

    if (!member.branch) {
      return reply.status(404).send({ error: 'Filial do membro não encontrada' })
    }

    // ADMINGERAL pode ver qualquer membro da igreja
    if (currentMember.role === 'ADMINGERAL') {
      if (member.branch.churchId !== currentMember.Branch.churchId) {
        return reply.status(403).send({ error: 'Você só pode visualizar membros da sua igreja' })
      }
    }
    // ADMINFILIAL, COORDINATOR e MEMBER podem ver membros da sua filial
    else if (currentMember.role === 'ADMINFILIAL' || currentMember.role === 'COORDINATOR' || currentMember.role === 'MEMBER') {
      if (member.branchId !== currentMember.branchId) {
        return reply.status(403).send({ error: 'Você só pode visualizar membros da sua filial' })
      }
    }

    // Verifica se o usuário tem permissão members_manage para ver dados sensíveis
    // getMemberFromUserId já inclui Permission
    const hasManagePermission = hasAccess(
      { role: currentMember.role, Permission: currentMember.Permission || [] },
      'members_manage'
    )
    
    // Verifica se o usuário pode ver permissões:
    // - Se é o próprio perfil (id === currentMember.id)
    // - Se tem permissão para gerenciar permissões (MANAGE_PERMISSIONS ou permission_manage)
    // - Se é ADMINGERAL ou ADMINFILIAL
    const isOwnProfile = id === currentMember.id
    const canManagePermissions = hasAccess(
      { role: currentMember.role, Permission: currentMember.Permission || [] },
      'MANAGE_PERMISSIONS'
    ) || hasAccess(
      { role: currentMember.role, Permission: currentMember.Permission || [] },
      'permission_manage'
    ) || currentMember.role === 'ADMINGERAL' || currentMember.role === 'ADMINFILIAL'
    
    const canViewPermissions = isOwnProfile || canManagePermissions
    
    const memberData = await findMemberById(id, hasManagePermission, canViewPermissions)

    if (!memberData) {
      return reply.code(404).send({ message: 'Membro não encontrado' })
    }

    console.log(`[PERMISSIONS DEBUG] getMemberById retornando dados para ${id}:`, {
      hasPermissions: !!memberData.permissions,
      permissionsCount: memberData.permissions?.length || 0,
      permissions: memberData.permissions,
      memberDataKeys: Object.keys(memberData),
      memberDataFull: JSON.stringify(memberData, null, 2)
    })

    // Garante que as permissões sempre sejam incluídas na resposta
    const responseData = {
      ...memberData,
      permissions: memberData.permissions || [], // Garante que permissions sempre exista
      birthDate: formatDate(memberData.birthDate),
    }

    console.log(`[PERMISSIONS DEBUG] Dados que serão enviados na resposta:`, {
      hasPermissions: !!responseData.permissions,
      permissionsCount: responseData.permissions?.length || 0,
      permissions: responseData.permissions,
      responseKeys: Object.keys(responseData)
    })

    return reply.send(responseData)
  } catch (error: any) {
    return reply.status(500).send({ error: error.message })
  }
}

export async function getMyProfile(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user
  if (!user) {
    return reply.status(401).send({ message: 'Usuário não autenticado.' })
  }
  
  // Se o usuário não tem memberId, significa que não tem membro associado
  if (!user.memberId) {
    return reply.status(404).send({ message: 'Membro não encontrado' })
  }
  
  // Para o próprio perfil, sempre incluir dados sensíveis (email, phone, address)
  // e sempre incluir permissões (canViewPermissions = true porque é o próprio perfil)
  const member = await findMemberById(user.memberId, true, true)

  if (!member) {
    return reply.code(404).send({ message: 'Membro não encontrado' })
  }

  console.log('[CONTROLLER DEBUG] ========== DADOS DO findMemberById ==========')
  console.log('[CONTROLLER DEBUG] member.positionId:', member.positionId)
  console.log('[CONTROLLER DEBUG] member.positionId (type):', typeof member.positionId)
  console.log('[CONTROLLER DEBUG] member.position:', JSON.stringify(member.position, null, 2))
  console.log('[CONTROLLER DEBUG] member.position (type):', typeof member.position)
  console.log('[CONTROLLER DEBUG] hasPositionId:', 'positionId' in member)
  console.log('[CONTROLLER DEBUG] hasPosition:', 'position' in member)
  console.log('[CONTROLLER DEBUG] member keys:', Object.keys(member))
  console.log('[CONTROLLER DEBUG] ============================================')

  // Garante que todos os campos estejam presentes, especialmente positionId e position
  // Para o próprio perfil, sempre retorna todas as informações, incluindo permissões
  const response: any = {
    id: member.id,
    name: member.name,
    email: member.email ?? null,
    phone: member.phone ?? null,
    address: member.address ?? null,
    birthDate: formatDate(member.birthDate),
    avatarUrl: member.avatarUrl ?? null,
    role: member.role,
    branchId: member.branchId,
    positionId: member.positionId ?? null,
    position: member.position ?? null,
    permissions: member.permissions ?? [], // Membro pode ver suas próprias permissões
    branch: member.branch ?? null,
  }
  
  console.log('[RESPONSE DEBUG] ========== OBJETO DE RESPOSTA FINAL ==========')
  console.log('[RESPONSE DEBUG] response.positionId:', response.positionId)
  console.log('[RESPONSE DEBUG] response.positionId (type):', typeof response.positionId)
  console.log('[RESPONSE DEBUG] response.position:', JSON.stringify(response.position, null, 2))
  console.log('[RESPONSE DEBUG] response keys:', Object.keys(response))
  console.log('[RESPONSE DEBUG] JSON completo da resposta:', JSON.stringify(response, null, 2))
  console.log('[RESPONSE DEBUG] ==============================================')

  console.log('[FINAL DEBUG] ========== ANTES DE ENVIAR AO CLIENTE ==========')
  console.log('[FINAL DEBUG] response.positionId:', response.positionId)
  console.log('[FINAL DEBUG] response.position:', response.position)
  console.log('[FINAL DEBUG] Verificando se positionId existe:', 'positionId' in response)
  console.log('[FINAL DEBUG] Verificando se position existe:', 'position' in response)
  console.log('[FINAL DEBUG] ===============================================')
  
  // Garantir que a resposta seja serializada corretamente
  // Fastify pode remover campos undefined, então garantimos que tudo seja null ou valor válido
  const finalResponse = JSON.parse(JSON.stringify(response))
  
  console.log('[SENT DEBUG] ========== RESPOSTA FINAL SERIALIZADA ==========')
  console.log('[SENT DEBUG] finalResponse.positionId:', finalResponse.positionId)
  console.log('[SENT DEBUG] finalResponse.position:', finalResponse.position)
  console.log('[SENT DEBUG] finalResponse keys:', Object.keys(finalResponse))
  console.log('[SENT DEBUG] JSON da resposta final:', JSON.stringify(finalResponse, null, 2))
  console.log('[SENT DEBUG] ===============================================')
  
  // Enviar resposta
  return reply.send(finalResponse)
}

export async function updateMemberById(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = memberIdParamSchema.parse(request.params)
    const body = updateMemberBodySchema.parse(request.body)
    const user = request.user

    if (!user || !user.memberId) {
      return reply.status(401).send({ error: 'Autenticação necessária' })
    }

    // Validar permissão de edição
    await validateMemberEditPermission(user.memberId, id)

    // Buscar dados completos do membro atual para verificar permissões
    const currentMember = await getMemberFromUserId(user.userId)
    if (!currentMember) {
      return reply.status(404).send({ error: 'Membro atual não encontrado' })
    }

    const dataToUpdate: any = {}

    // Processar apenas campos que foram fornecidos e não estão vazios
    if (body.name !== undefined && body.name !== '') {
      dataToUpdate.name = body.name
    }
    
    // Email não pode ser alterado pelo próprio usuário
    // Apenas administradores podem alterar o email de outros membros
    if (body.email !== undefined && body.email !== '') {
      const isOwnProfile = id === user.memberId
      if (isOwnProfile) {
        return reply.status(403).send({ 
          error: 'Você não pode alterar seu próprio email. Entre em contato com um administrador.' 
        })
      }
      dataToUpdate.email = body.email
    }

    // Data de nascimento: se for null, remover; se for string válida, atualizar
    if (body.birthDate !== undefined) {
      if (body.birthDate === null || body.birthDate === '') {
        dataToUpdate.birthDate = null
      } else {
        const parsedDate = parse(body.birthDate, 'dd/MM/yyyy', new Date())
        if (isNaN(parsedDate.getTime())) {
          return reply.status(400).send({ message: 'Data de nascimento inválida.' })
        }
        dataToUpdate.birthDate = parsedDate
      }
    }

    // Campos opcionais podem ser null ou undefined
    if (body.phone !== undefined) {
      dataToUpdate.phone = body.phone === '' ? null : body.phone
    }
    
    if (body.address !== undefined) {
      dataToUpdate.address = body.address === '' ? null : body.address
    }
    
    if (body.avatarUrl !== undefined) {
      dataToUpdate.avatarUrl = body.avatarUrl === '' ? null : body.avatarUrl
    }
    
    // Validar permissão para alterar cargo (positionId)
    if (body.positionId !== undefined) {
      try {
        await validatePositionChangePermission(
          user.memberId,
          id,
          currentMember.role,
          currentMember.Permission || []
        )
        dataToUpdate.positionId = body.positionId === '' ? null : body.positionId
      } catch (error: any) {
        return reply.status(403).send({ error: error.message })
      }
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return reply.status(400).send({ message: 'Nenhum dado para atualizar.' })
    }

    const updated = await updateMember(id, dataToUpdate)

    // Log de auditoria
    await AuditLogger.memberUpdated(request, id, dataToUpdate)

    // Formatar resposta com data formatada
    // Garante que positionId e position estejam sempre presentes
    // IMPORTANTE: Campos null devem ser mantidos como null (não undefined)
    // Sempre incluir campos opcionais, mesmo que sejam null
    const response: any = {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      birthDate: formatDate(updated.birthDate), // formatDate retorna string ou null
    }
    
    // Sempre incluir campos opcionais explicitamente, garantindo que null seja mantido
    // Não usar spread para esses campos para garantir que sempre existam
    // Usar Object.prototype.hasOwnProperty para verificar se a propriedade existe
    response.phone = Object.prototype.hasOwnProperty.call(updated, 'phone') ? updated.phone : null
    response.address = Object.prototype.hasOwnProperty.call(updated, 'address') ? updated.address : null
    response.avatarUrl = Object.prototype.hasOwnProperty.call(updated, 'avatarUrl') ? updated.avatarUrl : null
    response.positionId = Object.prototype.hasOwnProperty.call(updated, 'positionId') ? updated.positionId : null
    response.position = updated.Position ? { id: updated.Position.id, name: updated.Position.name } : null
    
    // Remove Position do objeto (já foi mapeado para position)
    delete (response as any).Position
    
    console.log('[UPDATE MEMBER DEBUG] Resposta formatada:', {
      phone: response.phone,
      address: response.address,
      birthDate: response.birthDate,
      phoneType: typeof response.phone,
      addressType: typeof response.address,
    })
    
    console.log('[UPDATE MEMBER DEBUG] Resposta após atualização:', {
      id: response.id,
      positionId: response.positionId,
      position: response.position,
    })
    
    // Garantir que a resposta seja serializada corretamente
    // Fastify pode remover campos undefined, então garantimos que tudo seja null ou valor válido
    const finalResponse = JSON.parse(JSON.stringify(response))
    
    return reply.send(finalResponse)
  } catch (error: any) {
    // Erros de permissão/autorização
    if (error.message?.includes('permissão') || 
        error.message?.includes('não pode') ||
        error.message?.includes('só pode') ||
        error.message?.includes('Apenas') ||
        error.message?.includes('Você não pode') ||
        error.message?.includes('Você só pode')) {
      return reply.status(403).send({ error: error.message })
    }
    
    // Erro quando membro não encontrado (do validateMemberEditPermission ou do Prisma)
    if (error.code === 'P2025' || 
        error.message?.includes('Record to update not found') ||
        error.message?.includes('Membro alvo não encontrado') ||
        error.message?.includes('Membro editor não encontrado') ||
        error.message?.includes('não encontrado')) {
      return reply.status(404).send({ error: 'Membro não encontrado' })
    }
    
    // Erro de validação do Zod
    if (error.name === 'ZodError') {
      return reply.status(400).send({ error: 'Dados inválidos', details: error.errors })
    }
    
    return reply.status(500).send({ error: error.message || 'Erro ao atualizar membro' })
  }
}

export async function updateMemberRoleById(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = memberIdParamSchema.parse(request.params)
    const { role } = updateMemberRoleBodySchema.parse(request.body)
    const user = request.user

    if (!user || !user.memberId) {
      return reply.status(401).send({ error: 'Autenticação necessária' })
    }

    // Validar permissão para alterar role
    await validateRoleChangePermission(user.memberId, id, role as Role)

    // Atualizar role e permissões
    const updated = await updateMemberRole(id, role as Role)

    // Log de auditoria
    await AuditLogger.memberUpdated(request, id, { role })

    return reply.send(updated)
  } catch (error: any) {
    console.error('[updateMemberRoleById] Erro ao atualizar role:', {
      error: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name,
    })

    // Erros de permissão/autorização
    if (error.message?.includes('permissão') || 
        error.message?.includes('não pode') ||
        error.message?.includes('só pode') ||
        error.message?.includes('Apenas') ||
        error.message?.includes('Você não pode') ||
        error.message?.includes('Você só pode')) {
      return reply.status(403).send({ error: error.message })
    }
    
    // Erro quando membro não encontrado
    if (error.code === 'P2025' || 
        error.message?.includes('Record to update not found') ||
        error.message?.includes('Membro alvo não encontrado') ||
        error.message?.includes('Membro editor não encontrado') ||
        error.message?.includes('não encontrado') ||
        error.message?.includes('Membro não encontrado')) {
      return reply.status(404).send({ error: 'Membro não encontrado' })
    }
    
    // Erro de validação do Zod
    if (error.name === 'ZodError') {
      return reply.status(400).send({ error: 'Dados inválidos', details: error.errors })
    }
    
    // Erros do Prisma
    if (error.code && error.code.startsWith('P')) {
      console.error('[updateMemberRoleById] Erro do Prisma:', error)
      return reply.status(500).send({ 
        error: 'Erro ao atualizar role do membro',
        details: error.message 
      })
    }
    
    return reply.status(500).send({ 
      error: error.message || 'Erro ao atualizar role do membro',
      details: error.stack 
    })
  }
}
