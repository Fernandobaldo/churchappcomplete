# 🔄 Guia de Componentes e Utilitários Compartilhados

Este documento descreve os componentes e utilitários que são compartilhados ou padronizados entre Mobile e Web.

## 📋 Índice

1. [Utilitários de Autenticação](#utilitários-de-autenticação)
2. [Componentes Protegidos](#componentes-protegidos)
3. [Padrões de Código](#padrões-de-código)
4. [Estrutura de Dados](#estrutura-de-dados)

---

## 🔐 Utilitários de Autenticação

### Mobile: `mobile/src/utils/authUtils.ts`
### Web: `web/src/utils/authUtils.ts`

Ambos os projetos têm utilitários idênticos para verificação de permissões e roles.

### Funções Disponíveis

#### `hasAccess(user, permission)`
Verifica se o usuário tem acesso a uma permissão específica.

```typescript
import { hasAccess } from '../utils/authUtils'
import { useAuthStore } from '../stores/authStore'

function MyComponent() {
  const user = useAuthStore((state) => state.user)
  
  if (hasAccess(user, 'events_manage')) {
    // Usuário tem permissão
  }
}
```

**Regras:**
- `ADMINGERAL` e `ADMINFILIAL` têm acesso a tudo
- Outros roles precisam ter a permissão específica

#### `hasAnyAccess(user, permissions)`
Verifica se o usuário tem acesso a pelo menos uma das permissões.

```typescript
if (hasAnyAccess(user, ['events_manage', 'members_manage'])) {
  // Usuário tem pelo menos uma permissão
}
```

#### `hasAllAccess(user, permissions)`
Verifica se o usuário tem acesso a todas as permissões.

```typescript
if (hasAllAccess(user, ['events_manage', 'members_manage'])) {
  // Usuário tem todas as permissões
}
```

#### `hasRole(user, role)`
Verifica se o usuário tem um role específico.

```typescript
if (hasRole(user, 'ADMINGERAL')) {
  // Usuário é admin geral
}
```

#### `hasAnyRole(user, roles)`
Verifica se o usuário tem pelo menos um dos roles.

```typescript
if (hasAnyRole(user, ['ADMINGERAL', 'ADMINFILIAL'])) {
  // Usuário é admin
}
```

---

## 🛡️ Componentes Protegidos

### Mobile: `Protected`

Componente que renderiza conteúdo apenas se o usuário tiver permissão.

```typescript
import Protected from '../components/Protected'

<Protected permission="events_manage">
  <View>
    {/* Conteúdo protegido */}
  </View>
</Protected>
```

**Comportamento:**
- Se não tiver permissão: mostra mensagem de erro
- Se tiver permissão: renderiza children

### Web: `ProtectedRoute`

Componente que protege rotas inteiras.

```typescript
import ProtectedRoute from '../components/ProtectedRoute'

<Route
  path="/app/admin"
  element={
    <ProtectedRoute>
      <AdminPage />
    </ProtectedRoute>
  }
/>
```

**Comportamento:**
- Se não autenticado: redireciona para `/login`
- Se onboarding não completo: redireciona para `/onboarding/start`
- Se autenticado: renderiza children

---

## 📐 Padrões de Código

### Estrutura de Stores (Zustand)

Ambos os projetos seguem o mesmo padrão:

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      // Estado
      user: null,
      token: null,
      
      // Ações
      setUserFromToken: (token) => {
        // Lógica padronizada
      },
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => storage), // AsyncStorage (Mobile) ou localStorage (Web)
    }
  )
)
```

### Estrutura de API

Ambos os projetos têm configuração similar:

```typescript
// Configuração base
const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Interceptors padronizados
api.interceptors.request.use(/* ... */)
api.interceptors.response.use(/* ... */)
```

### Tratamento de Erros

Padrão comum:

```typescript
try {
  await api.post('/endpoint', data)
  toast.success('Operação realizada!')
} catch (error: any) {
  const errorMessage = error.response?.data?.message || 'Erro desconhecido'
  toast.error(errorMessage)
}
```

---

## 📊 Estrutura de Dados

### User Type

Ambos os projetos usam a mesma estrutura:

```typescript
export type User = {
  id: string
  name: string
  email: string
  role: string
  branchId: string
  permissions: Permission[]
  token: string
}

export type Permission = {
  type: string
}
```

### DecodedToken Type

Estrutura padronizada para tokens JWT:

```typescript
type DecodedToken = {
  sub: string
  email: string
  name?: string
  role?: string | null
  branchId?: string | null
  permissions?: string[]
  // ...
}
```

---

## 🔄 Sincronização

### Checklist de Sincronização

Ao adicionar nova funcionalidade, verifique:

- [ ] Utilitários de autenticação estão sincronizados?
- [ ] Estrutura de dados é compatível?
- [ ] Tratamento de erros é consistente?
- [ ] Componentes protegidos funcionam igual?

### Quando Atualizar

Atualize ambos os projetos quando:
- Adicionar nova permissão
- Mudar estrutura de User
- Adicionar novo utilitário de autenticação
- Mudar lógica de verificação de permissões

---

## 📝 Convenções

### Nomenclatura

- **Funções utilitárias**: camelCase (`hasAccess`, `hasRole`)
- **Componentes**: PascalCase (`Protected`, `ProtectedRoute`)
- **Types**: PascalCase (`User`, `Permission`)

### Organização

- Utilitários em `src/utils/`
- Componentes em `src/components/`
- Stores em `src/stores/`
- Types em arquivos `.ts` ou junto com o código

---

## 🎯 Próximos Passos

- [ ] Criar biblioteca compartilhada de tipos
- [ ] Extrair lógica comum para pacote npm
- [ ] Padronizar mais componentes
- [ ] Criar design system unificado

---

**Última Atualização**: 2024















