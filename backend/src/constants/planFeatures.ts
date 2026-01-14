/**
 * CANONICAL PLAN FEATURES CATALOG
 * 
 * This is the SINGLE SOURCE OF TRUTH for plan features.
 * 
 * IMPORTANT RULES:
 * 1. Feature IDs are lowercase, kebab-case strings
 * 2. Feature IDs are STABLE - treat as API contract, never rename
 * 3. All features must be validated against this catalog
 * 4. Features marked as 'premium' require enforcement guards
 * 
 * Categories:
 * - BASIC: Available to all plans (still tracked but not enforced)
 * - PREMIUM: Require enforcement guards on endpoints
 */

export const AVAILABLE_PLAN_FEATURES = [
  // Basic features (available to all plans, including free)
  { 
    id: 'events', 
    label: 'Eventos', 
    description: 'Gerencie cultos e eventos',
    category: 'basic' as const,
  },
  { 
    id: 'members', 
    label: 'Membros', 
    description: 'Gerencie membros da igreja',
    category: 'basic' as const,
  },
  { 
    id: 'contributions', 
    label: 'Contribuições', 
    description: 'Gerencie ofertas e dízimos',
    category: 'basic' as const,
  },
  { 
    id: 'devotionals', 
    label: 'Devocionais', 
    description: 'Compartilhe devocionais',
    category: 'basic' as const,
  },
  
  // Premium features (require enforcement)
  { 
    id: 'finances', 
    label: 'Finanças', 
    description: 'Controle financeiro completo',
    category: 'premium' as const,
    requiresEnforcement: true,
  },
  { 
    id: 'advanced_reports', 
    label: 'Relatórios Avançados', 
    description: 'Relatórios detalhados e analytics',
    category: 'premium' as const,
    requiresEnforcement: true,
  },
  { 
    id: 'white_label_app', 
    label: 'App White-label', 
    description: 'App personalizado para a igreja',
    category: 'premium' as const,
    requiresEnforcement: true,
  },
  { 
    id: 'export', 
    label: 'Exportação de Dados', 
    description: 'Exportar dados em CSV/Excel',
    category: 'premium' as const,
    requiresEnforcement: true,
  },
  { 
    id: 'multi_branch', 
    label: 'Múltiplas Filiais', 
    description: 'Gerenciar múltiplas filiais',
    category: 'premium' as const,
    requiresEnforcement: false, // Enforced via maxBranches limit instead
  },
  { 
    id: 'api_access', 
    label: 'Acesso à API', 
    description: 'Acesso programático à API',
    category: 'premium' as const,
    requiresEnforcement: true,
  },
] as const

/**
 * Type-safe feature ID
 * Extracted from the catalog above - this ensures type safety
 */
export type PlanFeatureId = typeof AVAILABLE_PLAN_FEATURES[number]['id']

/**
 * Get all feature IDs as an array (for validation)
 */
export function getAllFeatureIds(): readonly PlanFeatureId[] {
  return AVAILABLE_PLAN_FEATURES.map(f => f.id)
}

/**
 * Get feature by ID
 */
export function getFeatureById(id: string): typeof AVAILABLE_PLAN_FEATURES[number] | undefined {
  return AVAILABLE_PLAN_FEATURES.find(f => f.id === id)
}

/**
 * Check if a feature ID is valid
 */
export function isValidFeatureId(id: string): id is PlanFeatureId {
  return AVAILABLE_PLAN_FEATURES.some(f => f.id === id)
}

/**
 * Get all premium features that require enforcement
 */
export function getPremiumFeaturesRequiringEnforcement(): readonly PlanFeatureId[] {
  return AVAILABLE_PLAN_FEATURES
    .filter(f => f.category === 'premium' && f.requiresEnforcement)
    .map(f => f.id)
}

/**
 * Validate and normalize feature IDs
 * - Converts to lowercase
 * - Removes duplicates
 * - Filters invalid IDs
 * 
 * @returns { valid: PlanFeatureId[], invalid: string[] }
 */
export function validateAndNormalizeFeatures(features: string[]): {
  valid: PlanFeatureId[]
  invalid: string[]
} {
  const validIds = new Set<PlanFeatureId>()
  const invalidIds: string[] = []
  
  for (const feature of features) {
    const normalized = feature.toLowerCase().trim()
    
    if (isValidFeatureId(normalized)) {
      validIds.add(normalized)
    } else {
      invalidIds.push(feature)
    }
  }
  
  return {
    valid: Array.from(validIds),
    invalid: invalidIds,
  }
}









