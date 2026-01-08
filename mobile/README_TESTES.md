# Guia oficial de testes — ChurchPulse Mobile

Este documento define o padrão oficial para criação e manutenção de **testes unitários, de integração e E2E** do app mobile (Expo/React Native).

## Objetivos

- **Confiabilidade**: detectar regressões antes de chegar em produção.
- **Velocidade**: feedback rápido no PR (unit/integration) e validação real do fluxo (E2E).
- **Manutenibilidade**: testes legíveis, estáveis e com baixo custo de atualização.

## Stack e configuração atual

- **Runner**: Jest (`jest`, `jest-expo`)
- **UI tests**: React Native Testing Library (`@testing-library/react-native`)
- **Matchers**: `@testing-library/jest-native`
- **Mocks globais**: `src/test/setup.ts` (AsyncStorage, `expo-constants`, Platform, Toast e console)
- **Coverage**: thresholds globais configurados em `jest.config.js`

### Onde olhar a configuração

- **Jest**: `mobile/jest.config.js`
- **Setup de testes**: `mobile/src/test/setup.ts`
- **Exemplos atuais**:
  - `src/__tests__/unit/api/api.test.ts`
  - `src/__tests__/unit/stores/authStore.test.ts`
  - `src/__tests__/unit/components/FormsComponent.test.tsx`
  - `src/__tests__/unit/screens/*.test.tsx`

## Tipos de teste (definição oficial)

### Testes unitários

Validam **uma unidade isolada** (função, store, util, client de API, componente sem navegação/IO real).

- **Exemplos típicos no projeto**:
  - Store Zustand: `authStore`
  - Mapeamento/validação: `utils/*`
  - API client (headers, interceptors, helpers): `api/api.ts`

**Regra**: unitário não depende de rede, storage real, permissões do SO, nem navegação real.

### Testes de integração

Validam **colaboração entre partes** (screen + componentes + store + navegação simulada + API mockada).

- **Exemplos típicos**:
  - “Usuário preenche formulário e salva” (screen + FormsComponent + validação + chamada ao `api.post`)
  - “Carrega lista, exibe estados de loading/empty/error” (screen + API mock + render condicional)

**Regra**: integração pode mockar bordas (API/storage), mas deve exercitar o fluxo do usuário (eventos, texto, navegação).

### Testes E2E

Validam o app “rodando de verdade” (build + navegação real + permissões + back-end simulado/ambiente de testes).

**Regra**: E2E é mais caro e mais lento; foque em fluxos críticos (login, CRUD essencial, permissões, pagamento/assinatura, etc.).

## Estrutura oficial de pastas

Estrutura atual (mantida) e extensões recomendadas:

```
mobile/
├── src/
│   ├── __tests__/
│   │   ├── unit/
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── screens/
│   │   │   └── stores/
│   │   └── integration/              # (recomendado) fluxos por screen/feature
│   └── test/
│       ├── setup.ts                  # setup global do Jest
│       ├── mocks/
│       │   └── mockData.ts
│       └── fixtures/                 # (recomendado) payloads reutilizáveis
└── e2e/                              # (recomendado) testes E2E + config do runner escolhido
```

## Como rodar os testes

Dentro de `mobile/`:

```bash
npm test
```

Watch:

```bash
npm run test:watch
```

Cobertura:

```bash
npm run test:coverage
```

Um arquivo específico:

```bash
npm test -- MemberRegistrationScreen.test.tsx
```

## Padrões obrigatórios (convenções)

- **Nomenclatura**: `*.test.ts` / `*.test.tsx`
- **AAA**: organize o teste em *Arrange → Act → Assert* (mesmo que implicitamente)
- **Isolamento**:
  - use `beforeEach` para resetar store/mocks
  - não dependa de ordem de execução
- **Seletores de UI** (ordem de preferência):
  - `getByRole`/acessibilidade (quando aplicável)
  - `getByText` (textos estáveis)
  - `getByPlaceholderText` (bom para inputs)
  - `getByTestId` (apenas para casos onde não há seletor melhor)
- **Assíncrono**: ao esperar renderizações/requisições, use `await waitFor(...)`

## Estratégia oficial de mocking

### O que já é mockado globalmente

Em `src/test/setup.ts` já existe:

- AsyncStorage mock
- `expo-constants` (com `apiUrl` apontando para `http://localhost:3333`)
- Platform (`OS: 'ios'`)
- Toast (`react-native-toast-message`)
- Silenciamento de logs (`console.*`)

**Regra**: não repita nos testes mocks que já estão no setup, a menos que precise sobrescrever um comportamento específico.

### API

Padrão atual recomendado (já utilizado nos testes):

- Para screens: mockar o módulo `api` do projeto e controlar `api.get/post/...` por teste.
- Para o client: quando necessário, mockar `axios.create` e validar headers/interceptors (como em `api.test.ts`).

**Checklist ao testar API em screens**

- Mockar sucesso e erro (ex.: `mockResolvedValue`, `mockRejectedValue`)
- Verificar payload e endpoint (ex.: `expect(api.post).toHaveBeenCalledWith('/register', {...})`)
- Verificar mensagens de UI/Toast para validação e erros

### Navegação

Padrão atual recomendado:

- Mockar `@react-navigation/native` e retornar `navigate/goBack` espiáveis.
- Em integração, preferir simular `route.params` com `useRoute` (já usado em `MemberRegistrationScreen.test.tsx`).

### Módulos Expo e nativos

Sempre que um componente usar algo “de borda” (permissões, picker, câmera, etc.), mocke apenas o mínimo necessário:

- `expo-image-picker` (permissões + resultado do picker)
- `react-native-modal-datetime-picker` (simular `onConfirm`)
- `Alert.alert` (simular clique no botão correto)

## Como escrever novos testes (templates)

### Template: unitário (função/store)

```ts
import { describe, it, expect, beforeEach, jest } from '@jest/globals'

describe('MinhaUnidade', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve ...', () => {
    // Arrange
    // Act
    // Assert
    expect(true).toBe(true)
  })
})
```

### Template: componente (Testing Library)

```tsx
import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'

describe('MeuComponente', () => {
  it('deve renderizar e reagir ao clique', () => {
    const { getByText } = render(<MeuComponente />)
    fireEvent.press(getByText('Salvar'))
  })
})
```

### Template: screen com API mockada

```tsx
import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import api from '@/api/api'
import Toast from 'react-native-toast-message'

jest.mock('@/api/api')
jest.mock('react-native-toast-message', () => ({ show: jest.fn() }))

describe('MinhaScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve chamar API e mostrar sucesso', async () => {
    ;(api.post as jest.Mock).mockResolvedValue({ data: { success: true } })

    const { getByText } = render(<MinhaScreen />)
    fireEvent.press(getByText('Salvar'))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalled()
      expect(Toast.show).toHaveBeenCalled()
    })
  })
})
```

## Integração: o que priorizar (roteiro recomendado)

Crie testes de integração para fluxos críticos por módulo/feature:

- **Autenticação**
  - login OK / login inválido / token expirado (se aplicável)
  - permissões (UI escondida/mostrada)
- **Eventos**
  - criar evento (validação + sucesso + erro)
  - editar evento (carrega dados + salva)
- **Membros**
  - cadastro (validação + sucesso + erro)
  - limite de membros (quando aplicável)
- **Configurações da igreja / horários de culto**
  - lista / vazio / erro
  - delete com confirmação (com/sem eventos relacionados)

## E2E: estratégia oficial (recomendação e opções)

O projeto hoje não possui runner E2E configurado. Abaixo está o padrão recomendado para adoção.

### Opção A (recomendada): Detox

**Quando escolher**: necessidade de E2E robusto em iOS/Android, com asserts fortes e execução em CI.

**Resumo do caminho** (alto nível):

- Adotar **Expo Dev Client** (para builds E2E) ou workflow compatível com o setup atual.
- Criar pasta `mobile/e2e/` com:
  - specs (`*.e2e.ts`)
  - config Detox
- Padronizar `testID` nos elementos críticos (botões, inputs e listas) para seletores estáveis.
- Criar um “ambiente de testes”:
  - backend de staging/QA **ou**
  - servidor local em CI (quando aplicável)

**Fluxos mínimos sugeridos**:

- Login → dashboard
- Criar evento → ver evento na lista → abrir detalhes
- Criar membro → ver sucesso

### Opção B: Maestro

**Quando escolher**: E2E mais rápido de começar, com fluxos declarativos (YAML), bom para smoke tests.

**Resumo do caminho** (alto nível):

- Criar `mobile/e2e/maestro/` com flows `.yaml`
- Usar `testID`/acessibilidade para seletores
- Rodar smoke suite em CI (por exemplo, nightly)

## Cobertura (policy)

Os thresholds globais atuais estão em `jest.config.js`:

- branches/functions/lines/statements: **50%**

Política recomendada:

- elevar gradualmente por feature, evitando travar o time com metas irreais
- priorizar cobertura em:
  - validações (forms)
  - regras de permissão
  - mapeamentos/transforms (ex.: token → user)
  - fluxos de CRUD

## Checklist de PR (obrigatório)

- [ ] Novo código de regra/validação tem teste unitário
- [ ] Screens com novo fluxo têm teste de integração cobrindo sucesso e erro
- [ ] Mocks não vazam estado entre testes (`beforeEach`, `jest.clearAllMocks`)
- [ ] Não há “sleep” artificial; uso de `waitFor` e condições reais
- [ ] Seletores estáveis (preferir textos estáveis/placeholder; `testID` quando necessário)

## Diagnóstico de flakiness (guia rápido)

- Se um teste falha “às vezes”:
  - verifique `await waitFor` onde há async
  - garanta que mocks são resetados e stores são resetadas
  - evite depender de timers reais; use mocks quando apropriado

## Última atualização

Janeiro/2026















