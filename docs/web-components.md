# Web (Vite/React) — Componentes reutilizáveis

Origem: `web/src/components/*`.

> Observação: estes componentes assumem o uso de `react-router-dom`, `zustand` (`useAuthStore`) e as permissões/roles no formato do token.

## `Header`

- Arquivo: `web/src/components/Header.tsx`
- Tipo: **default export** (sem props)
- Responsabilidade: topo da aplicação, mostra usuário e executa logout (`useAuthStore.logout()`), com redirect para `/login`.

Uso:

```tsx
import Header from '../components/Header'

export function MinhaTela() {
  return <Header />
}
```

## `OnboardingHeader`

- Arquivo: `web/src/components/OnboardingHeader.tsx`
- Tipo: **default export** (sem props)
- Responsabilidade: header usado no fluxo de onboarding.

## `Layout`

- Arquivo: `web/src/components/Layout.tsx`
- Tipo: **default export** (sem props)
- Responsabilidade: layout base com `Header`, `Sidebar` e `Outlet` (rotas aninhadas).

Uso (router):

```tsx
import { Route } from 'react-router-dom'
import Layout from '../components/Layout'

// <Route path="/app" element={<Layout />}>...</Route>
```

## `Sidebar`

- Arquivo: `web/src/components/Sidebar.tsx`
- Tipo: **default export** (sem props)
- Responsabilidade: menu lateral filtrado por permissões/roles (`hasAccess`, `hasRole`).

Observações:

- Item “Permissões” é exibido se `hasAccess(user, 'MANAGE_PERMISSIONS')` **ou** `hasRole(user, 'ADMINGERAL')`.
- Itens com `permission` exigem `hasAccess(user, permission)`.

## `ProtectedRoute`

- Arquivo: `web/src/components/ProtectedRoute.tsx`
- Props:
  - `children: React.ReactNode`
  - `requireOnboarding?: boolean` (default `true`)
- Comportamento:
  - sem `token` → redireciona `/login`
  - com `token` mas sem `user.branchId` ou `user.role` (e `requireOnboarding=true`) → `/onboarding/start`

Uso:

```tsx
import ProtectedRoute from '../components/ProtectedRoute'

<ProtectedRoute>
  <MinhaTelaProtegida />
</ProtectedRoute>
```

## `PermissionGuard`

- Arquivo: `web/src/components/PermissionGuard.tsx`
- Props:
  - `children: React.ReactNode`
  - `permission: string | string[]` (string = “tem esta”; array = “tem qualquer uma”)
  - `fallback?: React.ReactNode` (default `null`)
- Comportamento: renderiza `children` apenas se o usuário tiver permissão.

Uso:

```tsx
import PermissionGuard from '../components/PermissionGuard'

<PermissionGuard permission="events_manage" fallback={<div>Sem acesso</div>}>
  <BotaoCriarEvento />
</PermissionGuard>
```

## `PermissionProtectedRoute`

- Arquivo: `web/src/components/PermissionProtectedRoute.tsx`
- Props:
  - `children: React.ReactNode`
  - `permission?: string | string[]`
  - `role?: string | string[]`
  - `requireOnboarding?: boolean` (default `true`)
- Comportamento:
  - sem `token` → `/login`
  - sem onboarding (se exigido) → `/onboarding/start`
  - se `role` não atende → renderiza `<Forbidden />`
  - se `permission` não atende → renderiza `<Forbidden />`

## `PlanUpgradeModal`

- Arquivo: `web/src/components/PlanUpgradeModal.tsx`
- Props:
  - `isOpen: boolean`
  - `onClose: () => void`
  - `currentPlan?: { name: string; maxMembers: number | null }`
- Integração:
  - carrega planos via `plansApi.getAll()` (`GET /plans`)
  - inicia checkout via `subscriptionApi.checkout(planId, 7)` (`POST /api/subscriptions/checkout`)
  - se `response.subscription.checkoutUrl` existir, redireciona o browser para o checkout

Uso:

```tsx
import { useState } from 'react'
import PlanUpgradeModal from '../components/PlanUpgradeModal'

export function Exemplo() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>Upgrade</button>
      <PlanUpgradeModal isOpen={open} onClose={() => setOpen(false)} currentPlan={{ name: 'Free', maxMembers: 50 }} />
    </>
  )
}
```

## `MemberSearch`

- Arquivo: `web/src/components/MemberSearch.tsx`
- Props:
  - `value?: string` (ID do membro selecionado)
  - `onChange: (memberId: string | null, memberName?: string) => void`
  - `placeholder?: string`
  - `className?: string`
- Comportamento:
  - quando `searchTerm` tem >= 2 caracteres, busca `GET /members` e filtra localmente por nome/email
  - debounce de ~300ms

Uso:

```tsx
import MemberSearch from '../components/MemberSearch'

<MemberSearch
  value={memberId}
  onChange={(id) => setMemberId(id)}
/>;
```

## `BibleText`

- Arquivo: `web/src/components/BibleText.tsx`
- Props:
  - `passage: string` (ex.: `"João 3:16"`, `"1 Coríntios 13:4"`)
  - `className?: string`
- Integração externa:
  - consome `https://www.abibliadigital.com.br/api/verses/nvi/<livro>/<capitulo>/<verso>`
  - usa `bookTranslation` (`web/src/utils/translateBooks.ts`) para mapear nomes de livros.

Observação importante:

- O componente inclui um **token Bearer hardcoded** no header de chamada à `abibliadigital`. Se isso for sensível para o seu caso, trate como um “segredo” e mova para variável de ambiente/servidor.

