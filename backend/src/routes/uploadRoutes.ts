import { FastifyInstance } from 'fastify'
import { uploadAvatar } from '../services/uploadService'
import fastifyMultipart from '@fastify/multipart'

export async function uploadRoutes(app: FastifyInstance) {
  // Registrar plugin multipart
  await app.register(fastifyMultipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  })

  app.post(
    '/upload/avatar',
    {
      preHandler: [app.authenticate],
      schema: {
        description: 'Upload de avatar do usuário',
        tags: ['Upload'],
        security: [{ bearerAuth: [] }],
        consumes: ['multipart/form-data'],
        response: {
          200: {
            type: 'object',
            properties: {
              url: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const url = await uploadAvatar(request)
        return reply.send({ url })
      } catch (error: any) {
        return reply.status(400).send({ error: error.message })
      }
    }
  )

  app.post(
    '/upload/church-avatar',
    {
      preHandler: [app.authenticate],
      schema: {
        description: 'Upload de avatar da igreja',
        tags: ['Upload'],
        security: [{ bearerAuth: [] }],
        consumes: ['multipart/form-data'],
        response: {
          200: {
            type: 'object',
            properties: {
              url: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const url = await uploadAvatar(request)
        return reply.send({ url })
      } catch (error: any) {
        return reply.status(400).send({ error: error.message })
      }
    }
  )

  app.post(
    '/upload/event-image',
    {
      preHandler: [app.authenticate],
      schema: {
        description: 'Upload de imagem para evento',
        tags: ['Upload'],
        security: [{ bearerAuth: [] }],
        consumes: ['multipart/form-data'],
        response: {
          200: {
            type: 'object',
            properties: {
              url: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const url = await uploadAvatar(request)
        return reply.send({ url })
      } catch (error: any) {
        return reply.status(400).send({ error: error.message })
      }
    }
  )
}
