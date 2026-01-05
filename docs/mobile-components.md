# Mobile (Expo/React Native) — Componentes reutilizáveis

Origem: `mobile/src/components/*`.

## `PageHeader`

- Arquivo: `mobile/src/components/PageHeader.tsx`
- Props principais (`PageHeaderProps`):
  - `title?: string`
  - `Icon?: React.ComponentType<{ name: string; size: number; color: string; style?: object }>`
  - `iconName?: string`
  - `backgroundColor?: string` (default `#3366FF`)
  - `rightButtonIcon?: React.ReactNode`
  - `onRightButtonPress?: () => void`
  - `userAvatar?: string | null`
  - `userName?: string`
  - `onAvatarPress?: () => void`
  - `churchLogo?: string | null`
  - `churchName?: string`

Uso:

```tsx
import PageHeader from '../components/PageHeader'

<PageHeader
  churchName="Minha Igreja"
  userName="Maria"
  onAvatarPress={() => {}}
/>
```

## Layouts

### `FormScreenLayout`

- Arquivo: `mobile/src/components/layouts/FormScreenLayout.tsx`
- Props:
  - `headerProps: PageHeaderProps`
  - `children: React.ReactNode`
  - `backgroundColor?: string` (default `#fff`)

### `DetailScreenLayout`

- Arquivo: `mobile/src/components/layouts/DetailScreenLayout.tsx`
- Props:
  - `headerProps: PageHeaderProps`
  - `children: React.ReactNode`
  - `backgroundColor?: string` (default `#f5f5f5`)
  - `imageUrl?: string | null`

## `Protected`

- Arquivo: `mobile/src/components/Protected.tsx`
- Props:
  - `permission: string`
  - `children: React.ReactNode`
- Comportamento: se `hasAccess(user, permission)` for `false`, renderiza uma tela de “Acesso Negado” e oferece botão para navegar para `Dashboard`.

## `PlanUpgradeModal`

- Arquivo: `mobile/src/components/PlanUpgradeModal.tsx`
- Props:
  - `visible: boolean`
  - `onClose: () => void`
  - `currentPlan?: { name: string; maxMembers: number | null }`
- Integração:
  - carrega planos via `plansApi.getAll()` (`GET /plans`)
  - inicia checkout via `subscriptionApi.checkout(planId, 7)` (`POST /api/subscriptions/checkout`)
  - abre `checkoutUrl` via `Linking.openURL`

## `MemberSearch`

- Arquivo: `mobile/src/components/MemberSearch.tsx`
- Props:
  - `value?: string`
  - `onChange: (memberId: string | null, memberName?: string) => void`
  - `placeholder?: string`
- Comportamento:
  - quando o termo tem >= 2 caracteres, busca `GET /members` e filtra localmente (nome/email)
  - debounce ~300ms

## `Tabs`

- Arquivo: `mobile/src/components/Tabs.tsx`
- Tipos:
  - `Tab = { key: string; label: string; badge?: number | string }`
- Props:
  - `tabs: Tab[]`
  - `activeTab: string`
  - `onTabChange: (key: string) => void`
  - `style?: object`

## `TimePicker`

- Arquivo: `mobile/src/components/TimePicker.tsx`
- Props:
  - `value?: string` (formato `HH:mm`)
  - `onChange: (time: string) => void`
  - `placeholder?: string`
- Observação: implementa fluxos diferentes para Android (picker inline) e iOS (modal).

## `FormsComponent`

- Arquivo: `mobile/src/components/FormsComponent.tsx`
- Props:
  - `form: any`
  - `setForm: React.Dispatch<React.SetStateAction<any>>`
  - `fields: Field[]`
  - `onSubmit: () => void`
  - `submitLabel?: string` (default `Salvar`)

`Field` (resumo):

- `key`, `label`, `placeholder?`, `required?`
- `type?`: `'string' | 'number' | 'email' | 'password' | 'date' | 'time' | 'image' | 'toggle' | 'select'`
- `dependsOn?`: string (campo booleano que controla visibilidade)
- `options?`: `{ key; label; value }[]` para `select`
- `error?`: string (para feedback/validação)

## `DevotionalCard`

- Arquivo: `mobile/src/components/DevotionalCard.tsx`
- Props (implícitas, sem tipagem explícita no arquivo):
  - `devotional`
  - `refreshDevotionals`
- Integrações:
  - `POST /devotionals/:id/like`
  - `DELETE /devotionals/:id/unlike`
  - Compartilhamento via `Share.share`

## `BibleText`

- Arquivo: `mobile/src/components/BibleText.tsx`
- Props:
  - `passage: string`
- Integração externa: `abibliadigital` (mesmo padrão do web) com token Bearer hardcoded.

## `Header`

- Arquivo: `mobile/src/components/Header.tsx`
- Tipo: default export (sem props).
- Integrações:
  - `GET /auth/me`
  - `GET /events/next`

