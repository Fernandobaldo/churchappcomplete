/**
 * PLAN HEALTH CHECK
 * 
 * Utility to verify that required plans exist in the database.
 * 
 * This is NOT auto-healing - it only logs errors and warnings.
 * Plans must be created via seed or admin portal before go-live.
 * 
 * Usage:
 * - Call on startup (optional)
 * - Use in health check endpoint
 * - Run manually via script
 */

import { prisma } from '../lib/prisma'
import { AVAILABLE_PLAN_FEATURES } from '../constants/planFeatures'

/**
 * Required plans that must exist in production
 */
const REQUIRED_PLANS = [
  {
    name: 'free',
    // Allow variations like 'Free', 'Free Plan'
    nameVariations: ['free', 'Free', 'Free Plan'],
    description: 'Free plan for new users',
  },
] as const

/**
 * Check if required plans exist
 * 
 * @returns Object with check results
 */
export async function checkRequiredPlans(): Promise<{
  healthy: boolean
  missing: string[]
  warnings: string[]
  details: Array<{
    required: string
    found: boolean
    foundName?: string
    issues?: string[]
  }>
}> {
  const missing: string[] = []
  const warnings: string[] = []
  const details: Array<{
    required: string
    found: boolean
    foundName?: string
    issues?: string[]
  }> = []

  for (const requiredPlan of REQUIRED_PLANS) {
    let found = false
    let foundName: string | undefined
    const issues: string[] = []

    // Check for plan with any of the name variations
    for (const nameVariation of requiredPlan.nameVariations) {
      const plan = await prisma.plan.findUnique({
        where: { name: nameVariation },
        include: {
          Subscription: {
            where: { status: 'active' },
          },
        },
      })

      if (plan) {
        found = true
        foundName = plan.name

        // Validate that plan has valid features
        const validFeatureIds = AVAILABLE_PLAN_FEATURES.map(f => f.id)
        const invalidFeatures = (plan.features || []).filter(
          f => !validFeatureIds.includes(f as any)
        )

        if (invalidFeatures.length > 0) {
          issues.push(`Invalid features: ${invalidFeatures.join(', ')}`)
          warnings.push(
            `Plan "${foundName}" has invalid features: ${invalidFeatures.join(', ')}`
          )
        }

        // Check if plan is active
        if (!plan.isActive) {
          issues.push('Plan is inactive')
          warnings.push(`Plan "${foundName}" is inactive`)
        }

        break
      }
    }

    if (!found) {
      missing.push(requiredPlan.name)
      details.push({
        required: requiredPlan.name,
        found: false,
      })
    } else {
      details.push({
        required: requiredPlan.name,
        found: true,
        foundName,
        issues: issues.length > 0 ? issues : undefined,
      })
    }
  }

  return {
    healthy: missing.length === 0 && warnings.length === 0,
    missing,
    warnings,
    details,
  }
}

/**
 * Log health check results (does not throw, only logs)
 */
export async function logPlanHealthCheck(): Promise<void> {
  try {
    const result = await checkRequiredPlans()

    if (result.healthy) {
      console.log('✅ [Plan Health Check] All required plans are present and valid')
    } else {
      if (result.missing.length > 0) {
        console.error(
          `❌ [Plan Health Check] Missing required plans: ${result.missing.join(', ')}`
        )
        console.error(
          '   ACTION REQUIRED: Create required plans via seed or admin portal before go-live'
        )
      }

      if (result.warnings.length > 0) {
        console.warn(
          `⚠️  [Plan Health Check] Warnings:\n${result.warnings.map(w => `   - ${w}`).join('\n')}`
        )
      }
    }

    // Log details
    console.log(
      '[Plan Health Check] Details:',
      JSON.stringify(result.details, null, 2)
    )
  } catch (error: any) {
    console.error('[Plan Health Check] Error during check:', error)
  }
}
