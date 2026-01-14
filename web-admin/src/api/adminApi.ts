import axios from 'axios'
import { useAdminAuthStore } from '../stores/adminAuthStore'
import { LoginResponse, DashboardStats, AdminUser } from '../types'

// Configuração da API base
const getBaseURL = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  return 'http://localhost:3333'
}

const adminApi = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Interceptor para adicionar token de autenticação
adminApi.interceptors.request.use(
  (config) => {
    const token = useAdminAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para tratamento de erros
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // Tratamento de erros de autenticação
    if (error.response?.status === 401) {
      useAdminAuthStore.getState().logout()
      window.location.href = '/admin/login'
    }
    return Promise.reject(error)
  }
)

// ==================== AUTH ====================
export const adminAuthApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await adminApi.post<LoginResponse>('/admin/auth/login', {
      email,
      password,
    })
    return response.data
  },
  logout: async (): Promise<void> => {
    await adminApi.post('/admin/auth/logout')
  },
  getMe: async (): Promise<AdminUser> => {
    const response = await adminApi.get<{ admin: AdminUser }>('/admin/auth/me')
    return response.data.admin
  },
}

// ==================== DASHBOARD ====================
export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await adminApi.get<DashboardStats>('/admin/dashboard/stats')
    return response.data
  },
}

// ==================== USERS ====================
export const usersApi = {
  getAll: async (params?: {
    page?: number
    limit?: number
    status?: string
    planId?: string
    search?: string
  }) => {
    const response = await adminApi.get('/admin/users', { params })
    return response.data
  },
  getById: async (id: string) => {
    const response = await adminApi.get(`/admin/users/${id}`)
    return response.data
  },
  block: async (id: string) => {
    const response = await adminApi.patch(`/admin/users/${id}/block`)
    return response.data
  },
  unblock: async (id: string) => {
    const response = await adminApi.patch(`/admin/users/${id}/unblock`)
    return response.data
  },
  resetPassword: async (id: string) => {
    const response = await adminApi.post(`/admin/users/${id}/reset-password`)
    return response.data
  },
  impersonate: async (id: string) => {
    const response = await adminApi.post(`/admin/users/${id}/impersonate`)
    return response.data
  },
}

// ==================== CHURCHES ====================
export const churchesApi = {
  getAll: async (params?: {
    page?: number
    limit?: number
    name?: string
    planId?: string
    status?: string
  }) => {
    const response = await adminApi.get('/admin/churches', { params })
    return response.data
  },
  getById: async (id: string) => {
    const response = await adminApi.get(`/admin/churches/${id}`)
    return response.data
  },
  getBranches: async (id: string) => {
    const response = await adminApi.get(`/admin/churches/${id}/branches`)
    return response.data
  },
  getMembers: async (id: string, params?: { page?: number; limit?: number }) => {
    const response = await adminApi.get(`/admin/churches/${id}/members`, { params })
    return response.data
  },
  suspend: async (id: string) => {
    const response = await adminApi.patch(`/admin/churches/${id}/suspend`)
    return response.data
  },
  reactivate: async (id: string) => {
    const response = await adminApi.patch(`/admin/churches/${id}/reactivate`)
    return response.data
  },
  changePlan: async (id: string, planId: string) => {
    const response = await adminApi.patch(`/admin/churches/${id}/plan`, { planId })
    return response.data
  },
  impersonateOwner: async (id: string) => {
    const response = await adminApi.post(`/admin/churches/${id}/impersonate`)
    return response.data
  },
}

// ==================== MEMBERS ====================
export const membersApi = {
  getAll: async (params?: {
    page?: number
    limit?: number
    search?: string
  }) => {
    const response = await adminApi.get('/admin/members', { params })
    return response.data
  },
  getById: async (id: string) => {
    const response = await adminApi.get(`/admin/members/${id}`)
    return response.data
  },
}

// ==================== PLANS ====================
export const plansApi = {
  getAll: async () => {
    const response = await adminApi.get('/admin/plans')
    return response.data
  },
  getFeatures: async () => {
    const response = await adminApi.get('/admin/plans/features')
    return response.data
  },
  getById: async (id: string) => {
    const response = await adminApi.get(`/admin/plans/${id}`)
    return response.data
  },
  create: async (data: {
    name: string
    price: number
    features: string[]
    maxBranches?: number
    maxMembers?: number
  }) => {
    const response = await adminApi.post('/admin/plans', data)
    return response.data
  },
  update: async (id: string, data: Partial<{
    name: string
    price: number
    features: string[]
    maxBranches?: number
    maxMembers?: number
    isActive?: boolean
  }>) => {
    const response = await adminApi.patch(`/admin/plans/${id}`, data)
    return response.data
  },
  activate: async (id: string) => {
    const response = await adminApi.patch(`/admin/plans/${id}/activate`)
    return response.data
  },
  deactivate: async (id: string) => {
    const response = await adminApi.patch(`/admin/plans/${id}/deactivate`)
    return response.data
  },
}

// ==================== SUBSCRIPTIONS ====================
export const subscriptionsApi = {
  getAll: async (params?: {
    page?: number
    limit?: number
    status?: string
    planId?: string
  }) => {
    const response = await adminApi.get('/admin/subscriptions', { params })
    return response.data
  },
  getById: async (id: string) => {
    const response = await adminApi.get(`/admin/subscriptions/${id}`)
    return response.data
  },
  getHistory: async (id: string) => {
    const response = await adminApi.get(`/admin/subscriptions/${id}/history`)
    return response.data
  },
  changePlan: async (id: string, planId: string) => {
    const response = await adminApi.patch(`/admin/subscriptions/${id}/plan`, { planId })
    return response.data
  },
  updateStatus: async (id: string, status: string) => {
    const response = await adminApi.patch(`/admin/subscriptions/${id}/status`, { status })
    return response.data
  },
  cancel: async (id: string) => {
    const response = await adminApi.patch(`/admin/subscriptions/${id}/cancel`)
    return response.data
  },
  reactivate: async (id: string) => {
    const response = await adminApi.patch(`/admin/subscriptions/${id}/reactivate`)
    return response.data
  },
}

// ==================== AUDIT ====================
export const auditApi = {
  getLogs: async (params?: {
    page?: number
    limit?: number
    adminUserId?: string
    action?: string
    startDate?: string
    endDate?: string
  }) => {
    const response = await adminApi.get('/admin/audit', { params })
    return response.data
  },
}

// ==================== CONFIG ====================
export const configApi = {
  get: async () => {
    const response = await adminApi.get('/admin/config')
    return response.data
  },
  update: async (config: any) => {
    const response = await adminApi.patch('/admin/config', config)
    return response.data
  },
}

export default adminApi

