/**
 * Utilitários para trabalhar com User
 */

/**
 * Combina firstName e lastName em um nome completo
 */
export function getUserFullName(user: { firstName: string; lastName: string } | null | undefined): string {
  if (!user) return 'Usuário desconhecido'
  if (!user.firstName && !user.lastName) return 'Usuário desconhecido'
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Usuário desconhecido'
}


