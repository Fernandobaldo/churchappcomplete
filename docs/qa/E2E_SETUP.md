# E2E Setup Guide

**Data:** 2025-02-01  
**Versão:** 1.0  
**Status:** Guia de Configuração

---

## 📋 Visão Geral

Este documento descreve como configurar e executar testes E2E (End-to-End) para Web e Mobile no projeto ChurchApp Complete.

---

## 🌐 Web E2E

### Status Atual

**Dois tipos de E2E disponíveis:**

1. **Vitest E2E** (HTTP real) - ✅ Configurado e funcionando
   - Localização: `web/src/__tests__/e2e/*.test.tsx`
   - Script: `npm run test:e2e`
   - Faz chamadas HTTP reais ao backend
   - Requer backend rodando em modo teste

2. **Playwright E2E** (Browser automation) - ⚠️ Configurado mas não instalado
   - Localização: `web/src/__tests__/e2e/*.spec.ts`
   - Config: `web/playwright.config.ts`
   - Exemplo: `web/src/__tests__/e2e/login-flow.spec.ts`

---

### Vitest E2E (HTTP Real) - ✅ Funcionando

**Como executar:**

```bash
cd web
npm run test:e2e
```

**Requisitos:**
1. Backend rodando em modo teste:
   ```bash
   cd backend
   npm run start:test
   ```
2. Banco de teste configurado (ver `web/src/__tests__/e2e/README.md`)

**Testes disponíveis:**
- `complete-flow.test.tsx` - Fluxo completo
- `onboarding-redirect.test.tsx` - Redirecionamento de onboarding
- `permissions/permission-flow.test.tsx` - Fluxo de permissões
- `profile/profile-update.test.tsx` - Atualização de perfil
- `serviceScheduleDelete.test.tsx` - Exclusão de agenda

---

### Playwright E2E (Browser Automation) - ⚠️ Setup Necessário

**Status:** Configuração criada, mas Playwright não instalado.

#### Instalação

```bash
cd web
npm install -D @playwright/test
npx playwright install chromium
```

#### Configuração

Arquivo `web/playwright.config.ts` já existe com:
- Base URL: `http://localhost:3000`
- Web server: Inicia `npm run dev` automaticamente
- Browser: Chromium (podendo adicionar Firefox/WebKit)

#### Scripts para Adicionar no package.json

```json
{
  "scripts": {
    "test:e2e:playwright": "playwright test",
    "test:e2e:playwright:ui": "playwright test --ui",
    "test:e2e:playwright:headed": "playwright test --headed"
  }
}
```

#### Executar Testes Playwright

```bash
cd web
npm run test:e2e:playwright
```

#### Teste de Exemplo

Arquivo `web/src/__tests__/e2e/login-flow.spec.ts` já existe como exemplo.

**Requisitos:**
1. Backend rodando (pode ser em modo teste ou dev)
2. Playwright iniciará o web server automaticamente
3. TestIDs devem estar adicionados nos componentes (ver `docs/qa/TESTID_CONVENTION.md`)

---

## 📱 Mobile E2E

### Status Atual

**Status:** ❌ Não configurado

**Opções disponíveis:**
1. **Detox** - Não instalado
2. **Maestro** - Documentação e placeholder criados

---

### Opção 1: Maestro (Recomendado)

**Status:** ⚠️ Placeholder criado, setup necessário

#### Por que Maestro?

- Mais fácil de configurar que Detox
- Não requer build especial
- Usa YAML declarativo
- Funciona com Expo

#### Instalação

**macOS:**
```bash
brew tap mobile-dev-inc/tap
brew install maestro
```

**Linux:**
```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

**Windows:**
Baixe do site: https://maestro.mobile.dev/docs/getting-started

#### Verificar Instalação

```bash
maestro --version
```

#### Configuração

1. **Identificar App ID:**

   Verifique `mobile/app.json` ou `mobile/app.config.js`:
   ```json
   {
     "expo": {
       "ios": {
         "bundleIdentifier": "com.churchapp.mobile"
       },
       "android": {
         "package": "com.churchapp.mobile"
       }
     }
   }
   ```

2. **Atualizar appId nos YAMLs:**

   Edite `mobile/e2e/maestro/login-flow.yaml`:
   ```yaml
   appId: com.churchapp.mobile # Atualizar com ID real
   ```

3. **Adicionar TestIDs:**

   Adicione testIDs nos componentes críticos conforme `docs/qa/TESTID_CONVENTION.md`:
   - `login-screen` no LoginScreen
   - `login-email-input` no input de email
   - `login-password-input` no input de senha
   - `login-submit-button` no botão de submit
   - `error-message` em mensagens de erro
   - `dashboard-screen` no DashboardScreen

#### Scripts para Adicionar no package.json

```json
{
  "scripts": {
    "test:e2e": "maestro test mobile/e2e/maestro",
    "test:e2e:ios": "maestro test mobile/e2e/maestro --device ios",
    "test:e2e:android": "maestro test mobile/e2e/maestro --device android"
  }
}
```

#### Executar Testes Maestro

**iOS Simulator:**
```bash
cd mobile
maestro test e2e/maestro/login-flow.yaml --device "iPhone 13"
```

**Android Emulator:**
```bash
cd mobile
maestro test e2e/maestro/login-flow.yaml --device "emulator-5554"
```

**Qualquer dispositivo conectado:**
```bash
cd mobile
maestro test e2e/maestro/login-flow.yaml
```

#### Fluxos de Exemplo

Arquivo `mobile/e2e/maestro/login-flow.yaml` já existe como placeholder.

**Requisitos:**
- App instalado no dispositivo/simulador
- Backend acessível (pode ser via tunnel se necessário)
- TestIDs adicionados nos componentes

---

### Opção 2: Detox (Alternativa)

**Status:** ❌ Não configurado

#### Por que não Detox ainda?

- Requer build especial para testes
- Configuração mais complexa
- Integração com Expo requer mais setup

#### Se decidir usar Detox:

**Instalação:**
```bash
cd mobile
npm install -D detox
npm install -D jest-circus
```

**Configuração necessária:**
1. Criar `mobile/.detoxrc.js`
2. Configurar build scripts
3. Criar testes em `mobile/e2e/detox/`
4. Atualizar `package.json` com scripts

**Documentação:** https://github.com/wix/Detox

**Nota:** Por enquanto, Maestro é recomendado como alternativa mais simples.

---

## 📝 Checklist de Setup

### Web E2E

**Vitest E2E (HTTP real):**
- [x] ✅ Configurado e funcionando
- [x] ✅ Scripts no package.json
- [x] ✅ Testes existentes em `web/src/__tests__/e2e/`

**Playwright E2E (Browser automation):**
- [x] ✅ Config criado (`web/playwright.config.ts`)
- [x] ✅ Teste de exemplo criado
- [ ] ⚠️ **TODO:** Instalar Playwright: `npm install -D @playwright/test`
- [ ] ⚠️ **TODO:** Adicionar scripts no package.json
- [ ] ⚠️ **TODO:** Instalar browsers: `npx playwright install chromium`
- [ ] ⚠️ **TODO:** Adicionar testIDs nos componentes (ver TESTID_CONVENTION.md)

---

### Mobile E2E

**Maestro:**
- [x] ✅ Placeholder YAML criado (`mobile/e2e/maestro/login-flow.yaml`)
- [ ] ⚠️ **TODO:** Instalar Maestro
- [ ] ⚠️ **TODO:** Identificar appId real (verificar app.json/app.config.js)
- [ ] ⚠️ **TODO:** Atualizar appId nos YAMLs
- [ ] ⚠️ **TODO:** Adicionar scripts no package.json
- [ ] ⚠️ **TODO:** Adicionar testIDs nos componentes (ver TESTID_CONVENTION.md)

**Detox:**
- [ ] ❌ **TODO (Opcional):** Se escolher Detox, seguir documentação oficial

---

## 🚀 Passos Rápidos para Começar

### Web - Playwright

```bash
# 1. Instalar Playwright
cd web
npm install -D @playwright/test
npx playwright install chromium

# 2. Adicionar scripts no package.json (manual)
# Ver seção "Scripts para Adicionar" acima

# 3. Adicionar testIDs (ver TESTID_CONVENTION.md)

# 4. Executar
npm run test:e2e:playwright
```

### Mobile - Maestro

```bash
# 1. Instalar Maestro
# macOS:
brew tap mobile-dev-inc/tap && brew install maestro

# 2. Identificar appId
# Verificar mobile/app.json ou app.config.js

# 3. Atualizar appId em mobile/e2e/maestro/*.yaml

# 4. Adicionar testIDs (ver TESTID_CONVENTION.md)

# 5. Build e instalar app no dispositivo
# iOS: npx expo run:ios
# Android: npx expo run:android

# 6. Executar
cd mobile
maestro test e2e/maestro/login-flow.yaml
```

---

## 🔧 Configuração Detalhada

### Web - Playwright

**Arquivo:** `web/playwright.config.ts`

**Principais configurações:**
- `testDir`: `./src/__tests__/e2e` (testes `.spec.ts`)
- `baseURL`: `http://localhost:3000`
- `webServer`: Inicia `npm run dev` automaticamente
- `projects`: Chromium (podendo adicionar outros browsers)

**Variáveis de ambiente:**
- Playwright detecta automaticamente se web server já está rodando
- Se `CI=true`, não reutiliza servidor existente

**Timeouts:**
- Test timeout padrão: 30s (configurável)
- Web server timeout: 120s

---

### Mobile - Maestro

**Estrutura:**
```
mobile/e2e/maestro/
└── login-flow.yaml    # Exemplo de fluxo
```

**Formato YAML:**
- Cada arquivo `.yaml` é um fluxo independente
- Múltiplos fluxos podem ser executados em sequência
- Suporta condições (`when:`), loops, e helpers

**Identificação de elementos:**
1. **Por testID (preferencial):**
   ```yaml
   - tapOn:
       id: "login-submit-button"
   ```

2. **Por texto (fallback):**
   ```yaml
   - tapOn: "Entrar"
   ```

3. **Por coordenadas (último recurso):**
   ```yaml
   - tapOn:
       point: "50%,50%"
   ```

---

## 📋 TestIDs Necessários

### Web

Para Playwright funcionar, adicionar testIDs em:

**Login:**
- `data-testid="login-email-input"`
- `data-testid="login-password-input"`
- `data-testid="login-submit-button"`
- `data-testid="error-message"`

**Dashboard:**
- `data-testid="dashboard-screen"`

**Onboarding:**
- `data-testid="onboarding-start-screen"`

Ver lista completa em `docs/qa/TESTID_CONVENTION.md`

---

### Mobile

Para Maestro funcionar, adicionar testIDs em:

**Login:**
- `testID="login-screen"`
- `testID="login-email-input"`
- `testID="login-password-input"`
- `testID="login-submit-button"`
- `testID="error-message"`

**Dashboard:**
- `testID="dashboard-screen"`

**Onboarding:**
- `testID="onboarding-start-screen"`

Ver lista completa em `docs/qa/TESTID_CONVENTION.md`

---

## 🐛 Troubleshooting

### Web - Playwright

**Erro: "Web server failed to start"**
- Verificar se porta 3000 está disponível
- Verificar se `npm run dev` funciona manualmente
- Aumentar timeout em `playwright.config.ts`

**Erro: "Element not found"**
- Verificar se testIDs foram adicionados
- Usar Playwright Inspector: `npm run test:e2e:playwright:ui`
- Verificar se app está realmente rodando na porta 3000

**Testes lentos:**
- Usar `--workers=1` para debugging
- Verificar network conditions
- Aumentar timeouts se necessário

---

### Mobile - Maestro

**Erro: "App not found"**
- Verificar appId correto no YAML
- Verificar se app está instalado no dispositivo
- Listar dispositivos: `maestro test --list-devices`

**Erro: "Element not found"**
- Verificar se testIDs foram adicionados nos componentes
- Usar `maestro studio` para inspecionar app
- Verificar se elemento está visível (pode precisar scroll)

**Erro: "Cannot connect to device"**
- Verificar se dispositivo/simulador está rodando
- iOS: Verificar se simulador está iniciado
- Android: Verificar se emulador está iniciado e `adb devices` mostra dispositivo

---

## 📚 Referências

### Playwright
- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright Selectors](https://playwright.dev/docs/selectors)

### Maestro
- [Maestro Documentation](https://maestro.mobile.dev)
- [Maestro Commands](https://maestro.mobile.dev/docs/commands)
- [Maestro Studio](https://maestro.mobile.dev/docs/maestro-studio)

### Detox (Opcional)
- [Detox Documentation](https://github.com/wix/Detox)
- [Detox with Expo](https://docs.expo.dev/guides/testing-with-detox/)

---

## ✅ Status Final

### Web E2E

| Tipo | Status | Script | Notas |
|------|--------|--------|-------|
| Vitest (HTTP) | ✅ Funcionando | `npm run test:e2e` | Usa chamadas HTTP reais |
| Playwright | ⚠️ Config criado | `npm run test:e2e:playwright` | Requer instalação |

### Mobile E2E

| Ferramenta | Status | Script | Notas |
|------------|--------|--------|-------|
| Maestro | ⚠️ Placeholder criado | `maestro test e2e/maestro/*.yaml` | Requer instalação e testIDs |
| Detox | ❌ Não configurado | - | Opcional, mais complexo |

---

**Última atualização:** 2025-02-01  
**Mantido por:** Equipe de QA

