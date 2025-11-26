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
  logout: () => void
  setToken: (token: string) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setUserFromToken: (token) => {
        const decoded = jwtDecode<DecodedToken>(token)

        // Log para debug
        if (!decoded.branchId) {
          console.warn('⚠️ ATENÇÃO: branchId não está presente no token!', decoded)
        }

        set({
          user: {
            id: decoded.sub,
            name: decoded.name || '',
            email: decoded.email,
            role: decoded.role || '',
            branchId: decoded.branchId || '',
            permissions: (decoded.permissions || []).map((type) => ({ type })),
            token,
          },
          token,
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

