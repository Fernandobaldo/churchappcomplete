import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

type User = {
    id: string
    name: string
    email: string
    permissions: string[]
    token: string
}

type AuthStore = {
    user: User | null
    setUser: (user: User) => void
    logout: () => void
    token: string | null
    setToken: (token: string) => void
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set) => ({
            user: null,
            setUser: (user) => set({ user, token: user.token }),
            logout: () => set({ user: null, token: null }),
            token: null,
            setToken: (token) => set({ token }),
        }),
        {
            name: 'auth-storage',
            storage: AsyncStorage,
        }
    )
)
