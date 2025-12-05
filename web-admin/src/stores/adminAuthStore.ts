import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { jwtDecode } from 'jwt-decode'
import { AdminUser, AdminRole } from '../types'

type DecodedAdminToken = {
  adminUserId: string
  adminRole: AdminRole
  email: string
  name: string
  type: 'admin'
  sub: string
  iat: number
  exp: number
}

type AdminAuthStore = {
  adminUser: AdminUser | null
  token: string | null
  isAuthenticated: boolean
  setAdminUserFromToken: (token: string, admin: AdminUser) => void
  login: (token: string, admin: AdminUser) => void
  logout: () => void
  checkAuth: () => boolean
}

export const useAdminAuthStore = create<AdminAuthStore>()(
  persist(
    (set, get) => ({
      adminUser: null,
      token: null,
      isAuthenticated: false,
      setAdminUserFromToken: (token, admin) => {
        try {
          const decoded = jwtDecode<DecodedAdminToken>(token)
          
          // Verifica se o token é de admin
          if (decoded.type !== 'admin') {
            console.error('Token não é de administrador')
            return
          }

          set({
            adminUser: admin,
            token,
            isAuthenticated: true,
          })
        } catch (error) {
          console.error('Erro ao decodificar token:', error)
          set({ token, isAuthenticated: false })
        }
      },
      login: (token, admin) => {
        set({
          token,
          adminUser: admin,
          isAuthenticated: true,
        })
        localStorage.setItem('admin_token', token)
      },
      logout: () => {
        localStorage.removeItem('admin_token')
        set({
          adminUser: null,
          token: null,
          isAuthenticated: false,
        })
      },
      checkAuth: () => {
        const { token } = get()
        if (!token) {
          return false
        }

        try {
          const decoded = jwtDecode<DecodedAdminToken>(token)
          const now = Date.now() / 1000
          
          // Verifica se o token expirou
          if (decoded.exp < now) {
            get().logout()
            return false
          }

          return decoded.type === 'admin'
        } catch {
          get().logout()
          return false
        }
      },
    }),
    {
      name: 'admin-auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

