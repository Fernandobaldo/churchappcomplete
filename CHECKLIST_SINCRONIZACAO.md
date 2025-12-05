# ✅ Checklist de Sincronização Mobile/Web

Use este checklist para acompanhar o progresso do plano de sincronização.

---

## 🔴 FASE 1: Fundação e Padronização

### 1.1 Padronizar Configuração da API
- [ ] Simplificar `mobile/src/api/api.ts` (manter apenas env vars)
- [ ] Melhorar `web/src/api/api.ts` (adicionar timeout, logs, transform)
- [ ] Criar `.env.example` para Mobile
- [ ] Criar `.env.example` para Web
- [ ] Documentar configuração de API no README

### 1.2 Sincronizar Versões de Dependências
- [ ] Atualizar React Web: 18.2.0 → 19.1.0
- [ ] Atualizar Zustand Web: 4.4.7 → 5.0.4
- [ ] Alinhar axios: Web → 1.8.4
- [ ] Alinhar date-fns: Web → 4.1.0
- [ ] Testar compatibilidade após atualizações
- [ ] Atualizar package-lock.json

### 1.3 Padronizar AuthStore
- [ ] Adicionar try-catch no `web/src/stores/authStore.ts`
- [ ] Adicionar validação de permissions no Web
- [ ] Adicionar log de aviso `branchId` no Mobile
- [ ] Criar testes unitários para AuthStore (Web)
- [ ] Criar testes unitários para AuthStore (Mobile)

### 1.4 Melhorar Tratamento de Erros na API (Web)
- [ ] Adicionar timeout de 30 segundos
- [ ] Adicionar tratamento de Network Error
- [ ] Adicionar tratamento de Timeout
- [ ] Adicionar logs detalhados em desenvolvimento
- [ ] Adicionar transform response (se necessário)

**Status Fase 1**: ⏳ Em Progresso / ✅ Concluída

---

## 🔴 FASE 2: Sincronização de Funcionalidades Core

### 2.1 Adicionar Onboarding no Mobile
- [ ] Criar estrutura de navegação para onboarding
- [ ] Implementar `BemVindoScreen.tsx`
- [ ] Implementar `StartScreen.tsx`
- [ ] Implementar `ChurchScreen.tsx`
- [ ] Implementar `BranchesScreen.tsx`
- [ ] Implementar `SettingsScreen.tsx`
- [ ] Implementar `ConcluidoScreen.tsx`
- [ ] Integrar com API de onboarding
- [ ] Adicionar lógica de redirecionamento
- [ ] Testar fluxo completo
- [ ] Adicionar testes

### 2.2 Adicionar Página de Registro no Mobile
- [ ] Criar `RegisterScreen.tsx`
- [ ] Implementar formulário de registro
- [ ] Integrar com API de registro
- [ ] Adicionar validações
- [ ] Adicionar navegação para registro
- [ ] Testar fluxo de registro
- [ ] Adicionar testes

### 2.3 Adicionar Página de Finanças no Web
- [ ] Criar `pages/Finances/index.tsx`
- [ ] Criar `pages/Finances/AddTransaction.tsx`
- [ ] Criar `pages/Finances/TransactionDetails.tsx`
- [ ] Adicionar rota `/app/finances` no App.tsx
- [ ] Adicionar card de Finanças no Dashboard
- [ ] Adicionar link no Sidebar
- [ ] Implementar integração com API
- [ ] Adicionar testes unitários
- [ ] Adicionar testes de integração

### 2.4 Adicionar Página de Notícias no Web
- [ ] Criar `pages/Notices/index.tsx`
- [ ] Criar `pages/Notices/AddNotice.tsx`
- [ ] Criar `pages/Notices/NoticeDetails.tsx`
- [ ] Adicionar rota `/app/notices` no App.tsx
- [ ] Adicionar card de Notícias no Dashboard (se aplicável)
- [ ] Adicionar link no Sidebar
- [ ] Implementar integração com API
- [ ] Adicionar testes unitários
- [ ] Adicionar testes de integração

**Status Fase 2**: ⏳ Em Progresso / ✅ Concluída

---

## 🟡 FASE 3: Melhorias de Qualidade

### 3.1 Implementar Testes no Mobile
- [ ] Configurar Jest + React Native Testing Library
- [ ] Criar estrutura `src/__tests__/`
- [ ] Implementar `api/api.test.ts`
- [ ] Implementar `stores/authStore.test.ts`
- [ ] Implementar testes de componentes principais
- [ ] Implementar testes de integração (auth flow)
- [ ] Implementar testes de integração (navegação)
- [ ] Configurar coverage
- [ ] Adicionar script `test` no package.json
- [ ] Documentar como rodar testes

### 3.2 Melhorar Documentação
- [ ] Criar README.md unificado na raiz
- [ ] Criar guia de desenvolvimento Mobile
- [ ] Criar guia de desenvolvimento Web
- [ ] Documentar processo de setup
- [ ] Documentar variáveis de ambiente
- [ ] Documentar estrutura de pastas
- [ ] Adicionar diagramas de arquitetura
- [ ] Criar guia de contribuição

### 3.3 Padronizar Componentes Compartilhados
- [ ] Identificar componentes compartilháveis
- [ ] Criar biblioteca compartilhada ou utils comuns
- [ ] Padronizar nomes de componentes similares
- [ ] Documentar componentes principais

**Status Fase 3**: ⏳ Em Progresso / ✅ Concluída

---

## 🟡 FASE 4: Melhorias de UX/UI

### 4.1 Padronizar Design System
- [ ] Criar guia de estilo unificado
- [ ] Definir paleta de cores comum
- [ ] Definir tipografia comum
- [ ] Criar componentes de UI base (Button, Input, Card)
- [ ] Documentar design system

### 4.2 Melhorar Feedback Visual
- [ ] Padronizar mensagens de erro
- [ ] Padronizar mensagens de sucesso
- [ ] Adicionar loading states consistentes
- [ ] Melhorar tratamento de estados vazios
- [ ] Adicionar animações sutis (se aplicável)

**Status Fase 4**: ⏳ Em Progresso / ✅ Concluída

---

## 🟢 FASE 5: Otimizações e Refatoração

### 5.1 Otimizar Performance
- [ ] Analisar bundle size (Web)
- [ ] Implementar code splitting (Web)
- [ ] Otimizar imagens
- [ ] Implementar lazy loading
- [ ] Otimizar re-renders

### 5.2 Refatorar Código Duplicado
- [ ] Identificar código duplicado
- [ ] Extrair lógica comum para utils
- [ ] Refatorar componentes similares
- [ ] Melhorar organização de código

### 5.3 Melhorar TypeScript
- [ ] Adicionar tipos mais específicos
- [ ] Remover `any` types
- [ ] Adicionar interfaces compartilhadas
- [ ] Melhorar type safety

**Status Fase 5**: ⏳ Em Progresso / ✅ Concluída

---

## 📊 Progresso Geral

**Fase 1**: ⏳ 0% / ✅ 100%
**Fase 2**: ⏳ 0% / ✅ 100%
**Fase 3**: ⏳ 0% / ✅ 100%
**Fase 4**: ⏳ 0% / ✅ 100%
**Fase 5**: ⏳ 0% / ✅ 100%

**Progresso Total**: ⏳ 0% / ✅ 100%

---

## 📝 Notas

_Use este espaço para anotações sobre bloqueios, decisões importantes, ou observações gerais._

---

**Última Atualização**: [Data]
**Responsável**: [Nome]











