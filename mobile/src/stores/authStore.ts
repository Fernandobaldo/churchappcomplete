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
    permissions: Permission[]
    token: string
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
}

type AuthStore = {
    user: User | null
    token: string | null
    setUserFromToken: (token: string) => void
    logout: () => void
    setToken: (token: string) => void
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            setUserFromToken: (token) => {
                try {
                    const decoded = jwtDecode<DecodedToken>(token)
                    console.log('Token decodificado:', decoded)

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
                            permissions: permissionsArray,
                            token,
                        },
                        token,
                    })
                } catch (error) {
                    console.error('Erro ao decodificar token:', error)
                    // Em caso de erro, ainda salva o token
                    set({ token })
                }
            },
            logout: () => set({ user: null, token: null }),
            setToken: (token) => set({ token }),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
)
