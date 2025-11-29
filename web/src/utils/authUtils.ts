import { User } from '../stores/authStore'

/**
 * Verifica se o usuário tem acesso a uma permissão específica
 * @param user - Usuário atual
 * @param permission - Permissão a ser verificada
 * @returns true se o usuário tem acesso
 */
export function hasAccess(user: User | null, permission: string): boolean {
  if (!user) return false

  return (
    user.role === 'ADMINGERAL' ||
    user.role === 'ADMINFILIAL' ||
    user.permissions?.some((p) => p.type === permission) === true
  )
}

/**
 * Verifica se o usuário tem acesso a qualquer uma das permissões fornecidas
 * @param user - Usuário atual
 * @param permissions - Array de permissões a serem verificadas
 * @returns true se o usuário tem acesso a pelo menos uma permissão
 */
export function hasAnyAccess(user: User | null, permissions: string[]): boolean {
  if (!user) return false

  if (user.role === 'ADMINGERAL' || user.role === 'ADMINFILIAL') {
    return true
  }

  return permissions.some((permission) =>
    user.permissions?.some((p) => p.type === permission)
  )
}

/**
 * Verifica se o usuário tem acesso a todas as permissões fornecidas
 * @param user - Usuário atual
 * @param permissions - Array de permissões a serem verificadas
 * @returns true se o usuário tem acesso a todas as permissões
 */
export function hasAllAccess(user: User | null, permissions: string[]): boolean {
  if (!user) return false

  if (user.role === 'ADMINGERAL' || user.role === 'ADMINFILIAL') {
    return true
  }

  return permissions.every((permission) =>
    user.permissions?.some((p) => p.type === permission)
  )
}

/**
 * Verifica se o usuário tem um role específico
 * @param user - Usuário atual
 * @param role - Role a ser verificado
 * @returns true se o usuário tem o role
 */
export function hasRole(user: User | null, role: string): boolean {
  if (!user) return false
  return user.role === role
}

/**
 * Verifica se o usuário tem qualquer um dos roles fornecidos
 * @param user - Usuário atual
 * @param roles - Array de roles a serem verificados
 * @returns true se o usuário tem pelo menos um dos roles
 */
export function hasAnyRole(user: User | null, roles: string[]): boolean {
  if (!user) return false
  return roles.includes(user.role)
}



