import { AdminRole } from '@prisma/client'

/**
 * Verifica se o role pode bloquear/desbloquear usuários
 */
export function canBlockUser(role: AdminRole): boolean {
  return role === AdminRole.SUPERADMIN
}

/**
 * Verifica se o role pode suspender/reativar igrejas
 */
export function canSuspendChurch(role: AdminRole): boolean {
  return role === AdminRole.SUPERADMIN
}

/**
 * Verifica se o role pode mudar planos
 */
export function canChangePlan(role: AdminRole): boolean {
  return role === AdminRole.SUPERADMIN || role === AdminRole.FINANCE
}

/**
 * Verifica se o role pode impersonar
 */
export function canImpersonate(role: AdminRole): boolean {
  return role === AdminRole.SUPERADMIN || role === AdminRole.SUPPORT
}

/**
 * Verifica se o role pode acessar configurações do sistema
 */
export function canAccessConfig(role: AdminRole): boolean {
  return role === AdminRole.SUPERADMIN
}

/**
 * Verifica se o role pode acessar logs de auditoria
 */
export function canAccessAudit(role: AdminRole): boolean {
  return role === AdminRole.SUPERADMIN
}

/**
 * Verifica se o role pode criar/editar planos
 */
export function canManagePlans(role: AdminRole): boolean {
  return role === AdminRole.SUPERADMIN
}

/**
 * Verifica se o role pode ver usuários
 */
export function canViewUsers(role: AdminRole): boolean {
  return role === AdminRole.SUPERADMIN || role === AdminRole.SUPPORT
}

/**
 * Verifica se o role pode ver igrejas
 */
export function canViewChurches(role: AdminRole): boolean {
  return role === AdminRole.SUPERADMIN || role === AdminRole.SUPPORT
}

/**
 * Verifica se o role pode ver assinaturas
 */
export function canViewSubscriptions(role: AdminRole): boolean {
  return role === AdminRole.SUPERADMIN || role === AdminRole.FINANCE
}

/**
 * Verifica se o role pode ver membros
 */
export function canViewMembers(role: AdminRole): boolean {
  return role === AdminRole.SUPERADMIN || role === AdminRole.SUPPORT
}



