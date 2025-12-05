export const mockDecodedToken = {
  sub: 'user-123',
  email: 'joao@example.com',
  name: 'João Silva',
  role: 'ADMINGERAL',
  branchId: 'branch-123',
  churchId: 'church-123',
  permissions: ['events_manage', 'members_manage'],
  iat: 1234567890,
  exp: 1234567890 + 86400,
  type: 'user' as const,
}

export const mockUser = {
  id: 'user-123',
  name: 'João Silva',
  email: 'joao@example.com',
  role: 'ADMINGERAL',
  branchId: 'branch-123',
  permissions: [
    { type: 'events_manage' },
    { type: 'members_manage' },
  ],
  token: 'mock-jwt-token',
}

export const mockApiResponse = {
  data: {
    token: 'mock-jwt-token',
    user: mockUser,
  },
}











