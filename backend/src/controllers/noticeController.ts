import { FastifyRequest, FastifyReply } from 'fastify'
import { ZodError } from 'zod'
import { NoticeService } from '../services/noticeService'
import { createNoticeBodySchema } from '../schemas/noticeSchemas'

export class NoticeController {
  private service = new NoticeService()

  async getAll(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user
    if (!user?.branchId) {
      return reply.status(400).send({ message: 'Usuário não vinculado a uma filial.' })
    }
    const notices = await this.service.getByBranch(user.branchId)
    
    // Adiciona campo 'read' baseado se o usuário está em viewedBy
    // O userId pode estar em user.userId, user.id ou no sub do token
    // Também verifica se o memberId está em viewedBy (caso o aviso tenha sido marcado pelo memberId)
    const userId = user.userId || user.id
    const memberId = (user as any).memberId
    
    const noticesWithRead = notices.map((notice: any) => {
      // Verifica se userId ou memberId está no array viewedBy
      // viewedBy pode ser um array do Prisma, garantir que é array
      const viewedByArray = Array.isArray(notice.viewedBy) ? notice.viewedBy : []
      const isRead = (userId && viewedByArray.includes(userId)) || 
                     (memberId && viewedByArray.includes(memberId))
      
      // Criar novo objeto garantindo que 'read' está presente
      const noticeWithRead = {
        id: notice.id,
        title: notice.title,
        message: notice.message,
        branchId: notice.branchId,
        viewedBy: viewedByArray,
        createdAt: notice.createdAt,
        updatedAt: notice.updatedAt,
        read: Boolean(isRead)
      }
      
      return noticeWithRead
    })
    
    return reply.send(noticesWithRead)
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = createNoticeBodySchema.parse(request.body)
      const user = request.user

      if (!user?.branchId) {
        return reply.status(400).send({ 
          message: 'Usuário não está associado a uma filial. Não é possível criar avisos.' 
        })
      }

      const created = await this.service.create({
        ...data,
        branchId: user.branchId
      })

      return reply.code(201).send(created)
    } catch (error: any) {
      if (error instanceof ZodError) {
        return reply.status(400).send({ 
          error: 'Dados inválidos', 
          message: error.errors?.[0]?.message || 'Erro de validação',
          details: error.errors 
        })
      }

      console.error('❌ Erro ao criar aviso:', error)
      return reply.status(500).send({ error: 'Erro interno ao criar aviso', details: error.message })
    }
  }

  async markAsRead(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string }
      const user = request.user

      if (!user?.userId && !user?.id) {
        return reply.status(401).send({ message: 'Usuário não autenticado' })
      }

      const userId = user.userId || user.id
      const notice = await this.service.markAsRead(id, userId)

      if (!notice) {
        return reply.status(404).send({ message: 'Aviso não encontrado' })
      }

      return reply.send({ message: 'Aviso marcado como lido' })
    } catch (error: any) {
      console.error('❌ Erro ao marcar aviso como lido:', error)
      return reply.status(500).send({ error: 'Erro interno', details: error.message })
    }
  }
}

