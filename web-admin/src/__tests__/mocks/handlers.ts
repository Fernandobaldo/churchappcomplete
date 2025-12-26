import { http, HttpResponse } from 'msw'
import { AdminRole } from '../../types'

const API_BASE = 'http://localhost:3001'

export const handlers = [
  // Auth
  http.post(`${API_BASE}/admin/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string }
    
    if (body.email === 'admin@test.com' && body.password === 'password123') {
      return HttpResponse.json({
        token: 'mock-admin-token',
        admin: {
          id: '1',
          name: 'Admin Test',
          email: 'admin@test.com',
          adminRole: AdminRole.SUPERADMIN,
          isActive: true,
        },
      })
    }
    
    return HttpResponse.json(
      { error: 'Credenciais inválidas' },
      { status: 401 }
    )
  }),

  // Dashboard
  http.get(`${API_BASE}/admin/dashboard/stats`, () => {
    return HttpResponse.json({
      totalUsers: 100,
      totalChurches: 50,
      totalMembers: 500,
      totalBranches: 75,
      newUsersLast30Days: 10,
      newChurchesLast30Days: 5,
    })
  }),

  // Plans
  http.get(`${API_BASE}/admin/plans`, () => {
    return HttpResponse.json({
      plans: [
        { id: '1', name: 'Free', price: 0, features: ['events'], isActive: true },
        { id: '2', name: 'Pro', price: 99.99, features: ['events', 'members'], isActive: true },
      ],
      availableFeatures: [
        { id: 'events', label: 'Eventos', description: 'Gerencie eventos' },
        { id: 'members', label: 'Membros', description: 'Gerencie membros' },
        { id: 'finances', label: 'Finanças', description: 'Controle financeiro' },
      ],
    })
  }),

  http.get(`${API_BASE}/admin/plans/:id`, ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: 'Test Plan',
      price: 99.99,
      features: ['events', 'members'],
      maxBranches: 5,
      maxMembers: 100,
      isActive: true,
    })
  }),

  http.post(`${API_BASE}/admin/plans`, async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      id: 'new-plan-id',
      ...body,
    }, { status: 201 })
  }),

  http.patch(`${API_BASE}/admin/plans/:id`, async ({ params, request }) => {
    const body = await request.json()
    return HttpResponse.json({
      id: params.id,
      ...body,
    })
  }),

  // Users
  http.get(`${API_BASE}/admin/users`, () => {
    return HttpResponse.json({
      users: [
        { id: '1', name: 'User 1', email: 'user1@test.com', isBlocked: false },
        { id: '2', name: 'User 2', email: 'user2@test.com', isBlocked: true },
      ],
      page: 1,
      limit: 50,
      total: 2,
    })
  }),

  http.get(`${API_BASE}/admin/users/:id`, ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: 'Test User',
      email: 'test@test.com',
      isBlocked: false,
      createdAt: new Date().toISOString(),
      churches: [],
    })
  }),

  http.patch(`${API_BASE}/admin/users/:id/block`, ({ params }) => {
    return HttpResponse.json({ message: 'Usuário bloqueado' })
  }),

  http.patch(`${API_BASE}/admin/users/:id/unblock`, ({ params }) => {
    return HttpResponse.json({ message: 'Usuário desbloqueado' })
  }),

  // Churches
  http.get(`${API_BASE}/admin/churches`, () => {
    return HttpResponse.json({
      churches: [
        { id: '1', name: 'Church 1', isActive: true },
        { id: '2', name: 'Church 2', isActive: false },
      ],
      page: 1,
      limit: 50,
      total: 2,
    })
  }),

  // Config
  http.get(`${API_BASE}/admin/config`, () => {
    return HttpResponse.json({
      trialDurationDays: 14,
      defaultNewUserPlan: 'free',
      defaultLanguage: 'pt-BR',
      emailTemplates: {
        welcome: 'Bem-vindo!',
        memberInvite: 'Convite para membro',
        passwordReset: 'Reset de senha',
      },
      paymentServiceConfig: {
        provider: 'stripe',
        apiKey: '',
      },
      emailServiceConfig: {
        provider: 'sendgrid',
        apiKey: '',
      },
    })
  }),

  http.patch(`${API_BASE}/admin/config`, async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json(body)
  }),
]






