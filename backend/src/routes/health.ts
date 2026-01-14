import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { checkRequiredPlans } from '../utils/planHealthCheck'

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async (request, reply) => {
    try {
      // Verificar conexão com banco de dados
      await prisma.$queryRaw`SELECT 1`
      
      // Check plan health (optional - doesn't fail health check, just logs)
      const planHealth = await checkRequiredPlans()
      
      return reply.status(200).send({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        plans: {
          healthy: planHealth.healthy,
          missing: planHealth.missing,
          warnings: planHealth.warnings,
        }
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







