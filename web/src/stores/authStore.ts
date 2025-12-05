import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { jwtDecode } from 'jwt-decode'

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
  email: string
  role?: string | null
  branchId?: string | null
  memberId?: string | null
  churchId?: string | null
  permissions?: string[]
  sub: string
  iat: number
  exp: number
  type?: 'user' | 'member'
}

type AuthStore = {
  user: User | null
  token: string | null
  setUserFromToken: (token: string) => void
  updateUser: (updates: Partial<User>) => void
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

          // Garante que permissions seja sempre um array
          const permissions = decoded.permissions || []
          const permissionsArray = Array.isArray(permissions)
            ? permissions.map((type) => ({ type }))
            : []

          set({
            user: {
              id: decoded.sub,
              name: decoded.name || '',
              email: decoded.email,
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
      logout: () => set({ user: null, token: null }),
      setToken: (token) => set({ token }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

