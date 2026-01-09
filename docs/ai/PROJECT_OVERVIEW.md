# Project Overview — Mobile App

## Visão Geral

Aplicativo mobile React Native (Expo) para gestão de igrejas, desenvolvido com TypeScript e arquitetura modular focada em reutilização e manutenibilidade.

## Estrutura do Projeto

```
mobile/
├── src/
│   ├── api/                    # Cliente HTTP (axios) e configuração
│   │   ├── api.ts              # Instância axios com interceptors de auth
│   │   └── serviceScheduleApi.ts
│   ├── components/            # Componentes UI reutilizáveis
│   │   ├── layouts/           # Layouts padronizados (ViewScreenLayout, DetailScreenLayout, FormScreenLayout)
│   │   ├── states/            # Componentes de estado (LoadingState, ErrorState, EmptyState)
│   │   ├── BibleText.tsx
│   │   ├── FormsComponent.tsx
│   │   ├── GlassCard.tsx
│   │   ├── Header.tsx
│   │   ├── MemberSearch.tsx
│   │   ├── PageHeader.tsx
│   │   └── ... (outros componentes)
│   ├── hooks/                  # Hooks customizados reutilizáveis
│   │   ├── useAsyncState.ts
│   │   ├── useBiblePassage.ts
│   │   ├── useDebounce.ts
│   │   ├── useMembersSearch.ts
│   │   ├── useMe.ts
│   │   ├── useNextEvent.ts
│   │   └── usePullToRefresh.ts
│   ├── navigation/             # Configuração React Navigation
│   │   ├── AppNavigator.tsx
│   │   └── TabNavigator.tsx
│   ├── screens/                # Telas da aplicação (46 telas)
│   │   ├── DashboardScreen.tsx
│   │   ├── EventsScreen.tsx
│   │   ├── EventDetailsScreen.tsx
│   │   ├── AddEventScreen.tsx
│   │   └── ... (todas as telas)
│   ├── services/              # Camada de serviços (API calls)
│   │   ├── auth.service.ts
│   │   ├── bible.service.ts
│   │   ├── events.service.ts
│   │   ├── members.service.ts
│   │   ├── plans.service.ts
│   │   ├── subscriptions.service.ts
│   │   └── index.ts
│   ├── stores/                # Gerenciamento de estado (Zustand)
│   │   └── authStore.ts
│   ├── theme/                 # Design system
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   └── tokens.ts
│   ├── types/                 # Definições TypeScript
│   └── utils/                 # Funções utilitárias
│       ├── authUtils.ts
│       └── translateBooks.js
├── app.config.js              # Configuração Expo
└── package.json
```

## Tecnologias Principais

- **React Native** (Expo)
- **TypeScript**
- **React Navigation** (navegação)
- **Zustand** (gerenciamento de estado)
- **Axios** (HTTP client)
- **date-fns** (manipulação de datas)
- **expo-linear-gradient** (gradientes)
- **expo-blur** (glassmorphism)

## Arquitetura

### Padrão de Separação de Responsabilidades

```
Screens (Orquestração)
    ↓
Layouts (Scroll, Refresh, Keyboard, States)
    ↓
Components (Apresentação pura)
    ↓
Hooks (Lógica reutilizável)
    ↓
Services (API calls)
```

### Princípios Fundamentais

1. **Componentes são apresentacionais**: Não fazem chamadas de API diretamente
2. **Layouts controlam scroll/refresh/states**: Telas passam handlers, não criam ScrollView manualmente
3. **Serviços encapsulam API**: Toda chamada HTTP passa por services
4. **Hooks abstraem lógica comum**: useAsyncState, usePullToRefresh, etc.
5. **TypeScript em tudo**: Exceto `translateBooks.js` (TODO: converter)

## Padrões de Layout

O app usa **3 layouts padronizados**:

1. **ViewScreenLayout**: Listas, dashboards, telas de visualização
2. **DetailScreenLayout**: Detalhes de itens únicos (eventos, membros, transações)
3. **FormScreenLayout**: Formulários de criação/edição

Ver `MOBILE_LAYOUTS.md` para detalhes completos.

## Estado Padronizado

Todos os layouts suportam estados padronizados via props:
- `loading?: boolean`
- `error?: string | null`
- `empty?: boolean`
- `emptyTitle?: string`
- `emptySubtitle?: string`
- `onRetry?: () => void`

Componentes de estado reutilizáveis em `components/states/`:
- `LoadingState`
- `ErrorState`
- `EmptyState`

## Navegação

- **Stack Navigator**: Navegação principal
- **Tab Navigator**: Navegação por abas (Dashboard, Events, etc.)
- **useFocusEffect**: Recarrega dados quando tela ganha foco

## Autenticação

- Token armazenado em `authStore` (Zustand)
- Interceptors axios adicionam token automaticamente
- `Protected` component para proteção de rotas por permissão

## Design System

- **Cores**: `theme/colors.ts` (gradientes, status, glass, etc.)
- **Tipografia**: `theme/typography.ts` (tamanhos, pesos, line heights)
- **Tokens**: `theme/tokens.ts` (spacing, radius, glass defaults)
- **Glassmorphism**: Padrão visual principal (GlassCard, GlassBackground)

## Convenções de Código

- **TypeScript**: Todas as telas e componentes (.tsx)
- **Nomes de arquivos**: PascalCase para componentes, camelCase para utilitários
- **Exports**: Named exports para tipos, default exports para componentes
- **Imports**: Agrupados por tipo (React, React Native, third-party, local)

## Próximos Passos (TODOs)

- Converter `translateBooks.js` para TypeScript
- Migrar mais componentes para usar services/hooks
- Expandir cobertura de testes
- Documentar APIs específicas

---

**Última atualização:** 2024-12-19

