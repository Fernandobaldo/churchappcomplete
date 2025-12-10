import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { ChurchService } from '../services/churchService'
import { AuditLogger } from '../utils/auditHelper'
import { prisma } from '../lib/prisma'
import { getMemberFromUserId } from '../utils/authorization'

export class ChurchController {
  private service = new ChurchService()

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const bodySchema = z.object({
        name: z.string(),
        logoUrl: z.string().url().optional(),
        avatarUrl: z.string().nullable().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        website: z.string().url().optional(),
        socialMedia: z.object({
          facebook: z.string().url().optional(),
          instagram: z.string().url().optional(),
          youtube: z.string().url().optional(),
          twitter: z.string().url().optional(),
        }).optional(),
        withBranch: z.boolean().optional(),
        branchName: z.string().optional(),
        pastorName: z.string().optional(),
      })

      const data = bodySchema.parse(request.body)

      // Obtém o usuário logado a partir do token JWT
      const user = request.user
      if (!user) {
        return reply.code(401).send({ message: 'Usuário não autenticado.' })
      }

    // Busca os dados do usuário no banco para ter nome, senha, etc
    const userId = user.userId || user.id
    const dbUser = await this.service.getUserData(userId)
    if (!dbUser) {
      return reply.code(401).send({ message: 'Usuário não encontrado.' })
    }

    // Converter null para undefined para avatarUrl
    const churchData = {
      ...data,
      avatarUrl: data.avatarUrl ?? undefined
    }
    const result = await this.service.createChurchWithMainBranch(churchData, dbUser)
    
    // Busca o User com Member associado para gerar o token atualizado
    let newToken = null
    if (result.member) {
      // Busca User com Member associado (incluindo Branch e Church)
      const userWithMember = await prisma.user.findUnique({
        where: { id: dbUser.id },
        include: {
          Member: {
            include: {
              Permission: true,
              Branch: {
                include: {
                  Church: true,
                },
              },
            },
          },
        },
      })

      if (userWithMember?.Member) {
        const member = userWithMember.Member
        const tokenPayload = {
          sub: userWithMember.id,
          email: userWithMember.email,
          name: userWithMember.name,
          type: 'member' as const,
          memberId: member.id,
          role: member.role,
          branchId: member.branchId,
          churchId: member.Branch?.Church?.id || null,
          permissions: member.Permission.map(p => p.type),
        }
        
        newToken = request.server.jwt.sign(tokenPayload, { expiresIn: '7d' })
      }
    }
    
    // Log de auditoria
    await AuditLogger.churchCreated(
      request,
      result.church.id,
      result.church.name
    )
    
      return reply.code(201).send({
        church: {
          id: result.church.id,
          name: result.church.name,
          logoUrl: result.church.logoUrl,
          avatarUrl: result.church.avatarUrl,
          isActive: result.church.isActive,
        },
        branch: result.branch,
        member: result.member,
        token: newToken, // Retorna o novo token (pode ser null se não criou member)
      })
    } catch (error: any) {
      // Trata erros de validação Zod
      if (error.name === 'ZodError' || error.issues) {
        return reply.code(400).send({ 
          message: 'Dados inválidos', 
          errors: error.errors || error.issues 
        })
      }
      
      // Outros erros
      console.error('Erro ao criar igreja:', error)
      return reply.code(500).send({ 
        message: error.message || 'Erro ao criar igreja' 
      })
    }
  }

  async getAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Obtém o branchId do usuário do token (se disponível)
      const userBranchId = request.user?.branchId || null
      const churches = await this.service.getAllChurches(userBranchId)
      return reply.send(churches)
    } catch (error: any) {
      console.error('Erro ao buscar igrejas:', error)
      return reply.status(500).send({ 
        error: 'Erro ao buscar igrejas',
        message: error.message 
      })
    }
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = z.object({ id: z.string().cuid() }).parse(request.params)
      const church = await this.service.getChurchById(id)

      if (!church) {
        return reply.code(404).send({ message: 'Igreja não encontrada.' })
      }

      return reply.send(church)
    } catch (error: any) {
      if (error.name === 'ZodError' || error.issues) {
        return reply.code(400).send({ 
          message: 'ID inválido', 
          errors: error.errors || error.issues 
        })
      }
      return reply.code(500).send({ message: error.message || 'Erro ao buscar igreja' })
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = z.object({ id: z.string().cuid() }).parse(request.params)
      const data = z
        .object({
          name: z.string().optional(),
          logoUrl: z.string().url().optional(),
          avatarUrl: z.string().nullable().optional(),
          address: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().email().optional(),
          website: z.string().url().optional(),
          socialMedia: z.object({
          facebook: z.string().url().optional(),
          instagram: z.string().url().optional(),
          youtube: z.string().url().optional(),
          twitter: z.string().url().optional(),
        }).optional(),
          withBranch: z.boolean().optional(),
          branchName: z.string().optional(),
          pastorName: z.string().optional(),
        })
        .parse(request.body)

      const user = request.user
      if (!user) {
        return reply.code(401).send({ message: 'Usuário não autenticado.' })
      }

      // Verifica se o usuário tem permissão church_manage ou é ADMINGERAL/ADMINFILIAL
      const hasPermission = user.permissions?.includes('church_manage')
      const hasRole = user.role === 'ADMINGERAL' || user.role === 'ADMINFILIAL'

      if (!hasPermission && !hasRole) {
        return reply.code(403).send({
          message: 'Você não tem permissão para editar a igreja.',
        })
      }

      // Verifica se o usuário pertence à igreja
      if (user.branchId) {
        const { prisma } = await import('../lib/prisma')
        const branch = await prisma.branch.findUnique({
          where: { id: user.branchId },
        })

        if (!branch || branch.churchId !== id) {
          // Se não for da mesma igreja, verifica se é ADMINGERAL
          if (user.role !== 'ADMINGERAL') {
            return reply.code(403).send({
              message: 'Você só pode editar sua própria igreja.',
            })
          }
        }
      }

      // Converter null para undefined e garantir que name existe
      const updateData: any = {
        ...data,
      }
      if (data.name !== undefined) {
        updateData.name = data.name
      }
      if (data.avatarUrl !== undefined) {
        updateData.avatarUrl = data.avatarUrl ?? undefined
      }
      const church = await this.service.updateChurch(id, updateData)
      return reply.send(church)
    } catch (error: any) {
      // Trata erro do Prisma quando a igreja não existe
      if (error.code === 'P2025' || error.message?.includes('Record to update not found')) {
        return reply.code(404).send({ message: 'Igreja não encontrada.' })
      }
      
      // Trata erros de validação Zod
      if (error.name === 'ZodError' || error.issues) {
        return reply.code(400).send({ 
          message: 'Dados inválidos', 
          errors: error.errors || error.issues 
        })
      }
      
      return reply.code(500).send({ message: error.message || 'Erro ao atualizar igreja' })
    }
  }

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params
      const user = request.user

      if (!user || !user.memberId) {
        return reply.status(401).send({ error: 'Autenticação necessária' })
      }

      // Verificar se a igreja existe PRIMEIRO (antes de buscar o membro)
      const church = await this.service.getChurchById(id)
      if (!church) {
        return reply.status(404).send({ error: 'Igreja não encontrada.' })
      }

      // Buscar dados do membro para verificar role e churchId
      const member = await getMemberFromUserId(user.userId || user.id)
      if (!member) {
        return reply.status(404).send({ error: 'Membro não encontrado' })
      }

      // Verificar se o membro tem Branch associada
      if (!member.Branch) {
        return reply.status(400).send({ error: 'Membro não está associado a uma filial.' })
      }

      // Apenas ADMINGERAL pode deletar igrejas
      if (member.role !== 'ADMINGERAL') {
        return reply.status(403).send({ error: 'Apenas Administradores Gerais podem deletar igrejas.' })
      }

      // Verificar se a igreja pertence ao membro
      if (member.Branch.churchId !== id) {
        return reply.status(403).send({ error: 'Você só pode deletar sua própria igreja.' })
      }

      await this.service.deleteChurch(id)
      return reply.status(200).send({ message: 'Igreja deletada com sucesso.' })
    } catch (error: any) {
      // Trata erro do Prisma quando a igreja não existe
      if (error.code === 'P2025' || error.message?.includes('Record to delete does not exist') || error.message?.includes('Record to update not found')) {
        return reply.status(404).send({ error: 'Igreja não encontrada.' })
      }
      return reply.status(500).send({ error: error.message || 'Erro ao deletar igreja' })
    }
  }

  async deactivate(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params
      const user = request.user

      if (!user || !user.memberId) {
        return reply.status(401).send({ error: 'Autenticação necessária' })
      }

      // Verificar se a igreja existe PRIMEIRO (antes de buscar o membro)
      const church = await this.service.getChurchById(id)
      if (!church) {
        return reply.status(404).send({ error: 'Igreja não encontrada.' })
      }

      // Buscar dados do membro para verificar role e churchId
      const member = await getMemberFromUserId(user.userId || user.id)
      if (!member) {
        return reply.status(404).send({ error: 'Membro não encontrado' })
      }

      // Verificar se o membro tem Branch associada
      if (!member.Branch) {
        return reply.status(400).send({ error: 'Membro não está associado a uma filial.' })
      }

      // Apenas ADMINGERAL pode desativar igrejas
      if (member.role !== 'ADMINGERAL') {
        return reply.status(403).send({ error: 'Apenas Administradores Gerais podem desativar igrejas.' })
      }

      // Verificar se a igreja pertence ao membro
      if (member.Branch.churchId !== id) {
        return reply.status(403).send({ error: 'Você só pode desativar sua própria igreja.' })
      }

      const updatedChurch = await this.service.deactivateChurch(id)
      if (!updatedChurch) {
        return reply.status(404).send({ error: 'Igreja não encontrada.' })
      }
      
      return reply.status(200).send(updatedChurch)
    } catch (error: any) {
      // Trata erro do Prisma quando a igreja não existe
      if (error.code === 'P2025' || error.message?.includes('Record to update not found')) {
        return reply.status(404).send({ error: 'Igreja não encontrada.' })
      }
      
      return reply.status(500).send({ error: error.message || 'Erro ao desativar igreja' })
    }
  }
}
