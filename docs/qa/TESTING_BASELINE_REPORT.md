# Relatório de Baseline de Testes

**Data:** 2025-02-01  
**Versão:** 1.0  
**Status:** Documentação de estado atual (sem mudanças de código)

---

## 📋 Sumário Executivo

Este documento descreve o estado atual da infraestrutura de testes no repositório, incluindo frameworks utilizados, estrutura de pastas, scripts disponíveis, ferramentas E2E e configurações de cobertura.

---

## 1️⃣ Frameworks de Teste

### Backend

**Framework:** Vitest  
**Versão:** 3.2.4  
**Arquivo de configuração:** `backend/vitest.config.ts`

**Detalhes:**
- Pool: `forks` (singleFork: true) - execução sequencial
- Timeout padrão: 10 segundos
- Setup file: `backend/tests/setupTestEnv.ts`
- Execução: via `dotenv-cli` com `.env.test`

**Dependências de teste:**
- `vitest`: ^3.2.4
- `supertest`: ^7.1.1 (para testes HTTP)
- `allure-vitest`: ^3.3.0 (relatórios)

---

### Mobile

**Framework:** Jest (jest-expo)  
**Versão:** Jest 29.7.0, jest-expo ~54.0.0  
**Arquivo de configuração:** `mobile/jest.config.js`

**Detalhes:**
- Preset: `jest-expo`
- Setup file: `mobile/src/test/setup.ts`
- Test match: `**/__tests__/**/*.test.{ts,tsx}`
- Module name mapper: `^@/(.*)$` → `<rootDir>/src/$1`

**Dependências de teste:**
- `jest`: ^29.7.0
- `jest-expo`: ~54.0.0
- `@testing-library/react-native`: ^12.4.3
- `@testing-library/jest-native`: ^5.4.3
- `react-test-renderer`: 19.1.0

**Transform ignore patterns:**
- Exclui node_modules exceto: react-native, @react-native, expo, @expo, react-navigation, @react-navigation, @unimodules, native-base, react-native-svg

---

### Web

**Framework:** Vitest  
**Versão:** 4.0.9  
**Arquivo de configuração:** `web/vitest.config.ts`

**Detalhes:**
- Environment: `happy-dom`
- Setup file: `web/src/test/setup.ts`
- Globals: `true`
- CSS: habilitado
- Timeout padrão: 15 segundos
- Alias: `@` → `./src`

**Dependências de teste:**
- `vitest`: ^4.0.9
- `@vitest/coverage-v8`: ^4.0.9
- `@vitest/ui`: ^4.0.9
- `@testing-library/react`: ^16.3.0
- `@testing-library/user-event`: ^14.6.1
- `@testing-library/jest-dom`: ^6.9.1
- `happy-dom`: ^20.0.10
- `jsdom`: ^27.2.0 (backup)
- `msw`: ^2.12.2 (Mock Service Worker)

---

### Web-Admin

**Framework:** Vitest + Playwright  
**Versão:** Vitest 4.0.9, Playwright 1.57.0  
**Arquivos de configuração:**
- `web-admin/vitest.config.ts` (existe - environment: jsdom)
- `web-admin/playwright.config.ts`

**Detalhes:**
- Vitest: Similar ao `web`
- Playwright: Configurado para E2E
  - Test dir: `./src/__tests__/e2e`
  - Base URL: `http://localhost:3001`
  - Reporter: HTML
  - Browser: Chromium (Desktop Chrome)

**Dependências de teste:**
- `vitest`: ^4.0.9
- `@vitest/coverage-v8`: ^4.0.9
- `@vitest/ui`: ^4.0.9
- `@playwright/test`: ^1.57.0
- `@testing-library/react`: ^16.3.0

---

## 2️⃣ Estrutura de Pastas e Padrões de Nomenclatura

### Backend

**Estrutura base:** `backend/tests/`

**Padrões identificados:**
- Unit tests: `tests/unit/**/*.test.ts`
- Integration tests: `tests/integration/**/*.test.ts`
- E2E tests: `tests/e2e/**/*.test.ts`
- Admin tests: `tests/unit/admin/**/*.test.ts` e `tests/integration/admin/**/*.test.ts`

**Estrutura detalhada:**
```
backend/tests/
├── setupTestEnv.ts                    # Setup global
├── unit/
│   ├── admin/                         # 6 arquivos
│   ├── *.test.ts                      # 12 arquivos
├── integration/
│   ├── admin/                         # 9 arquivos
│   ├── *.test.ts                      # 19 arquivos
├── e2e/
│   ├── *.test.ts                      # 3 arquivos
│   └── helpers/
└── utils/                             # Helpers reutilizáveis
```

**Total de arquivos de teste:** ~54 arquivos `.test.ts`

**Nomenclatura:**
- Formato: `[module/feature][Type].test.ts`
- Exemplos:
  - `authService.test.ts` (unit)
  - `authRoutes.test.ts` (integration)
  - `complete-flow.test.ts` (e2e)
  - `adminAuthService.test.ts` (admin unit)
  - `adminAuthRoutes.test.ts` (admin integration)

---

### Mobile

**Estrutura base:** `mobile/src/__tests__/`

**Padrões identificados:**
- Unit tests: `src/__tests__/unit/**/*.test.{ts,tsx}`
- Integration tests: `src/__tests__/integration/**/*.test.{ts,tsx}`

**Estrutura detalhada:**
```
mobile/src/__tests__/
├── unit/
│   ├── api/                           # 1 arquivo
│   ├── components/                    # 1 arquivo
│   ├── screens/                       # 3 arquivos
│   └── stores/                        # 2 arquivos
├── integration/
│   └── navigation/                    # 1 arquivo
└── (setup em mobile/src/test/)
```

**Total de arquivos de teste:** ~8 arquivos `.test.{ts,tsx}`

**Nomenclatura:**
- Formato: `[Component/Screen/Store][Name].test.{ts,tsx}`
- Exemplos:
  - `authStore.test.ts`
  - `AppNavigator.test.tsx`
  - `ChurchScreen.test.tsx`

---

### Web

**Estrutura base:** `web/src/__tests__/`

**Padrões identificados:**
- Unit tests: `src/__tests__/unit/**/*.test.{ts,tsx}`
- Integration tests: `src/__tests__/integration/**/*.test.{ts,tsx}`
- E2E tests: `src/__tests__/e2e/**/*.test.{ts,tsx}`

**Estrutura detalhada:**
```
web/src/__tests__/
├── unit/
│   ├── api/                           # 8 arquivos
│   ├── components/                    # 7 arquivos
│   ├── pages/                         # 32 arquivos
│   └── stores/                        # 1 arquivo
├── integration/
│   ├── auth/                          # 1 arquivo
│   ├── contributions/                 # 1 arquivo
│   ├── devotionals/                   # 1 arquivo
│   ├── events/                        # 1 arquivo
│   ├── finances/                      # 1 arquivo
│   ├── members/                       # 1 arquivo
│   ├── navigation/                    # 4 arquivos
│   ├── onboarding/                    # 1 arquivo
│   ├── pages/                         # 1 arquivo
│   ├── permissions/                   # 1 arquivo
│   └── profile/                       # 1 arquivo
├── e2e/
│   ├── helpers/
│   ├── onboarding-redirect.test.tsx
│   ├── complete-flow.test.tsx
│   └── [mais arquivos]
└── (setup em web/src/test/)
```

**Total de arquivos de teste:** ~63 arquivos `.test.{ts,tsx}`

**Nomenclatura:**
- Formato: `[Component/Page/Feature][Name].test.{ts,tsx}`
- Exemplos:
  - `Login.test.tsx`
  - `authStore.test.ts`
  - `onboarding-flow.test.tsx` (integration)
  - `complete-flow.test.tsx` (e2e)

---

### Web-Admin

**Estrutura base:** `web-admin/src/__tests__/`

**Padrões identificados:**
- Unit tests: `src/__tests__/unit/**/*.test.{ts,tsx}`
- Integration tests: `src/__tests__/integration/**/*.test.{ts,tsx}`
- E2E tests: `src/__tests__/e2e/**/*.spec.ts` (Playwright usa `.spec.ts`)

**Estrutura detalhada:**
```
web-admin/src/__tests__/
├── unit/
│   ├── components/                    # 4 arquivos
│   ├── pages/                         # 7 arquivos
│   └── utils/                         # 1 arquivo
├── integration/
│   └── admin-auth-flow.test.tsx       # 1 arquivo
├── e2e/
│   ├── admin-login-flow.spec.ts       # Playwright
│   └── admin-dashboard.spec.ts        # Playwright
└── mocks/
```

**Total de arquivos de teste:** ~13 arquivos

**Nomenclatura:**
- Unit/Integration: `[Name].test.{ts,tsx}`
- E2E: `[Name].spec.ts` (Playwright)

---

## 3️⃣ Scripts de Teste no package.json

### Backend (`backend/package.json`)

#### Scripts principais:
```json
"test": "npx dotenv-cli -e .env.test -- vitest"
"test:watch": "vitest watch"
"test:report": "vitest run --reporter=verbose --coverage"
```

#### Scripts por tipo:
```json
"test:unit": "vitest run --dir tests/unit"
"test:integration": "vitest run --dir tests/integration"
"test:e2e": "npm run test:e2e:setup && npx dotenv-cli -e .env.test -- vitest run --dir tests/e2e"
"test:e2e:setup": "tsx tests/e2e/setup-e2e-db.js"
"test:e2e:watch": "npx dotenv-cli -e .env.test -- vitest watch --dir tests/e2e"
```

#### Scripts admin (específicos):
```json
"test:admin:unit": "npx dotenv-cli -e .env.test -- vitest run tests/unit/admin"
"test:admin:integration": "npx dotenv-cli -e .env.test -- vitest run tests/integration/admin"
"test:admin:all": "npx dotenv-cli -e .env.test -- vitest run tests/integration/admin tests/unit/admin"
"test:admin:watch": "npx dotenv-cli -e .env.test -- vitest watch tests/integration/admin tests/unit/admin"
"test:admin:auth": "..."
"test:admin:dashboard": "..."
"test:admin:users": "..."
"test:admin:churches": "..."
"test:admin:plans": "..."
"test:admin:members": "..."
"test:admin:config": "..."
"test:admin:audit": "..."
```

#### Scripts de setup de banco:
```json
"create-test-db": "tsx scripts/create-test-db.js"
"setup-test-db": "npm run create-test-db && npx dotenv-cli -e .env.test -- npx prisma db push --force-reset --accept-data-loss"
"seed:test": "npx dotenv-cli -e .env.test -- tsx prisma/seed.ts"
```

---

### Mobile (`mobile/package.json`)

#### Scripts disponíveis:
```json
"test": "jest"
"test:watch": "jest --watch"
"test:coverage": "jest --coverage"
```

**Nota:** Não há scripts separados para unit/integration/e2e no mobile.

---

### Web (`web/package.json`)

#### Scripts principais:
```json
"test": "vitest"
"test:watch": "vitest watch"
"test:ui": "vitest --ui"
"test:coverage": "vitest --coverage"
```

#### Scripts por tipo:
```json
"test:unit": "vitest run src/__tests__/unit"
"test:integration": "vitest run src/__tests__/integration"
"test:e2e": "vitest run src/__tests__/e2e"
```

---

### Web-Admin (`web-admin/package.json`)

#### Scripts Vitest:
```json
"test": "vitest"
"test:ui": "vitest --ui"
"test:coverage": "vitest --coverage"
"test:unit": "vitest run src/__tests__/unit"
"test:integration": "vitest run src/__tests__/integration"
"test:watch": "vitest watch"
```

#### Scripts Playwright (E2E):
```json
"test:admin:e2e": "playwright test"
"test:admin:e2e:ui": "playwright test --ui"
```

#### Scripts específicos admin:
```json
"test:admin:unit": "vitest run src/__tests__/unit"
"test:admin:login": "vitest run src/__tests__/unit/pages/AdminLogin.test.tsx"
"test:admin:permissions": "vitest run src/__tests__/unit/utils/permissions.test.ts"
"test:admin:all": "vitest run src/__tests__/unit src/__tests__/integration"
"test:admin:watch": "vitest watch src/__tests__/unit src/__tests__/integration"
"test:admin:coverage": "vitest run --coverage src/__tests__/unit src/__tests__/integration"
"test:admin:integration": "vitest run src/__tests__/integration"
```

---

## 4️⃣ Ferramentas E2E

### Backend

**Ferramenta:** Vitest + Supertest  
**Configuração:** Integrado ao Vitest  
**Arquivo de configuração:** `backend/vitest.config.ts`  
**Status:** ✅ Configurado e em uso

**Detalhes:**
- Usa Supertest para requisições HTTP
- Banco de dados de teste via `.env.test`
- Setup script: `backend/tests/e2e/setup-e2e-db.js`
- Testes em: `backend/tests/e2e/*.test.ts`

**Scripts:**
- `npm run test:e2e` - Executa setup + testes E2E
- `npm run test:e2e:setup` - Apenas setup do banco
- `npm run test:e2e:watch` - Watch mode

---

### Mobile

**Ferramenta:** ❌ Nenhuma configurada  
**Status:** Não configurado

**Detalhes:**
- ❌ Detox: Não encontrado (`detox.config.*` não existe)
- ❌ Maestro: Não encontrado (`.maestro/**` não existe)
- ✅ Estrutura planejada: `mobile/e2e/README.md` menciona Detox/Maestro, mas não implementado

**Documentação encontrada:**
- `mobile/e2e/README.md` - Documentação sobre Detox/Maestro (planejado, não implementado)

**Nota:** Mobile tem apenas testes unit e integration (Jest), sem E2E real configurado.

---

### Web

**Ferramenta:** Vitest (simulação E2E via API real)  
**Status:** ✅ Configurado

**Detalhes:**
- Testes E2E fazem chamadas HTTP reais ao backend
- Não usa Playwright/Detox para browser automation
- Usa helpers em `web/src/__tests__/e2e/helpers/apiHelpers.ts`
- Requer backend rodando em modo teste

**Testes E2E:**
- `web/src/__tests__/e2e/complete-flow.test.tsx`
- `web/src/__tests__/e2e/onboarding-redirect.test.tsx`
- `web/src/__tests__/e2e/permissions/permission-flow.test.tsx`
- `web/src/__tests__/e2e/profile/profile-update.test.tsx`
- `web/src/__tests__/e2e/serviceScheduleDelete.test.tsx`

**Script:**
- `npm run test:e2e` - Executa testes E2E

---

### Web-Admin

**Ferramenta:** Playwright  
**Versão:** 1.57.0  
**Status:** ✅ Configurado e em uso

**Arquivo de configuração:** `web-admin/playwright.config.ts`

**Configuração:**
```typescript
testDir: './src/__tests__/e2e'
baseURL: 'http://localhost:3001'
reporter: 'html'
browser: Chromium (Desktop Chrome)
webServer: 'npm run dev' (porta 3001)
```

**Testes E2E encontrados:**
- `web-admin/src/__tests__/e2e/admin-login-flow.spec.ts`
- `web-admin/src/__tests__/e2e/admin-dashboard.spec.ts`

**Scripts:**
- `npm run test:admin:e2e` - Executa testes Playwright
- `npm run test:admin:e2e:ui` - Executa com UI interativa

**Dependência:**
- `@playwright/test`: ^1.57.0 (em devDependencies)

---

## 5️⃣ Cobertura de Testes e Thresholds

### Backend

**Ferramenta:** Vitest Coverage (via `test:report`)  
**Status:** ⚠️ Configurado mas sem thresholds definidos

**Configuração:**
- Arquivo: `backend/vitest.config.ts`
- **Nenhuma configuração de coverage encontrada no vitest.config.ts**
- Script disponível: `npm run test:report` (usa `--coverage`)

**Thresholds:** ❌ Não configurado

---

### Mobile

**Ferramenta:** Jest Coverage  
**Status:** ✅ Configurado com thresholds

**Configuração:** `mobile/jest.config.js`

**Thresholds configurados:**
```javascript
coverageThreshold: {
  global: {
    branches: 50,
    functions: 50,
    lines: 50,
    statements: 50,
  },
}
```

**Collect coverage from:**
```javascript
collectCoverageFrom: [
  'src/**/*.{ts,tsx}',
  '!src/**/*.d.ts',
  '!src/**/__tests__/**',
  '!src/test/**',
]
```

**Script:**
- `npm run test:coverage` - Executa testes com cobertura

---

### Web

**Ferramenta:** @vitest/coverage-v8  
**Status:** ✅ Configurado mas sem thresholds definidos

**Configuração:** `web/vitest.config.ts`

**Detalhes:**
```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  exclude: [
    'node_modules/',
    'src/test/',
    '**/*.d.ts',
    '**/*.config.*',
    '**/mockData',
    '**/fixtures',
    '**/mocks',
  ],
}
```

**Thresholds:** ❌ Não configurado

**Script:**
- `npm run test:coverage` - Executa testes com cobertura

---

### Web-Admin

**Ferramenta:** @vitest/coverage-v8  
**Status:** ✅ Configurado mas sem thresholds definidos

**Configuração:** `web-admin/vitest.config.ts`
- Environment: `jsdom`
- Setup file: `web-admin/src/__tests__/setup.ts`
- Globals: `true`
- CSS: habilitado
- Alias: `@` → `./src`

**Nota:** MSW (Mock Service Worker) configurado no setup para mocking de API.

**Thresholds:** ❌ Não configurado

**Scripts:**
- `npm run test:coverage` - Executa testes com cobertura
- `npm run test:admin:coverage` - Executa testes admin com cobertura

---

## 📊 Resumo por Projeto

| Projeto | Framework | Unit | Integration | E2E | Cobertura | Thresholds |
|---------|-----------|------|-------------|-----|-----------|------------|
| **Backend** | Vitest 3.2.4 | ✅ ~19 | ✅ ~28 | ✅ ~3 | ⚠️ Script disponível | ❌ |
| **Mobile** | Jest 29.7.0 | ✅ ~7 | ✅ ~1 | ❌ | ✅ | ✅ (50%) |
| **Web** | Vitest 4.0.9 | ✅ ~48 | ✅ ~13 | ✅ ~5 | ✅ | ❌ |
| **Web-Admin** | Vitest + Playwright | ✅ ~12 | ✅ ~1 | ✅ ~2 | ✅ | ❌ |

**Legenda:**
- ✅ Configurado e em uso
- ⚠️ Configurado mas sem uso completo
- ❌ Não configurado

---

## 🔍 Detalhes Adicionais

### Backend

**Setup de ambiente:**
- Arquivo: `backend/tests/setupTestEnv.ts`
- Carrega `.env.test` via dotenv
- Sincroniza schema do banco via Prisma `db push` (apenas primeira vez)
- Usa flag global para evitar múltiplas sincronizações

**Helpers reutilizáveis:**
- `backend/tests/utils/testFactories.ts` - Factories para criar entidades de teste
- `backend/tests/utils/resetTestDatabase.ts` - Reset do banco de teste
- `backend/tests/utils/seedTestDatabase.ts` - Seed de dados de teste
- `backend/tests/utils/testResponseHelper.ts` - Helpers para log de responses
- `backend/tests/utils/testErrorHelper.ts` - Helpers para tratamento de erros

**Estrutura de testes:**
- Testes executam sequencialmente (singleFork: true)
- Timeout padrão: 10 segundos
- Todos os testes usam `.env.test` via `dotenv-cli`

---

### Mobile

**Setup de ambiente:**
- Arquivo: `mobile/src/test/setup.ts`
- Mock do AsyncStorage (jest mock)
- Mock do expo-constants
- Mock do React Native Platform
- Mock do Toast

**Helpers de teste:**
- `mobile/src/test/helpers.tsx` - Helpers para render, mocks, etc.

**Estrutura de testes:**
- Usa `jest-expo` preset
- Transform ignore patterns configurados para React Native
- Module name mapper para alias `@/`

---

### Web

**Setup de ambiente:**
- Arquivo: `web/src/test/setup.ts`
- Mock do localStorage
- Mock do window.alert
- Mock do window.location
- Mock do react-hot-toast

**Helpers de teste:**
- `web/src/test/helpers.tsx` - Helpers para render, mocks, etc.
- `web/src/__tests__/e2e/helpers/apiHelpers.ts` - Helpers para chamadas reais à API
- `web/src/__tests__/e2e/helpers/testHelpers.tsx` - Helpers para testes E2E com UI

**Estrutura de testes:**
- Environment: `happy-dom`
- CSS habilitado para testes
- Timeout padrão: 15 segundos
- Alias `@` configurado

**MSW (Mock Service Worker):**
- `msw`: ^2.12.2 instalado (para mocking de API em testes)

---

### Web-Admin

**Setup de ambiente:**
- Similar ao `web` (presumivelmente)

**Testes E2E (Playwright):**
- Configurado para porta 3001
- Web server automático: `npm run dev`
- Retries: 2 em CI, 0 localmente
- Workers: 1 em CI, undefined localmente
- Trace: `on-first-retry`

**Mocks:**
- `web-admin/src/__tests__/mocks/handlers.ts`
- `web-admin/src/__tests__/mocks/server.ts`

---

## 📝 Padrões de Nomenclatura Identificados

### Arquivos de Teste

**Backend:**
- Padrão: `[feature][Type].test.ts`
- Exemplos:
  - `authService.test.ts` (unit)
  - `authRoutes.test.ts` (integration)
  - `complete-flow.test.ts` (e2e)

**Mobile:**
- Padrão: `[Component/Screen/Store][Name].test.{ts,tsx}`
- Exemplos:
  - `authStore.test.ts`
  - `AppNavigator.test.tsx`
  - `ChurchScreen.test.tsx`

**Web:**
- Padrão: Similar ao mobile
- Exemplos:
  - `Login.test.tsx`
  - `onboarding-flow.test.tsx` (integration)
  - `complete-flow.test.tsx` (e2e)

**Web-Admin:**
- Unit/Integration: `[Name].test.{ts,tsx}`
- E2E (Playwright): `[Name].spec.ts`
- Exemplos:
  - `AdminLogin.test.tsx` (unit)
  - `admin-auth-flow.test.tsx` (integration)
  - `admin-login-flow.spec.ts` (e2e)

---

## 🔧 Setup e Configuração

### Backend

**Requisitos:**
- PostgreSQL rodando
- Banco `churchapp_test` criado
- Arquivo `.env.test` configurado com `DATABASE_URL`

**Comandos de setup:**
```bash
npm run create-test-db          # Cria banco de teste
npm run setup-test-db           # Cria banco + aplica schema
npm run seed:test               # Executa seed no banco de teste
```

**Comandos de teste:**
```bash
npm test                        # Todos os testes
npm run test:unit               # Apenas unit
npm run test:integration        # Apenas integration
npm run test:e2e                # Apenas E2E
npm run test:report             # Com cobertura
```

---

### Mobile

**Requisitos:**
- Node.js
- Jest configurado via `jest-expo`

**Comandos de teste:**
```bash
npm test                        # Todos os testes
npm run test:watch              # Watch mode
npm run test:coverage           # Com cobertura
```

---

### Web

**Requisitos:**
- Node.js
- Backend rodando (para E2E)

**Comandos de teste:**
```bash
npm test                        # Todos os testes
npm run test:unit               # Apenas unit
npm run test:integration        # Apenas integration
npm run test:e2e                # Apenas E2E
npm run test:coverage           # Com cobertura
npm run test:ui                 # UI interativa
```

---

### Web-Admin

**Requisitos:**
- Node.js
- Playwright instalado (já está em devDependencies)

**Comandos de teste:**
```bash
npm test                        # Vitest (todos)
npm run test:admin:e2e          # Playwright E2E
npm run test:admin:e2e:ui       # Playwright com UI
npm run test:admin:coverage     # Vitest com cobertura
```

---

## 📈 Métricas de Testes

### Contagem de Arquivos de Teste

| Projeto | Unit | Integration | E2E | Total |
|---------|------|-------------|-----|-------|
| **Backend** | ~18 | ~28 | ~3 | ~54 |
| **Mobile** | ~7 | ~1 | 0 | ~8 |
| **Web** | ~48 | ~13 | ~5 | ~63 |
| **Web-Admin** | ~12 | ~1 | ~2 | ~15 |
| **TOTAL** | ~85 | ~43 | ~10 | ~140 |

**Nota:** Contagens são aproximadas baseadas em estrutura de pastas e padrões de nomenclatura identificados.

---

## ⚠️ Observações e Gaps

### Gaps Identificados

1. **Mobile E2E:**
   - ❌ Detox não configurado
   - ❌ Maestro não configurado
   - ⚠️ Apenas documentação de planejamento em `mobile/e2e/README.md`

2. **Cobertura de Testes:**
   - ⚠️ Backend: Sem thresholds configurados
   - ⚠️ Web: Sem thresholds configurados
   - ⚠️ Web-Admin: Sem thresholds configurados
   - ✅ Mobile: Thresholds configurados (50%)

3. **E2E Tooling:**
   - ✅ Backend: Vitest + Supertest (HTTP)
   - ✅ Web: Vitest (HTTP real)
   - ✅ Web-Admin: Playwright (browser automation)
   - ❌ Mobile: Nenhum (precisa Detox ou Maestro)

4. **Scripts Mobile:**
   - ⚠️ Falta separação de scripts por tipo (unit/integration/e2e)

---

## 📚 Documentação Relacionada

- `docs/qa/ACCOUNT_FLOW_TESTING_STANDARD.md` - Padrões de teste para Account Flow
- `backend/tests/README_TESTES.md` - Documentação de testes do backend
- `backend/tests/e2e/README.md` - Documentação de E2E do backend
- `web/src/__tests__/e2e/README.md` - Documentação de E2E do web
- `mobile/src/__tests__/integration/README.md` - Documentação de integration tests do mobile
- `mobile/e2e/README.md` - Documentação planejada de E2E do mobile

---

## ✅ Conclusão

O repositório possui uma infraestrutura de testes bem estabelecida, com:

**Pontos Fortes:**
- ✅ Frameworks modernos configurados (Vitest, Jest)
- ✅ Estrutura organizada por tipo (unit/integration/e2e)
- ✅ Helpers reutilizáveis disponíveis
- ✅ Scripts organizados e bem nomeados
- ✅ E2E configurado no backend, web e web-admin
- ✅ Cobertura configurada (com thresholds apenas no mobile)

**Melhorias Recomendadas:**
1. Configurar thresholds de cobertura em todos os projetos
2. Configurar Detox ou Maestro para E2E mobile
3. Adicionar scripts separados por tipo no mobile
4. Documentar padrões de nomenclatura de forma explícita

---

**Última atualização:** 2025-02-01  
**Mantido por:** Equipe de QA  
**Versão:** 1.0

