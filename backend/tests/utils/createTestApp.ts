/**
 * Create Fastify app instance for tests
 * 
 * Creates a Fastify application instance with all routes and middlewares
 * registered, ready for testing.
 * 
 * @returns {Promise<FastifyInstance>} Fastify app instance
 * 
 * @example
 * ```typescript
 * const app = await createTestApp()
 * const response = await request(app.server).get('/health')
 * ```
 */

import Fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import { registerRoutes } from '../../src/routes/registerRoutes'
import { authenticate } from '../../src/middlewares/authenticate'

export async function createTestApp() {
  const app = Fastify({
    logger: false, // Disable logging in tests
  })

  // Register JWT plugin
  await app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'test-secret-key',
  })

  // Register authenticate middleware
  app.decorate('authenticate', authenticate)

  // Register all routes
  await registerRoutes(app)

  // Wait for app to be ready
  await app.ready()

  return app
}

