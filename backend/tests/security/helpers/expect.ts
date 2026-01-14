/**
 * Security Test Helpers - Expectations
 * 
 * Provides helper expectations for security tests
 */

import { Response } from 'supertest'

/**
 * Expect 403 Forbidden (access denied)
 */
export function expectForbidden(response: Response) {
  expect(response.status).toBe(403)
  expect(response.body).toHaveProperty('error')
  expect(response.body).toHaveProperty('message')
}

/**
 * Expect 404 Not Found (resource doesn't exist or hidden)
 */
export function expectNotFound(response: Response) {
  expect(response.status).toBe(404)
  expect(response.body).toHaveProperty('message')
}

/**
 * Expect 401 Unauthorized (authentication required)
 */
export function expectUnauthorized(response: Response) {
  expect(response.status).toBe(401)
  expect(response.body).toHaveProperty('message')
}

/**
 * Expect 400 Bad Request (validation error)
 */
export function expectBadRequest(response: Response) {
  expect(response.status).toBe(400)
}

/**
 * Expect 200 OK or 201 Created (success)
 */
export function expectSuccess(response: Response, expectedStatus: 200 | 201 = 200) {
  expect(response.status).toBe(expectedStatus)
}

/**
 * Expect response body to not contain tenant data from another tenant
 * Checks that IDs from tenantA are not present in response
 */
export function expectNoCrossTenantData(
  response: Response,
  tenantAIds: {
    churchId: string
    branchId: string
    memberIds: string[]
  }
) {
  const bodyStr = JSON.stringify(response.body)

  // Check for churchId
  expect(bodyStr).not.toContain(tenantAIds.churchId)

  // Check for branchId
  expect(bodyStr).not.toContain(tenantAIds.branchId)

  // Check for memberIds
  tenantAIds.memberIds.forEach(memberId => {
    expect(bodyStr).not.toContain(memberId)
  })
}

/**
 * Expect list response to only contain items from the same tenant
 */
export function expectOnlyTenantData(
  response: Response,
  expectedBranchId: string,
  expectedChurchId?: string
) {
  const items = Array.isArray(response.body) ? response.body : [response.body]

  items.forEach((item: any) => {
    if (item.branchId) {
      expect(item.branchId).toBe(expectedBranchId)
    }
    if (expectedChurchId && item.churchId) {
      expect(item.churchId).toBe(expectedChurchId)
    }
  })
}
