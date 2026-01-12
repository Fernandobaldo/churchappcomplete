# Relatório de Investigação de Falhas em Testes Unit - Web

**Data**: 2025-02-01  
**Comando Executado**: `npm run test:unit`  
**Ambiente**: Web - Testes Unit  
**Total de Testes**: 170 (149 passaram, 21 falharam)  
**Arquivos de Teste Falhando**: 2 arquivos  
**Suítes Falhando**: 2 suítes

---

## Sumário Executivo

Este relatório documenta a investigação de falhas em testes unit após padronização. Foram identificados **21 testes falhando** em 2 arquivos:

1. **Settings.test.tsx** (2 testes falhando) - Problema com múltiplos elementos com mesmo texto
2. **Start.test.tsx** (5 testes falhando) - Problema com chamada API não mockada

**Causa Raiz Identificada**: 
- **Settings.test.tsx**: Teste usa `getByText` quando deveria usar `getAllByText` ou busca mais específica (texto "convites" aparece em múltiplos lugares)
- **Start.test.tsx**: Componente faz chamada API para `/onboarding/state` no `useEffect`, mas testes não mockam essa chamada, deixando componente em estado de loading infinito

**Classificação Geral**: **STANDARDIZATION** (Alta Confiança)

---

## Tabela de Falhas

| Teste | Arquivo | Sintoma | Causa Provável | Classificação | Confiança |
|-------|---------|---------|----------------|---------------|-----------|
| deve avançar para step 3 (Convites) após selecionar módulos | Settings.test.tsx:82 | Found multiple elements with the text: /convites/i | getByText encontra múltiplos elementos (step indicator + título) | STANDARDIZATION | Alta |
| deve navegar para dashboard ao concluir onboarding | Settings.test.tsx:109 | Found multiple elements with the text: /convites/i | getByText encontra múltiplos elementos (step indicator + título) | STANDARDIZATION | Alta |
| deve renderizar as três opções de estrutura | Start.test.tsx:25 | Componente em loading infinito ("Carregando...") | API `/onboarding/state` não mockada | STANDARDIZATION | Alta |
| deve permitir selecionar estrutura simples | Start.test.tsx:38 | Componente em loading infinito ("Carregando...") | API `/onboarding/state` não mockada | STANDARDIZATION | Alta |
| deve permitir selecionar estrutura com filiais | Start.test.tsx:63 | Componente em loading infinito ("Carregando...") | API `/onboarding/state` não mockada | STANDARDIZATION | Alta |
| deve desabilitar botão continuar quando nenhuma opção está selecionada | Start.test.tsx:87 | Componente em loading infinito ("Carregando...") | API `/onboarding/state` não mockada | STANDARDIZATION | Alta |
| deve navegar de volta ao clicar em voltar | Start.test.tsx:99 | Componente em loading infinito ("Carregando...") | API `/onboarding/state` não mockada | STANDARDIZATION | Alta |

---

## Detalhamento das Falhas

### Problema 1: Settings.test.tsx - Múltiplos Elementos com Mesmo Texto

**Arquivo afetado**: `web/src/__tests__/unit/pages/onboarding/Settings.test.tsx`

#### Sintoma

Testes falham com erro:
```
TestingLibraryElementError: Found multiple elements with the text: /convites/i

Here are the matching elements:
- <span>Convites</span> (step indicator)
- <h2>Enviar Convites</h2> (título do step 3)
- <p>Digite um email por linha. Os convites serão enviados por email.</p> (descrição)
- <button>Enviar Convites</button> (botão)
```

**Stack trace:**
```
TestingLibraryElementError: Found multiple elements with the text: /convites/i
 ❯ src/__tests__/unit/pages/onboarding/Settings.test.tsx:102:11
 ❯ src/__tests__/unit/pages/onboarding/Settings.test.tsx:128:11
```

#### Análise da Causa Raiz

1. **Componente Settings.tsx** (linha 25-29, 260-266, 322-364):
   - O componente renderiza steps com indicadores visuais no topo
   - Cada step tem um título que aparece no indicador: `steps = [{ title: 'Convites', ... }]`
   - No step 3, o título "Enviar Convites" também aparece no conteúdo
   - O texto "convites" aparece em múltiplos lugares:
     - No step indicator: `<span>Convites</span>` (linha 265)
     - No título do step 3: `<h2>Enviar Convites</h2>` (linha 322)
     - Na descrição: `"Os convites serão enviados por email"` (linha 323)
     - No botão: `<button>Enviar Convites</button>` (linha 364)

2. **Teste Atual** (linha 101-103, 127-129):
   ```typescript
   await waitFor(() => {
     expect(screen.getByText(/convites/i)).toBeInTheDocument()
   }, { timeout: 2000 })
   ```
   - Usa `getByText` que falha quando há múltiplos elementos
   - O padrão `/convites/i` é muito genérico e encontra múltiplos elementos

3. **Teste Similar no Mesmo Arquivo** (linha 30):
   ```typescript
   const step1Elements = screen.getAllByText(/roles e permissões/i)
   expect(step1Elements.length).toBeGreaterThan(0)
   ```
   - Teste 1 já usa `getAllByText` corretamente para texto que aparece múltiplas vezes

#### Classificação

**STANDARDIZATION** - O problema está no teste padronizado que usa `getByText` quando deveria usar `getAllByText` ou uma busca mais específica, similar ao teste 1 do mesmo arquivo.

#### Confiança

**Alta** - Evidência clara:
1. O teste 1 do mesmo arquivo já usa `getAllByText` para texto que aparece múltiplas vezes
2. O erro mostra exatamente quais elementos têm o texto "convites"
3. O componente renderiza "convites" em múltiplos lugares (step indicator + conteúdo)

---

### Problema 2: Start.test.tsx - Chamada API Não Mockada

**Arquivo afetado**: `web/src/__tests__/unit/pages/onboarding/Start.test.tsx`

#### Sintoma

Todos os testes falham porque o componente está em estado de loading infinito:
```
TestingLibraryElementError: Unable to find an element with the text: Criar uma igreja.

<body>
  <div>
    <div class="min-h-screen bg-gray-50 flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p class="text-gray-600">Carregando...</p>
      </div>
    </div>
  </div>
</body>
```

**Stack trace:**
```
TestingLibraryElementError: Unable to find an element with the text: Criar uma igreja.
 ❯ src/__tests__/unit/pages/onboarding/Start.test.tsx:30:19
```

#### Análise da Causa Raiz

1. **Componente Start.tsx** (linha 17-57):
   ```typescript
   useEffect(() => {
     const checkOnboardingState = async () => {
       try {
         const response = await api.get('/onboarding/state')
         const state = response.data
         // ... processa state
       } catch (error) {
         // ...
       } finally {
         setLoading(false)  // Só seta loading = false após chamada API
       }
     }
     checkOnboardingState()
   }, [navigate])
   
   if (loading) {
     return <div>Carregando...</div>  // Renderiza loading se loading = true
   }
   ```
   - Componente faz chamada API para `/onboarding/state` no `useEffect`
   - Enquanto `loading = true`, renderiza apenas "Carregando..."
   - `loading` só vira `false` após a chamada API completar (sucesso ou erro)

2. **Teste Atual** (linha 16-33):
   ```typescript
   beforeEach(() => {
     vi.clearAllMocks()
     localStorage.clear()
   })
   
   it('deve renderizar as três opções de estrutura', () => {
     renderWithProviders(<Start />)
     expect(screen.getByText('Criar uma igreja')).toBeInTheDocument()
   })
   ```
   - Teste não mocka `api.get('/onboarding/state')`
   - Como `api.get` está mockado globalmente mas sem implementação específica, a promise nunca resolve
   - Componente fica em `loading = true` infinitamente

3. **Comparação com Outros Testes de Onboarding**:
   - `Branches.test.tsx` e `Church.test.tsx` usam `mockApiResponse` para mockar chamadas API necessárias
   - `Start.test.tsx` não mocka a chamada API necessária

4. **Helper mockApi disponível**:
   - `web/src/test/mockApi.ts` fornece `mockApiResponse` e `mockApiError`
   - Outros testes de onboarding usam esse helper corretamente

#### Classificação

**STANDARDIZATION** - O problema está no teste padronizado que não mocka a chamada API necessária, diferente de outros testes de onboarding que foram padronizados corretamente.

#### Confiança

**Alta** - Evidência clara:
1. Componente faz chamada API no `useEffect` que não é mockada
2. Componente renderiza "Carregando..." enquanto `loading = true`
3. Outros testes de onboarding (`Branches.test.tsx`, `Church.test.tsx`) mockam chamadas API corretamente
4. Helper `mockApiResponse` está disponível e é usado em outros testes

---

## Testes Afetados

### 1. `web/src/__tests__/unit/pages/onboarding/Settings.test.tsx` (2 testes falhando, 3 passando)

**Testes afetados:**
- `deve avançar para step 3 (Convites) após selecionar módulos` (linha 82-104)
- `deve navegar para dashboard ao concluir onboarding` (linha 109-142)

**Testes que passaram:**
- `deve renderizar o step 1 (Roles e Permissões)` (linha 25-34) - Usa `getAllByText` corretamente
- `deve avançar para step 2 após criar roles` (linha 39-53) - Não busca por "convites"
- `deve permitir selecionar/deselecionar módulos no step 2` (linha 58-77) - Não busca por "convites"

**Causa**: Testes usam `getByText(/convites/i)` quando há múltiplos elementos com esse texto.

---

### 2. `web/src/__tests__/unit/pages/onboarding/Start.test.tsx` (5 testes falhando)

**Testes afetados:**
- `deve renderizar as três opções de estrutura` (linha 25-33)
- `deve permitir selecionar estrutura simples` (linha 38-58)
- `deve permitir selecionar estrutura com filiais` (linha 63-82)
- `deve desabilitar botão continuar quando nenhuma opção está selecionada` (linha 87-94)
- `deve navegar de volta ao clicar em voltar` (linha 99-111)

**Causa**: Nenhum teste mocka `api.get('/onboarding/state')`, deixando componente em loading infinito.

---

## Análise do Código do Componente

### Componente Settings.tsx

**Localização**: `web/src/pages/onboarding/Settings.tsx`

**Estrutura de renderização**:
```typescript
// Step indicators (linha 244-277)
steps.map((step) => (
  <span>{step.title}</span>  // "Convites" aparece aqui
))

// Step 3 content (linha 227-228, 322-364)
case 3:
  return <InvitesStep ... />  // Título "Enviar Convites" aparece aqui
```

**Onde "convites" aparece**:
1. Step indicator: `<span>Convites</span>` (linha 265)
2. Título: `<h2>Enviar Convites</h2>` (dentro de InvitesStep)
3. Descrição: Texto sobre "convites serão enviados"
4. Botão: `<button>Enviar Convites</button>`

---

### Componente Start.tsx

**Localização**: `web/src/pages/onboarding/Start.tsx`

**Chamada API no useEffect** (linha 17-57):
```typescript
useEffect(() => {
  const checkOnboardingState = async () => {
    try {
      const response = await api.get('/onboarding/state')  // ❌ Não mockado nos testes
      const state = response.data
      // ... processa state
    } catch (error) {
      // ...
    } finally {
      setLoading(false)  // Só seta false após API completar
    }
  }
  checkOnboardingState()
}, [navigate])

if (loading) {
  return <div>Carregando...</div>  // Renderiza loading
}
```

**Estado inicial**: `const [loading, setLoading] = useState(true)` (linha 15)

---

## Comparação com Testes Similares

### Teste Settings.test.tsx - Teste 1 (PASSOU)

**Código** (linha 30):
```typescript
const step1Elements = screen.getAllByText(/roles e permissões/i)
expect(step1Elements.length).toBeGreaterThan(0)
```

**Por que passou**: Usa `getAllByText` para texto que aparece múltiplas vezes.

---

### Testes Branches.test.tsx e Church.test.tsx (PASSARAM)

**Código exemplo** (`Branches.test.tsx`):
```typescript
beforeEach(() => {
  vi.clearAllMocks()
})

it('deve renderizar formulário com filial padrão', async () => {
  mockApiResponse('get', '/churches', [{ id: 'church-123', name: 'Igreja Teste' }])
  mockApiResponse('get', '/branches', [])
  
  renderWithProviders(<Branches />, { ... })
  // ...
})
```

**Por que passaram**: Mockam todas as chamadas API necessárias usando `mockApiResponse`.

---

## Causa Raiz Identificada

### Problema 1: Settings.test.tsx

**Problema**: Testes usam `getByText(/convites/i)` quando há múltiplos elementos com esse texto no DOM.

**Quando aconteceu**: Durante padronização, os testes foram criados usando `getByText` genérico, mas o componente renderiza "convites" em múltiplos lugares (step indicator + conteúdo do step).

**Assunção incorreta**: Assumiu que `getByText` funcionaria para texto que aparece múltiplas vezes no DOM.

---

### Problema 2: Start.test.tsx

**Problema**: Testes não mockam chamada API para `/onboarding/state` que é feita no `useEffect` do componente.

**Quando aconteceu**: Durante padronização, os testes foram criados sem mockar a chamada API necessária, diferente de outros testes de onboarding.

**Assunção incorreta**: Assumiu que o componente não fazia chamadas API no `useEffect` ou que a chamada seria ignorada.

---

## Recomendações (SEM IMPLEMENTAÇÃO AINDA)

### Recomendação 1: Corrigir Settings.test.tsx

**Prioridade**: Alta  
**Custo**: Baixo  
**Impacto**: Médio

**Ação proposta**:
1. Trocar `getByText(/convites/i)` por busca mais específica
2. Opções:
   - Usar `getAllByText(/convites/i)` e pegar o elemento específico (índice ou filtro)
   - Usar texto mais específico: `getByText(/enviar convites/i)` (título do step 3)
   - Usar `getByRole('heading', { name: /enviar convites/i })` (mais semântico)

**Localização**: `web/src/__tests__/unit/pages/onboarding/Settings.test.tsx` (linha 102, 128)

---

### Recomendação 2: Corrigir Start.test.tsx

**Prioridade**: Alta  
**Custo**: Baixo  
**Impacto**: Alto

**Ação proposta**:
1. Adicionar mock para `api.get('/onboarding/state')` no `beforeEach` ou em cada teste
2. Mockar resposta adequada: `{ status: 'NEW' }` ou `{ status: 'PENDING', ... }`
3. Usar `mockApiResponse` de `@/test/mockApi` para consistência

**Exemplo de correção**:
```typescript
beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  mockApiResponse('get', '/onboarding/state', { status: 'NEW' })
})
```

**Localização**: `web/src/__tests__/unit/pages/onboarding/Start.test.tsx`

---

## Lições Aprendidas / Regras Preventivas

### Lição 1: Testes Devem Usar getAllByText Quando Texto Aparece Múltiplas Vezes

**Problema**: Teste usa `getByText` para texto que aparece múltiplas vezes no DOM (step indicator + conteúdo).

**Regra Preventiva**:
> **REGRA-UI-UNIT-001**: Quando um texto aparece em múltiplos lugares no DOM (ex: step indicators + conteúdo, headers + labels), usar `getAllByText` e selecionar o elemento específico, ou usar busca mais específica (texto completo, role, testID). Sempre verificar quantos elementos correspondem à busca antes de usar `getByText`.

**Checklist de Validação**:
- [ ] Verificar se texto aparece múltiplas vezes no DOM renderizado
- [ ] Se sim, usar `getAllByText` e selecionar elemento específico
- [ ] Ou usar busca mais específica (texto completo, role="heading", testID)
- [ ] Executar teste e verificar se encontra elemento único

---

### Lição 2: Testes Devem Mockar Todas as Chamadas API Feitas no useEffect

**Problema**: Teste não mocka chamada API feita no `useEffect`, deixando componente em loading infinito.

**Regra Preventiva**:
> **REGRA-UI-UNIT-002**: Ao padronizar testes de componentes/páginas, SEMPRE verificar se o componente faz chamadas API no `useEffect`. Se sim, mockar todas as chamadas usando `mockApiResponse` de `@/test/mockApi` no `beforeEach` ou em cada teste. Comparar com outros testes similares para garantir consistência.

**Checklist de Validação**:
- [ ] Verificar `useEffect` do componente e identificar chamadas API
- [ ] Mockar todas as chamadas API usando `mockApiResponse`
- [ ] Verificar outros testes similares para garantir padrão consistente
- [ ] Executar teste e verificar se componente sai do estado de loading

---

### Lição 3: Testes Devem Seguir Padrão Estabelecido em Testes Similares

**Problema**: `Start.test.tsx` não segue o padrão de `Branches.test.tsx` e `Church.test.tsx` que mockam chamadas API.

**Regra Preventiva**:
> **REGRA-UI-UNIT-003**: Ao padronizar testes, sempre verificar testes similares (mesmo tipo de componente, mesma funcionalidade) para garantir padrão consistente. Se testes similares mockam chamadas API, novos testes devem fazer o mesmo.

**Checklist de Validação**:
- [ ] Buscar testes similares (mesmo diretório, mesma funcionalidade)
- [ ] Comparar estrutura (mocks, helpers, padrões)
- [ ] Garantir que novo teste segue padrão estabelecido
- [ ] Documentar padrão se não existir

---

### Lição 4: Testes Devem Verificar Estado de Loading do Componente

**Problema**: Teste não verifica se componente está em loading antes de buscar elementos.

**Regra Preventiva**:
> **REGRA-UI-UNIT-004**: Se um componente tem estado de loading, testes devem aguardar que o componente saia do loading (usando `waitFor` ou mockando chamadas API) antes de buscar elementos. Se componente fica em loading, verificar se chamadas API estão mockadas.

**Checklist de Validação**:
- [ ] Verificar se componente tem estado de loading
- [ ] Se sim, mockar chamadas API ou aguardar loading terminar
- [ ] Usar `waitFor` se necessário para aguardar elementos aparecerem
- [ ] Executar teste e verificar se componente renderiza conteúdo esperado

---

### Lição 5: Testes de Onboarding Devem Mockar /onboarding/state

**Problema**: Componentes de onboarding fazem chamada para `/onboarding/state` no `useEffect`, mas testes não mockam.

**Regra Preventiva**:
> **REGRA-UI-UNIT-005**: Todos os testes de componentes/páginas de onboarding que fazem chamada para `/onboarding/state` DEVEM mockar essa chamada no `beforeEach`. Usar resposta padrão `{ status: 'NEW' }` a menos que teste específico requeira outro status.

**Checklist de Validação**:
- [ ] Verificar se componente faz chamada para `/onboarding/state`
- [ ] Se sim, mockar no `beforeEach` com resposta padrão
- [ ] Documentar padrão em comentário no teste
- [ ] Aplicar padrão em todos os testes de onboarding

---

## Passos de Reprodução

### Reproduzir Problema 1: Settings.test.tsx

```bash
cd web
npm run test:unit -- --run src/__tests__/unit/pages/onboarding/Settings.test.tsx
```

**Resultado Esperado**: 2 testes falhando com erro:
```
TestingLibraryElementError: Found multiple elements with the text: /convites/i
```

### Reproduzir Problema 2: Start.test.tsx

```bash
cd web
npm run test:unit -- --run src/__tests__/unit/pages/onboarding/Start.test.tsx
```

**Resultado Esperado**: 5 testes falhando com erro:
```
TestingLibraryElementError: Unable to find an element with the text: Criar uma igreja.
```

**DOM renderizado**: Apenas "Carregando..." (componente em loading infinito)

---

## Métricas e Impacto

- **Testes Afetados**: 7 testes (4.1% dos testes unit do web)
- **Arquivos Afetados**: 2 arquivos (4.3% dos arquivos de teste padronizados)
- **Taxa de Sucesso**: 149/170 (87.6%) - seria 170/170 (100%) após correção
- **Tempo de Execução**: Não afetado significativamente
- **Severidade**: Média - Bloqueia testes de onboarding, mas não afeta funcionalidade principal

---

## Próximos Passos

1. **Imediato**: Corrigir `Start.test.tsx` adicionando mock para `/onboarding/state`
2. **Imediato**: Corrigir `Settings.test.tsx` usando busca mais específica para "convites"
3. **Curto Prazo**: Verificar se há outros testes de onboarding com mesmo problema
4. **Médio Prazo**: Adicionar checklist de validação para testes de onboarding
5. **Longo Prazo**: Criar helper padrão para mockar `/onboarding/state` em testes de onboarding

---

## Apêndices

### A. Logs Completos de Erro

Ver seleção do terminal fornecida pelo usuário (linhas 1-955).

### B. Arquivos Relacionados

- `web/src/__tests__/unit/pages/onboarding/Settings.test.tsx` - Testes afetados (linha 82-104, 109-142)
- `web/src/__tests__/unit/pages/onboarding/Start.test.tsx` - Testes afetados (todos os 5 testes)
- `web/src/pages/onboarding/Settings.tsx` - Componente (linha 25-29, 244-277, 322-364)
- `web/src/pages/onboarding/Start.tsx` - Componente (linha 15-57, 75-84)
- `web/src/test/mockApi.ts` - Helper disponível para mockar APIs

### C. Comandos Úteis para Debug

```bash
# Verificar chamadas API no componente
grep -n "api.get\|api.post" web/src/pages/onboarding/Start.tsx

# Verificar como outros testes mockam APIs
grep -n "mockApiResponse" web/src/__tests__/unit/pages/onboarding/Branches.test.tsx

# Verificar se há outros testes com mesmo padrão
grep -n "getByText.*convites" web/src/__tests__/unit/pages/onboarding/Settings.test.tsx
```

---

**Fim do Relatório**

**Última atualização:** 2025-02-01  
**Mantido por:** Equipe de QA  
**Versão:** 1.0


**Data**: 2025-02-01  
**Comando Executado**: `npm run test:unit`  
**Ambiente**: Web - Testes Unit  
**Total de Testes**: 170 (149 passaram, 21 falharam)  
**Arquivos de Teste Falhando**: 2 arquivos  
**Suítes Falhando**: 2 suítes

---

## Sumário Executivo

Este relatório documenta a investigação de falhas em testes unit após padronização. Foram identificados **21 testes falhando** em 2 arquivos:

1. **Settings.test.tsx** (2 testes falhando) - Problema com múltiplos elementos com mesmo texto
2. **Start.test.tsx** (5 testes falhando) - Problema com chamada API não mockada

**Causa Raiz Identificada**: 
- **Settings.test.tsx**: Teste usa `getByText` quando deveria usar `getAllByText` ou busca mais específica (texto "convites" aparece em múltiplos lugares)
- **Start.test.tsx**: Componente faz chamada API para `/onboarding/state` no `useEffect`, mas testes não mockam essa chamada, deixando componente em estado de loading infinito

**Classificação Geral**: **STANDARDIZATION** (Alta Confiança)

---

## Tabela de Falhas

| Teste | Arquivo | Sintoma | Causa Provável | Classificação | Confiança |
|-------|---------|---------|----------------|---------------|-----------|
| deve avançar para step 3 (Convites) após selecionar módulos | Settings.test.tsx:82 | Found multiple elements with the text: /convites/i | getByText encontra múltiplos elementos (step indicator + título) | STANDARDIZATION | Alta |
| deve navegar para dashboard ao concluir onboarding | Settings.test.tsx:109 | Found multiple elements with the text: /convites/i | getByText encontra múltiplos elementos (step indicator + título) | STANDARDIZATION | Alta |
| deve renderizar as três opções de estrutura | Start.test.tsx:25 | Componente em loading infinito ("Carregando...") | API `/onboarding/state` não mockada | STANDARDIZATION | Alta |
| deve permitir selecionar estrutura simples | Start.test.tsx:38 | Componente em loading infinito ("Carregando...") | API `/onboarding/state` não mockada | STANDARDIZATION | Alta |
| deve permitir selecionar estrutura com filiais | Start.test.tsx:63 | Componente em loading infinito ("Carregando...") | API `/onboarding/state` não mockada | STANDARDIZATION | Alta |
| deve desabilitar botão continuar quando nenhuma opção está selecionada | Start.test.tsx:87 | Componente em loading infinito ("Carregando...") | API `/onboarding/state` não mockada | STANDARDIZATION | Alta |
| deve navegar de volta ao clicar em voltar | Start.test.tsx:99 | Componente em loading infinito ("Carregando...") | API `/onboarding/state` não mockada | STANDARDIZATION | Alta |

---

## Detalhamento das Falhas

### Problema 1: Settings.test.tsx - Múltiplos Elementos com Mesmo Texto

**Arquivo afetado**: `web/src/__tests__/unit/pages/onboarding/Settings.test.tsx`

#### Sintoma

Testes falham com erro:
```
TestingLibraryElementError: Found multiple elements with the text: /convites/i

Here are the matching elements:
- <span>Convites</span> (step indicator)
- <h2>Enviar Convites</h2> (título do step 3)
- <p>Digite um email por linha. Os convites serão enviados por email.</p> (descrição)
- <button>Enviar Convites</button> (botão)
```

**Stack trace:**
```
TestingLibraryElementError: Found multiple elements with the text: /convites/i
 ❯ src/__tests__/unit/pages/onboarding/Settings.test.tsx:102:11
 ❯ src/__tests__/unit/pages/onboarding/Settings.test.tsx:128:11
```

#### Análise da Causa Raiz

1. **Componente Settings.tsx** (linha 25-29, 260-266, 322-364):
   - O componente renderiza steps com indicadores visuais no topo
   - Cada step tem um título que aparece no indicador: `steps = [{ title: 'Convites', ... }]`
   - No step 3, o título "Enviar Convites" também aparece no conteúdo
   - O texto "convites" aparece em múltiplos lugares:
     - No step indicator: `<span>Convites</span>` (linha 265)
     - No título do step 3: `<h2>Enviar Convites</h2>` (linha 322)
     - Na descrição: `"Os convites serão enviados por email"` (linha 323)
     - No botão: `<button>Enviar Convites</button>` (linha 364)

2. **Teste Atual** (linha 101-103, 127-129):
   ```typescript
   await waitFor(() => {
     expect(screen.getByText(/convites/i)).toBeInTheDocument()
   }, { timeout: 2000 })
   ```
   - Usa `getByText` que falha quando há múltiplos elementos
   - O padrão `/convites/i` é muito genérico e encontra múltiplos elementos

3. **Teste Similar no Mesmo Arquivo** (linha 30):
   ```typescript
   const step1Elements = screen.getAllByText(/roles e permissões/i)
   expect(step1Elements.length).toBeGreaterThan(0)
   ```
   - Teste 1 já usa `getAllByText` corretamente para texto que aparece múltiplas vezes

#### Classificação

**STANDARDIZATION** - O problema está no teste padronizado que usa `getByText` quando deveria usar `getAllByText` ou uma busca mais específica, similar ao teste 1 do mesmo arquivo.

#### Confiança

**Alta** - Evidência clara:
1. O teste 1 do mesmo arquivo já usa `getAllByText` para texto que aparece múltiplas vezes
2. O erro mostra exatamente quais elementos têm o texto "convites"
3. O componente renderiza "convites" em múltiplos lugares (step indicator + conteúdo)

---

### Problema 2: Start.test.tsx - Chamada API Não Mockada

**Arquivo afetado**: `web/src/__tests__/unit/pages/onboarding/Start.test.tsx`

#### Sintoma

Todos os testes falham porque o componente está em estado de loading infinito:
```
TestingLibraryElementError: Unable to find an element with the text: Criar uma igreja.

<body>
  <div>
    <div class="min-h-screen bg-gray-50 flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p class="text-gray-600">Carregando...</p>
      </div>
    </div>
  </div>
</body>
```

**Stack trace:**
```
TestingLibraryElementError: Unable to find an element with the text: Criar uma igreja.
 ❯ src/__tests__/unit/pages/onboarding/Start.test.tsx:30:19
```

#### Análise da Causa Raiz

1. **Componente Start.tsx** (linha 17-57):
   ```typescript
   useEffect(() => {
     const checkOnboardingState = async () => {
       try {
         const response = await api.get('/onboarding/state')
         const state = response.data
         // ... processa state
       } catch (error) {
         // ...
       } finally {
         setLoading(false)  // Só seta loading = false após chamada API
       }
     }
     checkOnboardingState()
   }, [navigate])
   
   if (loading) {
     return <div>Carregando...</div>  // Renderiza loading se loading = true
   }
   ```
   - Componente faz chamada API para `/onboarding/state` no `useEffect`
   - Enquanto `loading = true`, renderiza apenas "Carregando..."
   - `loading` só vira `false` após a chamada API completar (sucesso ou erro)

2. **Teste Atual** (linha 16-33):
   ```typescript
   beforeEach(() => {
     vi.clearAllMocks()
     localStorage.clear()
   })
   
   it('deve renderizar as três opções de estrutura', () => {
     renderWithProviders(<Start />)
     expect(screen.getByText('Criar uma igreja')).toBeInTheDocument()
   })
   ```
   - Teste não mocka `api.get('/onboarding/state')`
   - Como `api.get` está mockado globalmente mas sem implementação específica, a promise nunca resolve
   - Componente fica em `loading = true` infinitamente

3. **Comparação com Outros Testes de Onboarding**:
   - `Branches.test.tsx` e `Church.test.tsx` usam `mockApiResponse` para mockar chamadas API necessárias
   - `Start.test.tsx` não mocka a chamada API necessária

4. **Helper mockApi disponível**:
   - `web/src/test/mockApi.ts` fornece `mockApiResponse` e `mockApiError`
   - Outros testes de onboarding usam esse helper corretamente

#### Classificação

**STANDARDIZATION** - O problema está no teste padronizado que não mocka a chamada API necessária, diferente de outros testes de onboarding que foram padronizados corretamente.

#### Confiança

**Alta** - Evidência clara:
1. Componente faz chamada API no `useEffect` que não é mockada
2. Componente renderiza "Carregando..." enquanto `loading = true`
3. Outros testes de onboarding (`Branches.test.tsx`, `Church.test.tsx`) mockam chamadas API corretamente
4. Helper `mockApiResponse` está disponível e é usado em outros testes

---

## Testes Afetados

### 1. `web/src/__tests__/unit/pages/onboarding/Settings.test.tsx` (2 testes falhando, 3 passando)

**Testes afetados:**
- `deve avançar para step 3 (Convites) após selecionar módulos` (linha 82-104)
- `deve navegar para dashboard ao concluir onboarding` (linha 109-142)

**Testes que passaram:**
- `deve renderizar o step 1 (Roles e Permissões)` (linha 25-34) - Usa `getAllByText` corretamente
- `deve avançar para step 2 após criar roles` (linha 39-53) - Não busca por "convites"
- `deve permitir selecionar/deselecionar módulos no step 2` (linha 58-77) - Não busca por "convites"

**Causa**: Testes usam `getByText(/convites/i)` quando há múltiplos elementos com esse texto.

---

### 2. `web/src/__tests__/unit/pages/onboarding/Start.test.tsx` (5 testes falhando)

**Testes afetados:**
- `deve renderizar as três opções de estrutura` (linha 25-33)
- `deve permitir selecionar estrutura simples` (linha 38-58)
- `deve permitir selecionar estrutura com filiais` (linha 63-82)
- `deve desabilitar botão continuar quando nenhuma opção está selecionada` (linha 87-94)
- `deve navegar de volta ao clicar em voltar` (linha 99-111)

**Causa**: Nenhum teste mocka `api.get('/onboarding/state')`, deixando componente em loading infinito.

---

## Análise do Código do Componente

### Componente Settings.tsx

**Localização**: `web/src/pages/onboarding/Settings.tsx`

**Estrutura de renderização**:
```typescript
// Step indicators (linha 244-277)
steps.map((step) => (
  <span>{step.title}</span>  // "Convites" aparece aqui
))

// Step 3 content (linha 227-228, 322-364)
case 3:
  return <InvitesStep ... />  // Título "Enviar Convites" aparece aqui
```

**Onde "convites" aparece**:
1. Step indicator: `<span>Convites</span>` (linha 265)
2. Título: `<h2>Enviar Convites</h2>` (dentro de InvitesStep)
3. Descrição: Texto sobre "convites serão enviados"
4. Botão: `<button>Enviar Convites</button>`

---

### Componente Start.tsx

**Localização**: `web/src/pages/onboarding/Start.tsx`

**Chamada API no useEffect** (linha 17-57):
```typescript
useEffect(() => {
  const checkOnboardingState = async () => {
    try {
      const response = await api.get('/onboarding/state')  // ❌ Não mockado nos testes
      const state = response.data
      // ... processa state
    } catch (error) {
      // ...
    } finally {
      setLoading(false)  // Só seta false após API completar
    }
  }
  checkOnboardingState()
}, [navigate])

if (loading) {
  return <div>Carregando...</div>  // Renderiza loading
}
```

**Estado inicial**: `const [loading, setLoading] = useState(true)` (linha 15)

---

## Comparação com Testes Similares

### Teste Settings.test.tsx - Teste 1 (PASSOU)

**Código** (linha 30):
```typescript
const step1Elements = screen.getAllByText(/roles e permissões/i)
expect(step1Elements.length).toBeGreaterThan(0)
```

**Por que passou**: Usa `getAllByText` para texto que aparece múltiplas vezes.

---

### Testes Branches.test.tsx e Church.test.tsx (PASSARAM)

**Código exemplo** (`Branches.test.tsx`):
```typescript
beforeEach(() => {
  vi.clearAllMocks()
})

it('deve renderizar formulário com filial padrão', async () => {
  mockApiResponse('get', '/churches', [{ id: 'church-123', name: 'Igreja Teste' }])
  mockApiResponse('get', '/branches', [])
  
  renderWithProviders(<Branches />, { ... })
  // ...
})
```

**Por que passaram**: Mockam todas as chamadas API necessárias usando `mockApiResponse`.

---

## Causa Raiz Identificada

### Problema 1: Settings.test.tsx

**Problema**: Testes usam `getByText(/convites/i)` quando há múltiplos elementos com esse texto no DOM.

**Quando aconteceu**: Durante padronização, os testes foram criados usando `getByText` genérico, mas o componente renderiza "convites" em múltiplos lugares (step indicator + conteúdo do step).

**Assunção incorreta**: Assumiu que `getByText` funcionaria para texto que aparece múltiplas vezes no DOM.

---

### Problema 2: Start.test.tsx

**Problema**: Testes não mockam chamada API para `/onboarding/state` que é feita no `useEffect` do componente.

**Quando aconteceu**: Durante padronização, os testes foram criados sem mockar a chamada API necessária, diferente de outros testes de onboarding.

**Assunção incorreta**: Assumiu que o componente não fazia chamadas API no `useEffect` ou que a chamada seria ignorada.

---

## Recomendações (SEM IMPLEMENTAÇÃO AINDA)

### Recomendação 1: Corrigir Settings.test.tsx

**Prioridade**: Alta  
**Custo**: Baixo  
**Impacto**: Médio

**Ação proposta**:
1. Trocar `getByText(/convites/i)` por busca mais específica
2. Opções:
   - Usar `getAllByText(/convites/i)` e pegar o elemento específico (índice ou filtro)
   - Usar texto mais específico: `getByText(/enviar convites/i)` (título do step 3)
   - Usar `getByRole('heading', { name: /enviar convites/i })` (mais semântico)

**Localização**: `web/src/__tests__/unit/pages/onboarding/Settings.test.tsx` (linha 102, 128)

---

### Recomendação 2: Corrigir Start.test.tsx

**Prioridade**: Alta  
**Custo**: Baixo  
**Impacto**: Alto

**Ação proposta**:
1. Adicionar mock para `api.get('/onboarding/state')` no `beforeEach` ou em cada teste
2. Mockar resposta adequada: `{ status: 'NEW' }` ou `{ status: 'PENDING', ... }`
3. Usar `mockApiResponse` de `@/test/mockApi` para consistência

**Exemplo de correção**:
```typescript
beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  mockApiResponse('get', '/onboarding/state', { status: 'NEW' })
})
```

**Localização**: `web/src/__tests__/unit/pages/onboarding/Start.test.tsx`

---

## Lições Aprendidas / Regras Preventivas

### Lição 1: Testes Devem Usar getAllByText Quando Texto Aparece Múltiplas Vezes

**Problema**: Teste usa `getByText` para texto que aparece múltiplas vezes no DOM (step indicator + conteúdo).

**Regra Preventiva**:
> **REGRA-UI-UNIT-001**: Quando um texto aparece em múltiplos lugares no DOM (ex: step indicators + conteúdo, headers + labels), usar `getAllByText` e selecionar o elemento específico, ou usar busca mais específica (texto completo, role, testID). Sempre verificar quantos elementos correspondem à busca antes de usar `getByText`.

**Checklist de Validação**:
- [ ] Verificar se texto aparece múltiplas vezes no DOM renderizado
- [ ] Se sim, usar `getAllByText` e selecionar elemento específico
- [ ] Ou usar busca mais específica (texto completo, role="heading", testID)
- [ ] Executar teste e verificar se encontra elemento único

---

### Lição 2: Testes Devem Mockar Todas as Chamadas API Feitas no useEffect

**Problema**: Teste não mocka chamada API feita no `useEffect`, deixando componente em loading infinito.

**Regra Preventiva**:
> **REGRA-UI-UNIT-002**: Ao padronizar testes de componentes/páginas, SEMPRE verificar se o componente faz chamadas API no `useEffect`. Se sim, mockar todas as chamadas usando `mockApiResponse` de `@/test/mockApi` no `beforeEach` ou em cada teste. Comparar com outros testes similares para garantir consistência.

**Checklist de Validação**:
- [ ] Verificar `useEffect` do componente e identificar chamadas API
- [ ] Mockar todas as chamadas API usando `mockApiResponse`
- [ ] Verificar outros testes similares para garantir padrão consistente
- [ ] Executar teste e verificar se componente sai do estado de loading

---

### Lição 3: Testes Devem Seguir Padrão Estabelecido em Testes Similares

**Problema**: `Start.test.tsx` não segue o padrão de `Branches.test.tsx` e `Church.test.tsx` que mockam chamadas API.

**Regra Preventiva**:
> **REGRA-UI-UNIT-003**: Ao padronizar testes, sempre verificar testes similares (mesmo tipo de componente, mesma funcionalidade) para garantir padrão consistente. Se testes similares mockam chamadas API, novos testes devem fazer o mesmo.

**Checklist de Validação**:
- [ ] Buscar testes similares (mesmo diretório, mesma funcionalidade)
- [ ] Comparar estrutura (mocks, helpers, padrões)
- [ ] Garantir que novo teste segue padrão estabelecido
- [ ] Documentar padrão se não existir

---

### Lição 4: Testes Devem Verificar Estado de Loading do Componente

**Problema**: Teste não verifica se componente está em loading antes de buscar elementos.

**Regra Preventiva**:
> **REGRA-UI-UNIT-004**: Se um componente tem estado de loading, testes devem aguardar que o componente saia do loading (usando `waitFor` ou mockando chamadas API) antes de buscar elementos. Se componente fica em loading, verificar se chamadas API estão mockadas.

**Checklist de Validação**:
- [ ] Verificar se componente tem estado de loading
- [ ] Se sim, mockar chamadas API ou aguardar loading terminar
- [ ] Usar `waitFor` se necessário para aguardar elementos aparecerem
- [ ] Executar teste e verificar se componente renderiza conteúdo esperado

---

### Lição 5: Testes de Onboarding Devem Mockar /onboarding/state

**Problema**: Componentes de onboarding fazem chamada para `/onboarding/state` no `useEffect`, mas testes não mockam.

**Regra Preventiva**:
> **REGRA-UI-UNIT-005**: Todos os testes de componentes/páginas de onboarding que fazem chamada para `/onboarding/state` DEVEM mockar essa chamada no `beforeEach`. Usar resposta padrão `{ status: 'NEW' }` a menos que teste específico requeira outro status.

**Checklist de Validação**:
- [ ] Verificar se componente faz chamada para `/onboarding/state`
- [ ] Se sim, mockar no `beforeEach` com resposta padrão
- [ ] Documentar padrão em comentário no teste
- [ ] Aplicar padrão em todos os testes de onboarding

---

## Passos de Reprodução

### Reproduzir Problema 1: Settings.test.tsx

```bash
cd web
npm run test:unit -- --run src/__tests__/unit/pages/onboarding/Settings.test.tsx
```

**Resultado Esperado**: 2 testes falhando com erro:
```
TestingLibraryElementError: Found multiple elements with the text: /convites/i
```

### Reproduzir Problema 2: Start.test.tsx

```bash
cd web
npm run test:unit -- --run src/__tests__/unit/pages/onboarding/Start.test.tsx
```

**Resultado Esperado**: 5 testes falhando com erro:
```
TestingLibraryElementError: Unable to find an element with the text: Criar uma igreja.
```

**DOM renderizado**: Apenas "Carregando..." (componente em loading infinito)

---

## Métricas e Impacto

- **Testes Afetados**: 7 testes (4.1% dos testes unit do web)
- **Arquivos Afetados**: 2 arquivos (4.3% dos arquivos de teste padronizados)
- **Taxa de Sucesso**: 149/170 (87.6%) - seria 170/170 (100%) após correção
- **Tempo de Execução**: Não afetado significativamente
- **Severidade**: Média - Bloqueia testes de onboarding, mas não afeta funcionalidade principal

---

## Próximos Passos

1. **Imediato**: Corrigir `Start.test.tsx` adicionando mock para `/onboarding/state`
2. **Imediato**: Corrigir `Settings.test.tsx` usando busca mais específica para "convites"
3. **Curto Prazo**: Verificar se há outros testes de onboarding com mesmo problema
4. **Médio Prazo**: Adicionar checklist de validação para testes de onboarding
5. **Longo Prazo**: Criar helper padrão para mockar `/onboarding/state` em testes de onboarding

---

## Apêndices

### A. Logs Completos de Erro

Ver seleção do terminal fornecida pelo usuário (linhas 1-955).

### B. Arquivos Relacionados

- `web/src/__tests__/unit/pages/onboarding/Settings.test.tsx` - Testes afetados (linha 82-104, 109-142)
- `web/src/__tests__/unit/pages/onboarding/Start.test.tsx` - Testes afetados (todos os 5 testes)
- `web/src/pages/onboarding/Settings.tsx` - Componente (linha 25-29, 244-277, 322-364)
- `web/src/pages/onboarding/Start.tsx` - Componente (linha 15-57, 75-84)
- `web/src/test/mockApi.ts` - Helper disponível para mockar APIs

### C. Comandos Úteis para Debug

```bash
# Verificar chamadas API no componente
grep -n "api.get\|api.post" web/src/pages/onboarding/Start.tsx

# Verificar como outros testes mockam APIs
grep -n "mockApiResponse" web/src/__tests__/unit/pages/onboarding/Branches.test.tsx

# Verificar se há outros testes com mesmo padrão
grep -n "getByText.*convites" web/src/__tests__/unit/pages/onboarding/Settings.test.tsx
```

---

**Fim do Relatório**

**Última atualização:** 2025-02-01  
**Mantido por:** Equipe de QA  
**Versão:** 1.0

