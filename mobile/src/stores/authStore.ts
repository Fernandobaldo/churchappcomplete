// ✅ authStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { jwtDecode } from "jwt-decode"


export type Permission = { type: string }

export type User = {
    id: string
    name: string
    email: string
    role: string
    branchId: string
    memberId?: string
    churchId?: string | null
    permissions: Permission[]
    token: string
    onboardingCompleted?: boolean
}

type DecodedToken = {
    name?: string
    email?: string
    role?: string | null
    branchId?: string | null
    permissions?: string[]
    sub: string
    userId?: string
    memberId?: string | null
    churchId?: string | null
    type?: string
    iat?: number
    exp?: number
    onboardingCompleted?: boolean
}

type AuthStore = {
    user: User | null
    token: string | null
    setUserFromToken: (token: string) => void
    updateUser: (updates: Partial<User>) => void
    logout: () => void
    setToken: (token: string) => void
    isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: () => {
                const state = get()
                if (!state.token || !state.user) return false
                
                try {
                    const decoded = jwtDecode<{ exp?: number }>(state.token)
                    // Verifica se token não está expirado
                    return !decoded.exp || decoded.exp * 1000 >= Date.now()
                } catch (error) {
                    return false
                }
            },
            setUserFromToken: (token) => {
                try {
                    const decoded = jwtDecode<DecodedToken>(token)

                    // Verifica se o token está expirado
                    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
                        console.warn('Token expirado, limpando estado')
                        set({ user: null, token: null })
                        return
                    }

                    // Garante que permissions seja sempre um array
                    const permissions = decoded.permissions || []
                    const permissionsArray = Array.isArray(permissions) 
                        ? permissions.map((type) => ({ type }))
                        : []

                    set({
                        user: {
                            id: decoded.sub || decoded.userId || '',
                            name: decoded.name || '',
                            email: decoded.email || '',
                            role: decoded.role || '',
                            branchId: decoded.branchId || '',
                            memberId: decoded.memberId || undefined,
                            churchId: decoded.churchId || null,
                            permissions: permissionsArray,
                            token,
                            onboardingCompleted: decoded.onboardingCompleted ?? false,
                        },
                        token,
                    })
                } catch (error) {
                    console.error('Erro ao decodificar token:', error)
                    // Em caso de erro, limpa o estado
                    set({ user: null, token: null })
                }
            },
            updateUser: (updates) => {
                set((state) => {
                    if (!state.user) {
                        return state
                    }
                    return {
                        ...state,
                        user: {
                            ...state.user,
                            ...updates,
                        },
                    }
                })
            },
            logout: () => {
                // Limpar dados de autenticação
                set({ user: null, token: null })
                
                // Limpar dados de onboarding do AsyncStorage para evitar vazamento entre usuários
                // Faz de forma assíncrona sem bloquear
                AsyncStorage.multiRemove([
                    'onboarding_church_id',
                    'onboarding_church_name',
                    'onboarding_church_address',
                    'onboarding_structure',
                    'onboarding_modules',
                    'onboarding_roles_created',
                ]).catch((error) => {
                    console.error('Erro ao limpar dados de onboarding:', error)
                })
            },
            setToken: (token) => set({ token }),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
)
