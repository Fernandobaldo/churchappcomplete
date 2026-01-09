# AI Context — Mobile App Repository

This document provides context for AI-assisted refactoring and development in the mobile application.

## Repository Structure Overview

```
mobile/src/
├── api/              # HTTP client and service modules (TODO: rename to services/)
│   ├── api.ts        # Axios instance with auth interceptors
│   └── serviceScheduleApi.ts  # Service-specific API calls
├── components/       # Reusable UI components
│   ├── layouts/      # Layout wrappers (ViewScreenLayout, DetailScreenLayout, FormScreenLayout)
│   ├── PageHeader.tsx
│   ├── GlassCard.tsx
│   ├── Protected.tsx
│   ├── FormsComponent.tsx
│   ├── Tabs.tsx
│   ├── TimePicker.tsx
│   └── ... (other UI components)
├── hooks/            # Custom React hooks
│   └── useBackToDashboard.ts
├── screens/          # Screen components (46 screens, all TypeScript .tsx)
│   ├── DashboardScreen.tsx
│   ├── EventsScreen.tsx
│   ├── ProfileScreen.tsx
│   └── ... (all screens use standardized layouts)
├── stores/           # Zustand state management
│   └── authStore.ts
├── navigation/       # React Navigation setup
│   ├── AppNavigator.tsx
│   └── TabNavigator.tsx
├── theme/            # Design system (colors, typography)
├── types/            # TypeScript type definitions
└── utils/            # Utility functions
    ├── authUtils.ts
    └── translateBooks.js  # Only .js file in src/ (TODO: convert to TypeScript)
```

## Standardized Layouts

The app uses three standardized layouts for consistent UX:

### ViewScreenLayout
- **Purpose:** Lists, dashboards, settings pages
- **Features:** Optional ScrollView, pull-to-refresh support, can disable scroll for FlatList
- **Usage:** 13 screens
- **Key props:** `scrollable`, `refreshing`, `onRefresh`

### DetailScreenLayout
- **Purpose:** Single item detail views (profile, event details, transaction details)
- **Features:** Always has ScrollView, supports banner image, built-in loading state, pull-to-refresh
- **Usage:** 6 screens
- **Key props:** `imageUrl`, `loading`, `refreshing`, `onRefresh`
- **⚠️ Important:** Never use `<ScrollView>` manually inside this layout

### FormScreenLayout
- **Purpose:** Create/edit forms (Add/Edit screens)
- **Features:** Always has ScrollView, KeyboardAvoidingView, optimized for forms
- **Usage:** 11 screens
- **Key props:** `contentContainerStyle`
- **Note:** No pull-to-refresh (forms are static until save)

## Key Reusable Components

### PageHeader
- Location: `mobile/src/components/PageHeader.tsx`
- Purpose: Standardized app header with title, icons, actions
- Props: `title`, `Icon`, `iconName`, `rightButtonIcon`, `onRightButtonPress`, etc.

### GlassCard
- Location: `mobile/src/components/GlassCard.tsx`
- Purpose: Glassmorphism card container
- Usage: Primary container for content sections

### Protected
- Location: `mobile/src/components/Protected.tsx`
- Purpose: Permission-based route protection
- Props: `permission` (string)
- Behavior: Shows "Access Denied" if user lacks permission

### FormsComponent
- Location: `mobile/src/components/FormsComponent.tsx`
- Purpose: Dynamic form renderer
- Props: `form`, `setForm`, `fields[]`, `onSubmit`
- Supports: string, number, email, password, date, time, image, toggle, select

### Tabs
- Location: `mobile/src/components/Tabs.tsx`
- Purpose: Tab navigation component
- Props: `tabs[]`, `activeTab`, `onTabChange`

### TimePicker
- Location: `mobile/src/components/TimePicker.tsx`
- Purpose: Time input (HH:mm format)
- Platform-specific: Different implementation for iOS (modal) vs Android (inline)

## Architecture Rules

### Rule 1: UI Components Do Not Fetch
- **UI components** (`components/*.tsx`) should be **presentational only**
- They receive data via props
- They do NOT call APIs or fetch data
- Exception: `DevotionalCard` (TODO: refactor to follow this rule)

### Rule 2: Layouts Control Scroll/Refresh/States
- Layouts (`components/layouts/*`) handle:
  - ScrollView/FlatList configuration
  - Pull-to-refresh state (`refreshing`, `onRefresh`)
  - Loading states (DetailScreenLayout has built-in `loading`)
  - Keyboard handling (FormScreenLayout)
- Screens pass state handlers to layouts, not manual ScrollView/RefreshControl

### Rule 3: Separation of Concerns
```
Screens → Layouts → UI Components
   ↓         ↓           ↓
Services ← Hooks ←   (no fetch)
```

- **Screens**: Orchestrate data fetching, state, and layout composition
- **Layouts**: Handle scroll, refresh, keyboard, loading UI
- **Components**: Pure presentation (props in, JSX out)
- **Services/API**: HTTP calls and data transformation
- **Hooks**: Reusable stateful logic (may call services)

## Current State

### ✅ What's Standardized
- All 46 screens use TypeScript (.tsx)
- All screens use one of the three standardized layouts
- Consistent pull-to-refresh pattern (13 screens with refresh)
- Standardized header via PageHeader
- Permission system via Protected component

### ⚠️ TODOs for Refactoring
- `api/` folder should be renamed to `services/` for clarity
- `translateBooks.js` should be converted to TypeScript
- Some components may have inline API calls (audit needed)
- Hooks folder is minimal (only 1 hook) — may need expansion
- Services pattern could be more consistent across modules

## Type Safety

- **All screens**: TypeScript (.tsx)
- **All components**: TypeScript (.tsx)
- **All hooks**: TypeScript (.ts)
- **Services/API**: TypeScript (.ts)
- **Only exception**: `utils/translateBooks.js` (TODO: convert)

## Environment Variables

### Required for Bible API
- **`EXPO_PUBLIC_BIBLE_API_TOKEN`**: Token for A Biblia Digital API (used by `BibleText` component)
  - Can also be configured in `app.config.js` under `extra.bibleApiToken`
  - Used by: `mobile/src/services/bible.service.ts`
  - Required for: Bible passage fetching functionality

## References

- Layout documentation: `docs/mobile-layouts.md`
- Component documentation: `docs/mobile-components.md`
- API documentation: `docs/mobile-api.md`

---

**Last updated:** 2024-12-19
