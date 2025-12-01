export const mockUser = {
  id: 'user-123',
  name: 'João Silva',
  email: 'joao@example.com',
  role: 'ADMINGERAL',
  branchId: 'branch-123',
  permissions: [
    { type: 'events_manage' },
    { type: 'members_manage' },
    { type: 'devotional_manage' },
    { type: 'contributions_manage' },
    { type: 'finances_manage' },
  ],
  token: 'mock-jwt-token',
}

export const mockTransactions = [
  {
    id: 'trans-1',
    title: 'Dízimo',
    amount: 1000.0,
    type: 'ENTRY',
    category: 'Dízimo',
    entryType: 'DIZIMO',
    branchId: 'branch-123',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'trans-2',
    title: 'Oferta',
    amount: 500.0,
    type: 'ENTRY',
    category: 'Oferta',
    entryType: 'OFERTA',
    branchId: 'branch-123',
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: '2024-01-16T10:00:00Z',
  },
  {
    id: 'trans-3',
    title: 'Pagamento',
    amount: 300.0,
    type: 'EXIT',
    category: 'Despesas',
    branchId: 'branch-123',
    createdAt: '2024-01-17T10:00:00Z',
    updatedAt: '2024-01-17T10:00:00Z',
  },
]

export const mockFinanceSummary = {
  total: 1200.0,
  entries: 1500.0,
  exits: 300.0,
}

export const mockMember = {
  id: 'member-123',
  name: 'Maria Santos',
  email: 'maria@example.com',
  role: 'MEMBER',
  branchId: 'branch-123',
  permissions: [],
  token: 'mock-member-token',
}

export const mockEvents = [
  {
    id: 'event-1',
    title: 'Culto de Domingo',
    description: 'Culto matutino',
    startDate: '2024-01-15T10:00:00Z',
    endDate: '2024-01-15T12:00:00Z',
    time: '10:00',
    location: 'Igreja Central',
    hasDonation: false,
    donationReason: null,
    donationLink: null,
    imageUrl: null,
  },
  {
    id: 'event-2',
    title: 'Reunião de Oração',
    description: 'Reunião semanal',
    startDate: '2024-01-20T19:00:00Z',
    endDate: '2024-01-20T21:00:00Z',
    time: '19:00',
    location: 'Sala de Oração',
    hasDonation: true,
    donationReason: 'Missões',
    donationLink: 'https://example.com/donate',
    imageUrl: null,
  },
]

export const mockContributions = [
  {
    id: 'contrib-1',
    title: 'Dízimo',
    description: 'Dízimo do mês',
    value: 100.0,
    date: '2024-01-15',
    type: 'DIZIMO',
    branchId: 'branch-123',
  },
  {
    id: 'contrib-2',
    title: 'Oferta',
    description: 'Oferta especial',
    value: 50.0,
    date: '2024-01-20',
    type: 'OFERTA',
    branchId: 'branch-123',
  },
]

export const mockDevotionals = [
  {
    id: 'devotional-1',
    title: 'Devocional Diário',
    passage: 'João 3:16',
    content: 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito...',
    author: {
      id: 'member-123',
      name: 'João Silva',
    },
    likes: 5,
    liked: false,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'devotional-2',
    title: 'Palavra de Fé',
    passage: 'Hebreus 11:1',
    content: 'Ora, a fé é o firme fundamento das coisas que se esperam...',
    author: {
      id: 'member-123',
      name: 'João Silva',
    },
    likes: 3,
    liked: true,
    createdAt: '2024-01-20T10:00:00Z',
  },
]

export const mockMembers = [
  {
    id: 'member-1',
    name: 'Maria Santos',
    email: 'maria@example.com',
    role: 'MEMBER',
    branchId: 'branch-123',
    permissions: [],
  },
  {
    id: 'member-2',
    name: 'Pedro Oliveira',
    email: 'pedro@example.com',
    role: 'COORDINATOR',
    branchId: 'branch-123',
    permissions: [{ type: 'events_manage' }],
  },
]

export const mockDecodedToken = {
  sub: 'user-123',
  name: 'João Silva',
  email: 'joao@example.com',
  role: 'ADMINGERAL',
  branchId: 'branch-123',
  permissions: ['events_manage', 'members_manage'],
  iat: 1234567890,
  exp: 1234571490,
}

