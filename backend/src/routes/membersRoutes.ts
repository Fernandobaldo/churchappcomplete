import { FastifyInstance } from 'fastify'
import {
getAllMembers,
getMemberById,
getMyProfile,
updateMemberById
} from '../controllers/memberController'

export async function membersRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [app.authenticate] }, getAllMembers)
  app.get('/me', { preHandler: [app.authenticate] }, getMyProfile)
  app.get('/:id', { preHandler: [app.authenticate] }, getMemberById)
  app.put('/:id', { preHandler: [app.authenticate] }, updateMemberById)
}
