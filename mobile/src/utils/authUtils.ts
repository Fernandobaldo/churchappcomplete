// utils/authUtils.ts

import { User } from '../stores/authStore'

export function hasAccess(user: User | null, permission: string): boolean {
    if (!user) return false

    return (
        user.role === 'ADMINGERAL' ||
        user.role === 'ADMINFILIAL' ||
        user.permissions?.some((p) => p.type === permission)
    )
}

export function hasAnyAccess(user: User | null, permissions: string[]): boolean {
    if (!user) return false

    return (
        user.role === 'ADMINGERAL' ||
        user.role === 'ADMINFILIAL' ||
        permissions.some((perm) =>
            user.permissions?.some((p) => p.type === perm)
        )
    )
}
