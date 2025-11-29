# Plano de Correção: Testes E2E de Deleção de Horários de Culto

## 📋 Problema Identificado

**Status Atual:**
- ✅ 1 teste passando: "deve cancelar deleção quando usuário cancela"
- ❌ 3 testes falhando:
  1. "deve completar fluxo completo de deleção com eventos relacionados"
  2. "deve completar fluxo de deleção sem eventos relacionados"
  3. "deve deletar apenas horário quando usuário escolhe não deletar eventos"

**Causa Raiz:**
O mock de `serviceScheduleApi` não está funcionando corretamente quando há:
- **Import estático** em `ServiceScheduleList.tsx` (linha 3): `import { serviceScheduleApi } from '../../api/serviceScheduleApi'`
- **Import dinâmico** em `ChurchSettings/index.tsx` (linha 138): `const { serviceScheduleApi } = await import('@/api/serviceScheduleApi')`

O Vitest está criando instâncias diferentes do mock para import estático vs dinâmico, causando falhas nos testes.

## 🎯 Objetivo

Garantir que o mock funcione corretamente tanto para import estático quanto dinâmico, permitindo que todos os 4 testes E2E passem.

## 📝 Plano de Ação

### Fase 1: Análise e Diagnóstico ✅ (Concluída)

- [x] Identificar o problema: mock não funciona com import estático + dinâmico
- [x] Verificar que o código do projeto está correto
- [x] Confirmar que o teste "deve cancelar deleção" passa (validação da abordagem)

### Fase 2: Estratégias de Correção

#### Opção A: Usar `vi.doMock` para Import Dinâmico (Recomendada)

**Vantagens:**
- Permite mockar imports dinâmicos explicitamente
- Mais controle sobre quando o mock é aplicado
- Funciona bem com Vitest

**Implementação:**
1. Manter `vi.mock` para import estático
2. Usar `vi.doMock` antes de cada teste que usa import dinâmico
3. Garantir que o mesmo objeto mock seja usado em ambos os casos

#### Opção B: Refatorar para Usar Apenas Import Estático

**Vantagens:**
- Simplifica o mock
- Mais fácil de testar
- Consistente em todo o código

**Desvantagens:**
- Requer mudança no código de produção
- Pode afetar code splitting/performance

#### Opção C: Criar Wrapper/Factory para serviceScheduleApi

**Vantagens:**
- Controle total sobre a instância
- Funciona com qualquer tipo de import
- Mais fácil de mockar

**Desvantagens:**
- Requer refatoração do código
- Adiciona complexidade

### Fase 3: Implementação (Opção A - Recomendada)

#### Passo 1: Ajustar o Mock para Funcionar com Ambos os Imports

```typescript
// Criar uma referência compartilhada ao mock
const createMockApi = () => ({
  getByBranch: vi.fn(),
  getRelatedEventsCount: vi.fn(),
  delete: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  setDefault: vi.fn(),
  createEvents: vi.fn(),
})

// Mock para import estático
vi.mock('@/api/serviceScheduleApi', () => {
  const mockApi = createMockApi()
  return {
    serviceScheduleApi: mockApi,
    ServiceSchedule: {} as any,
  }
})

// Mock para import dinâmico (usar vi.doMock no beforeEach)
```

#### Passo 2: Garantir que o Mock Seja Aplicado Corretamente

1. No `beforeEach`, garantir que `vi.doMock` seja chamado para o import dinâmico
2. Usar a mesma instância do mock para ambos os casos
3. Resetar os mocks corretamente entre testes

#### Passo 3: Ajustar os Testes Individuais

1. Configurar o mock antes de renderizar o componente
2. Garantir que os mocks estejam configurados antes de qualquer interação
3. Adicionar timeouts adequados nos `waitFor`

### Fase 4: Testes e Validação

#### Checklist de Validação

- [ ] Todos os 4 testes passam
- [ ] Não há regressões em outros testes
- [ ] O código de produção não foi alterado (apenas testes)
- [ ] Os mocks estão sendo aplicados corretamente
- [ ] Não há warnings ou erros no console

### Fase 5: Documentação

- [ ] Documentar a solução escolhida
- [ ] Adicionar comentários explicativos no código
- [ ] Atualizar README de testes se necessário

## 🔧 Implementação Detalhada

### Estrutura do Mock Corrigido

#### Solução Recomendada: Usar Referência Compartilhada

```typescript
// Criar factory para o mock que retorna a mesma instância
const createMockServiceScheduleApi = () => ({
  getByBranch: vi.fn(),
  getRelatedEventsCount: vi.fn(),
  delete: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  setDefault: vi.fn(),
  createEvents: vi.fn(),
})

// Variável compartilhada para garantir mesma instância
let sharedMockApi: ReturnType<typeof createMockServiceScheduleApi>

// Mock para import estático - cria a instância compartilhada
vi.mock('@/api/serviceScheduleApi', () => {
  sharedMockApi = createMockServiceScheduleApi()
  return {
    serviceScheduleApi: sharedMockApi,
    ServiceSchedule: {} as any,
  }
})

// Importar após o mock para ter acesso ao objeto mockado
import { serviceScheduleApi } from '@/api/serviceScheduleApi'

// No beforeEach, garantir que o mock dinâmico também use a mesma instância
beforeEach(async () => {
  vi.clearAllMocks()
  mockConfirm.mockReset()
  
  // Garantir que o import dinâmico use a mesma instância
  vi.doMock('@/api/serviceScheduleApi', () => ({
    serviceScheduleApi: sharedMockApi,
    ServiceSchedule: {} as any,
  }))
  
  // Configurar mocks padrão
  vi.mocked(sharedMockApi.getByBranch).mockResolvedValue(mockSchedules)
  vi.mocked(sharedMockApi.getRelatedEventsCount).mockResolvedValue({ 
    count: 0, 
    scheduleTitle: '' 
  })
  vi.mocked(sharedMockApi.delete).mockResolvedValue({ 
    message: 'Horário deletado com sucesso.', 
    deletedEventsCount: 0, 
    relatedEventsCount: 0 
  })
})
```

#### Alternativa: Usar `vi.importActual` e Sobrescrever

```typescript
// Mock que funciona para ambos os casos
vi.mock('@/api/serviceScheduleApi', async () => {
  const actual = await vi.importActual('@/api/serviceScheduleApi')
  const mockApi = {
    getByBranch: vi.fn(),
    getRelatedEventsCount: vi.fn(),
    delete: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    setDefault: vi.fn(),
    createEvents: vi.fn(),
  }
  return {
    ...actual,
    serviceScheduleApi: mockApi,
  }
})
```

### Ajustes nos Testes

1. **Teste 1: "deve completar fluxo completo de deleção com eventos relacionados"**
   - Garantir que `getRelatedEventsCount` retorne `count: 5` antes de renderizar
   - Configurar `mockConfirm` antes de renderizar
   - Aguardar corretamente todas as chamadas assíncronas

2. **Teste 2: "deve completar fluxo de deleção sem eventos relacionados"**
   - Garantir que `getRelatedEventsCount` retorne `count: 0` antes de renderizar
   - Configurar `mockConfirm` antes de renderizar
   - Verificar que apenas uma confirmação é mostrada

3. **Teste 3: "deve deletar apenas horário quando usuário escolhe não deletar eventos"**
   - Garantir que `getRelatedEventsCount` retorne `count: 4` antes de renderizar
   - Configurar `mockConfirm` para confirmar primeira, negar segunda
   - Verificar que `delete` é chamado com `deleteEvents: false`

## 📊 Métricas de Sucesso

- ✅ 4/4 testes passando (100%)
- ✅ Tempo de execução < 20 segundos
- ✅ Sem warnings ou erros
- ✅ Cobertura de código mantida

## 🚨 Riscos e Mitigações

### Risco 1: Mock não funciona com import dinâmico
**Mitigação:** Usar `vi.doMock` explicitamente no `beforeEach`

### Risco 2: Timing issues nos testes
**Mitigação:** Adicionar timeouts adequados e usar `waitFor` corretamente

### Risco 3: Regressões em outros testes
**Mitigação:** Executar toda a suíte de testes após correções

## 📅 Cronograma Estimado

- **Fase 2-3 (Implementação):** 30-45 minutos
- **Fase 4 (Testes e Validação):** 15-20 minutos
- **Fase 5 (Documentação):** 10 minutos

**Total:** ~1 hora

## 🔍 Referências

- [Vitest Mocking Guide](https://vitest.dev/guide/mocking.html)
- [Vitest Dynamic Imports](https://vitest.dev/guide/mocking.html#dynamic-imports)
- Testes E2E existentes em `web/src/__tests__/e2e/`

## 📋 Passos de Implementação Práticos

### Passo 1: Refatorar o Mock (5-10 min)

1. Criar factory function para o mock
2. Criar variável compartilhada `sharedMockApi`
3. Atualizar `vi.mock` para usar a instância compartilhada
4. Adicionar `vi.doMock` no `beforeEach` para import dinâmico

### Passo 2: Ajustar beforeEach (5 min)

1. Garantir que `vi.doMock` seja chamado antes de qualquer configuração
2. Usar `vi.mocked` com a instância compartilhada
3. Configurar valores padrão para todos os mocks

### Passo 3: Ajustar Testes Individuais (15-20 min)

Para cada teste falhando:

1. **Teste 1: "deve completar fluxo completo de deleção com eventos relacionados"**
   ```typescript
   it('deve completar fluxo completo de deleção com eventos relacionados', async () => {
     const user = userEvent.setup()
     
     // Configurar mocks ANTES de renderizar
     vi.mocked(sharedMockApi.getRelatedEventsCount).mockResolvedValue({
       count: 5,
       scheduleTitle: 'Culto Dominical',
     })
     vi.mocked(sharedMockApi.delete).mockResolvedValue({
       message: 'Horário deletado com sucesso.',
       deletedEventsCount: 5,
       relatedEventsCount: 5,
     })
     mockConfirm
       .mockReturnValueOnce(true) // Confirma primeira pergunta
       .mockReturnValueOnce(true) // Confirma deletar eventos
     
     render(...)
     // ... resto do teste
   })
   ```

2. **Teste 2: "deve completar fluxo de deleção sem eventos relacionados"**
   - Similar ao teste 1, mas com `count: 0`
   - Apenas uma confirmação

3. **Teste 3: "deve deletar apenas horário quando usuário escolhe não deletar eventos"**
   - Similar ao teste 1, mas com `count: 4`
   - Primeira confirmação: `true`, segunda: `false`
   - Verificar que `delete` é chamado com `deleteEvents: false`

### Passo 4: Validação (10 min)

1. Executar todos os testes: `npm test -- src/__tests__/e2e/serviceScheduleDelete.test.tsx --run`
2. Verificar que todos os 4 testes passam
3. Executar suíte completa de testes E2E para verificar regressões
4. Verificar console por warnings ou erros

### Passo 5: Limpeza e Documentação (5 min)

1. Remover comentários de debug se houver
2. Adicionar comentários explicativos sobre o mock compartilhado
3. Atualizar este plano com a solução final escolhida

## 🎯 Código Final Esperado

### Estrutura do Mock (topo do arquivo)

```typescript
// Factory para criar mock do serviceScheduleApi
const createMockServiceScheduleApi = () => ({
  getByBranch: vi.fn(),
  getRelatedEventsCount: vi.fn(),
  delete: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  setDefault: vi.fn(),
  createEvents: vi.fn(),
})

// Instância compartilhada - garante que import estático e dinâmico usem o mesmo mock
let sharedMockApi: ReturnType<typeof createMockServiceScheduleApi>

// Mock para import estático
vi.mock('@/api/serviceScheduleApi', () => {
  sharedMockApi = createMockServiceScheduleApi()
  return {
    serviceScheduleApi: sharedMockApi,
    ServiceSchedule: {} as any,
  }
})

// Importar após o mock
import { serviceScheduleApi } from '@/api/serviceScheduleApi'
```

### beforeEach Atualizado

```typescript
beforeEach(async () => {
  vi.clearAllMocks()
  mockConfirm.mockReset()
  
  // IMPORTANTE: Garantir que import dinâmico use a mesma instância
  vi.doMock('@/api/serviceScheduleApi', () => ({
    serviceScheduleApi: sharedMockApi,
    ServiceSchedule: {} as any,
  }))
  
  // Configurar mocks padrão usando a instância compartilhada
  vi.mocked(sharedMockApi.getByBranch).mockResolvedValue(mockSchedules)
  vi.mocked(sharedMockApi.getRelatedEventsCount).mockResolvedValue({ 
    count: 0, 
    scheduleTitle: '' 
  })
  vi.mocked(sharedMockApi.delete).mockResolvedValue({ 
    message: 'Horário deletado com sucesso.', 
    deletedEventsCount: 0, 
    relatedEventsCount: 0 
  })
  
  // Configurar outros mocks
  ;(useAuthStore as any).mockReturnValue({ user: mockUser })
  ;(api.get as any).mockResolvedValue({ data: [mockChurch] })
})
```

## ✅ Checklist Final

- [ ] Mock compartilhado criado e funcionando
- [ ] `vi.doMock` adicionado no `beforeEach`
- [ ] Todos os 4 testes passando
- [ ] Sem regressões em outros testes
- [ ] Código limpo e documentado
- [ ] Tempo de execução aceitável (< 20s)

