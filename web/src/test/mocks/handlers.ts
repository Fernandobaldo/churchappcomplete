import { http, HttpResponse } from 'msw'
import { mockEvents, mockContributions, mockDevotionals, mockMembers } from './mockData'

export const handlers = [
  // Auth
  http.post('http://localhost:3333/auth/login', () => {
    return HttpResponse.json({
      token: 'mock-jwt-token',
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      },
      type: 'member',
    })
  }),

  // Events
  http.get('http://localhost:3333/events', () => {
    return HttpResponse.json(mockEvents)
  }),

  http.get('http://localhost:3333/events/next', () => {
    return HttpResponse.json(mockEvents[0])
  }),

  http.get('http://localhost:3333/events/:id', ({ params }) => {
    const event = mockEvents.find((e) => e.id === params.id)
    return event ? HttpResponse.json(event) : new HttpResponse(null, { status: 404 })
  }),

  http.post('http://localhost:3333/events', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      id: 'event-new',
      ...body,
    })
  }),

  // Contributions
  http.get('http://localhost:3333/contributions', () => {
    return HttpResponse.json(mockContributions)
  }),

  http.get('http://localhost:3333/contributions/:id', ({ params }) => {
    const contrib = mockContributions.find((c) => c.id === params.id)
    return contrib ? HttpResponse.json(contrib) : new HttpResponse(null, { status: 404 })
  }),

  // Devotionals
  http.get('http://localhost:3333/devotionals', () => {
    return HttpResponse.json(mockDevotionals)
  }),

  http.get('http://localhost:3333/devotionals/:id', ({ params }) => {
    const devotional = mockDevotionals.find((d) => d.id === params.id)
    return devotional ? HttpResponse.json(devotional) : new HttpResponse(null, { status: 404 })
  }),

  // Members
  http.get('http://localhost:3333/members', () => {
    return HttpResponse.json(mockMembers)
  }),

  http.get('http://localhost:3333/members/:id', ({ params }) => {
    const member = mockMembers.find((m) => m.id === params.id)
    return member ? HttpResponse.json(member) : new HttpResponse(null, { status: 404 })
  }),
]


