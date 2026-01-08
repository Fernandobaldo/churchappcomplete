# Mobile Conventions — AI-Assisted Refactoring Guide

This document defines conventions for maintaining and refactoring the mobile codebase.

## API Calls Placement

### Current Structure (TODO: Refactor)

Currently, API calls are organized as follows:

```
mobile/src/
├── api/                    # Should be renamed to services/
│   ├── api.ts              # Axios instance (base HTTP client)
│   └── serviceScheduleApi.ts  # Domain-specific service
└── hooks/
    └── useBackToDashboard.ts  # Navigation hook (no API calls)
```

### Target Structure (Recommended)

```
mobile/src/
├── services/               # HTTP calls and data transformation
│   ├── http/              # Base HTTP client (api.ts renamed)
│   │   └── client.ts
│   ├── scheduleService.ts  # Domain services (e.g., serviceScheduleApi.ts)
│   ├── eventService.ts
│   └── memberService.ts
└── hooks/                  # React hooks (may call services)
    ├── useSchedule.ts     # Hook that uses scheduleService
    ├── useEvents.ts
    └── useBackToDashboard.ts
```

### Rules

1. **Services** (`services/*.ts`):
   - Contain API calls (HTTP requests)
   - Export typed interfaces/types
   - No React hooks or component logic
   - Example: `scheduleService.getByBranch(branchId)`

2. **Hooks** (`hooks/*.ts`):
   - Contain React-specific logic
   - May call services internally
   - Can manage local state, side effects
   - Example: `useSchedule(branchId)` → calls `scheduleService.getByBranch()`

3. **Screens** (`screens/*.tsx`):
   - Use hooks or call services directly
   - Orchestrate data fetching and state
   - Compose layouts and components

## Naming Conventions

### Services

```typescript
// Pattern: {domain}Service.ts
// Functions: camelCase with action verb

// ✅ Good
services/scheduleService.ts
  - getByBranch(branchId: string)
  - create(data: CreateScheduleData)
  - update(id: string, data: UpdateScheduleData)
  - delete(id: string)

services/eventService.ts
  - getById(id: string)
  - getAll()
  - create(data: CreateEventData)
```

### Hooks

```typescript
// Pattern: use{Entity} or use{Action}
// Return: object with { data, loading, error, refetch }

// ✅ Good
hooks/useSchedule.ts
  export function useSchedule(branchId: string) {
    // Returns: { schedule, loading, error, refetch }
  }

hooks/useEvents.ts
  export function useEvents(filters?: EventFilters) {
    // Returns: { events, loading, error, refetch }
  }

// Navigation/UI hooks
hooks/useBackToDashboard.ts  // ✅ Good (descriptive)
```

### Screens

```typescript
// Pattern: {Entity}{Action}Screen.tsx or {Entity}DetailsScreen.tsx
// ✅ Good
screens/EventsScreen.tsx           // List view
screens/EventDetailsScreen.tsx     // Detail view
screens/AddEventScreen.tsx         // Create form
screens/EditEventScreen.tsx        // Edit form
```

### Components

```typescript
// Pattern: PascalCase, descriptive name
// ✅ Good
components/EventCard.tsx
components/MemberSearch.tsx
components/TimePicker.tsx

// Layouts are exceptions (already established)
components/layouts/ViewScreenLayout.tsx
```

## "No Breaking Changes" Policy

### Rule: Incremental Refactoring Only

When refactoring:

1. **✅ DO:**
   - Add new files/functions alongside old ones
   - Deprecate old patterns with `@deprecated` comments
   - Update new code to use new patterns
   - Migrate screens one at a time

2. **❌ DON'T:**
   - Delete working code in one big change
   - Rename files/folders without updating all imports first
   - Change function signatures that are widely used
   - Refactor multiple screens at once

### Migration Strategy

```typescript
// Step 1: Create new service alongside old one
// services/scheduleService.ts (NEW)
export const scheduleService = {
  getByBranch: async (branchId: string) => { /* ... */ }
}

// api/serviceScheduleApi.ts (OLD - keep for now)
// @deprecated Use scheduleService from services/scheduleService instead
export const serviceScheduleApi = { /* ... */ }

// Step 2: Migrate one screen at a time
// screens/ChurchSettingsScreen.tsx
// OLD: import { serviceScheduleApi } from '../api/serviceScheduleApi'
// NEW: import { scheduleService } from '../services/scheduleService'

// Step 3: After all screens migrated, remove old file
```

## Incremental Refactor Approach

### Phase 1: Structure Setup
- [ ] Create `services/` folder
- [ ] Move `api/api.ts` → `services/http/client.ts`
- [ ] Keep `api/` folder temporarily (mark as deprecated)

### Phase 2: Service Migration
- [ ] Create `services/scheduleService.ts` (new pattern)
- [ ] Keep `api/serviceScheduleApi.ts` (old pattern)
- [ ] Mark old file with `@deprecated` comment

### Phase 3: Hook Creation
- [ ] Create `hooks/useSchedule.ts` (wraps scheduleService)
- [ ] Test hook in isolation

### Phase 4: Screen Migration
- [ ] Migrate ONE screen: `ChurchSettingsScreen.tsx`
- [ ] Test thoroughly
- [ ] Migrate next screen only after previous is stable

### Phase 5: Cleanup
- [ ] Remove deprecated files after all migrations
- [ ] Remove `api/` folder if empty
- [ ] Update imports across codebase

## Smoke Checks

Before and after each refactor phase, run:

### Automated Checks
```bash
# TypeScript compilation
cd mobile && npx tsc --noEmit

# Linter
cd mobile && npx eslint src/

# Run tests (if available)
cd mobile && npm test
```

### Manual Smoke Checks

1. **Navigation Test:**
   - Navigate through all major screens
   - Verify no blank screens or crashes

2. **Data Loading Test:**
   - Verify screens load data correctly
   - Check pull-to-refresh works

3. **Form Submission Test:**
   - Test create/edit forms
   - Verify success/error messages

4. **Permission Test:**
   - Test protected routes
   - Verify access denied screens

### Before Merging

- [ ] All TypeScript errors resolved
- [ ] No linter errors
- [ ] Manual smoke test passed
- [ ] No console errors in dev tools
- [ ] Navigation works end-to-end

## Code Patterns

### Service Pattern

```typescript
// services/eventService.ts
import { httpClient } from './http/client'
import type { Event, CreateEventData, UpdateEventData } from '../types'

export const eventService = {
  async getAll(): Promise<Event[]> {
    const response = await httpClient.get<Event[]>('/events')
    return response.data
  },

  async getById(id: string): Promise<Event> {
    const response = await httpClient.get<Event>(`/events/${id}`)
    return response.data
  },

  async create(data: CreateEventData): Promise<Event> {
    const response = await httpClient.post<Event>('/events', data)
    return response.data
  },

  async update(id: string, data: UpdateEventData): Promise<Event> {
    const response = await httpClient.put<Event>(`/events/${id}`, data)
    return response.data
  },

  async delete(id: string): Promise<void> {
    await httpClient.delete(`/events/${id}`)
  },
}
```

### Hook Pattern

```typescript
// hooks/useEvents.ts
import { useState, useEffect, useCallback } from 'react'
import { eventService } from '../services/eventService'
import type { Event } from '../types'

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await eventService.getAll()
      setEvents(data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  return {
    events,
    loading,
    error,
    refetch: fetchEvents,
  }
}
```

### Screen Pattern

```typescript
// screens/EventsScreen.tsx
import { useEvents } from '../hooks/useEvents'
import ViewScreenLayout from '../components/layouts/ViewScreenLayout'

export default function EventsScreen() {
  const { events, loading, error, refetch } = useEvents()
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  if (loading && !events.length) {
    return <LoadingView />
  }

  return (
    <ViewScreenLayout
      headerProps={{ title: 'Eventos' }}
      refreshing={refreshing}
      onRefresh={handleRefresh}
      scrollable={false}
    >
      <FlatList
        data={events}
        renderItem={({ item }) => <EventCard event={item} />}
      />
    </ViewScreenLayout>
  )
}
```

## Type Safety

### Always Use Types

```typescript
// ✅ Good - Explicit types
export interface Event {
  id: string
  title: string
  startDate: string
}

export async function getEvent(id: string): Promise<Event> {
  // ...
}

// ❌ Bad - Implicit any
export async function getEvent(id) {
  // ...
}
```

### Service Response Types

```typescript
// services/eventService.ts
import type { Event } from '../types'

// ✅ Good - Type the response
export async function getById(id: string): Promise<Event> {
  const response = await httpClient.get<Event>(`/events/${id}`)
  return response.data
}

// ❌ Bad - No type
export async function getById(id: string) {
  const response = await httpClient.get(`/events/${id}`)
  return response.data
}
```

## Common Pitfalls to Avoid

### ❌ Don't: Fetch in Components

```typescript
// ❌ Bad - Component fetching data
function EventCard({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState(null)
  
  useEffect(() => {
    eventService.getById(eventId).then(setEvent)
  }, [eventId])
  
  return <Text>{event?.title}</Text>
}
```

### ✅ Do: Pass Data as Props

```typescript
// ✅ Good - Component receives data
function EventCard({ event }: { event: Event }) {
  return <Text>{event.title}</Text>
}

// Screen fetches and passes down
function EventsScreen() {
  const { events } = useEvents()
  return events.map(event => <EventCard key={event.id} event={event} />)
}
```

### ❌ Don't: Manual ScrollView in DetailScreenLayout

```typescript
// ❌ Bad - Manual ScrollView
<DetailScreenLayout>
  <ScrollView>
    <Content />
  </ScrollView>
</DetailScreenLayout>
```

### ✅ Do: Let Layout Handle Scroll

```typescript
// ✅ Good - Layout handles ScrollView
<DetailScreenLayout>
  <View>
    <Content />
  </View>
</DetailScreenLayout>
```

## References

- Context documentation: `docs/ai/AI_CONTEXT.md`
- Layout documentation: `docs/mobile-layouts.md`
- Component documentation: `docs/mobile-components.md`

---

**Last updated:** 2024-12-19
