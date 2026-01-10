/**
 * Test Fixtures - Web
 * 
 * Reusable test data fixtures for consistent testing.
 * 
 * @example
 * ```typescript
 * import { fixtures } from '../test/fixtures'
 * 
 * const user = fixtures.user()
 * const church = fixtures.church({ name: 'Custom Church' })
 * ```
 */

export const fixtures = {
  /**
   * Create user fixture
   */
  user: (overrides: Partial<any> = {}) => ({
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'ADMINGERAL',
    branchId: 'branch-123',
    memberId: 'member-123',
    churchId: 'church-123',
    permissions: [],
    onboardingCompleted: true,
    ...overrides,
  }),

  /**
   * Create church fixture
   */
  church: (overrides: Partial<any> = {}) => ({
    id: 'church-123',
    name: 'Test Church',
    address: '123 Test Street',
    createdByUserId: 'user-123',
    isActive: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  }),

  /**
   * Create branch fixture
   */
  branch: (overrides: Partial<any> = {}) => ({
    id: 'branch-123',
    name: 'Main Branch',
    churchId: 'church-123',
    isMainBranch: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  }),

  /**
   * Create member fixture
   */
  member: (overrides: Partial<any> = {}) => ({
    id: 'member-123',
    name: 'Test Member',
    email: 'member@example.com',
    role: 'MEMBER',
    branchId: 'branch-123',
    userId: 'user-123',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  }),

  /**
   * Create event fixture
   */
  event: (overrides: Partial<any> = {}) => ({
    id: 'event-123',
    title: 'Test Event',
    description: 'Test Description',
    startDate: '2025-01-15',
    endDate: '2025-01-15',
    time: '10:00',
    branchId: 'branch-123',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  }),

  /**
   * Create contribution fixture
   */
  contribution: (overrides: Partial<any> = {}) => ({
    id: 'contribution-123',
    title: 'Test Contribution',
    description: 'Test Description',
    amount: 100.0,
    date: new Date('2025-01-15').toISOString(),
    memberId: 'member-123',
    branchId: 'branch-123',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  }),

  /**
   * Create devotional fixture
   */
  devotional: (overrides: Partial<any> = {}) => ({
    id: 'devotional-123',
    title: 'Test Devotional',
    content: 'Test Content',
    date: new Date('2025-01-15').toISOString(),
    branchId: 'branch-123',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  }),

  /**
   * Create auth token payload fixture
   */
  tokenPayload: (overrides: Partial<any> = {}) => ({
    sub: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    type: 'user',
    memberId: 'member-123',
    branchId: 'branch-123',
    role: 'ADMINGERAL',
    churchId: 'church-123',
    permissions: [],
    onboardingCompleted: true,
    ...overrides,
  }),
}

