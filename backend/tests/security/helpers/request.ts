/**
 * Security Test Helpers - Request
 * 
 * Provides helpers for making authenticated requests in tests
 */

import { FastifyInstance } from 'fastify'
import request from 'supertest'

export interface AuthorizedRequestOptions {
  token: string
  method: 'get' | 'post' | 'put' | 'patch' | 'delete'
  url: string
  body?: any
  query?: any
}

/**
 * Make an authorized request
 */
export function authorizedRequest(
  app: FastifyInstance,
  options: AuthorizedRequestOptions
) {
  const { token, method, url, body, query } = options

  let req = request(app.server)[method](url)
    .set('Authorization', `Bearer ${token}`)

  if (body) {
    req = req.send(body)
  }

  if (query) {
    req = req.query(query)
  }

  return req
}

/**
 * Make an unauthorized request (no token)
 */
export function unauthorizedRequest(
  app: FastifyInstance,
  options: {
    method: 'get' | 'post' | 'put' | 'patch' | 'delete'
    url: string
    body?: any
    query?: any
  }
) {
  const { method, url, body, query } = options

  let req = request(app.server)[method](url)

  if (body) {
    req = req.send(body)
  }

  if (query) {
    req = req.query(query)
  }

  return req
}
