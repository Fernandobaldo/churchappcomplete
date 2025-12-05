import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async (request, reply) => {
    try {
      // Verificar conexão com banco de dados
      await prisma.$queryRaw`SELECT 1`
      
      return reply.status(200).send({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
      })
    } catch (error) {
      return reply.status(503).send({
        status: 'error',
        message: 'Database connection failed',
        timestamp: new Date().toISOString()
      })
    }
  })
}

