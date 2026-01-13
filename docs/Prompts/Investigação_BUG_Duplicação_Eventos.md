# 🔍 Análise de Bug: Duplicação de Eventos e Erro de Navegação

## 📋 Resumo Executivo

**Problema:** Quando o usuário cria um evento e clica duas vezes no botão de salvar, o evento é criado duplicado e aparece o erro `The action 'GO_BACK' was not handled by any navigator`.

**Severidade:** Alta - Impacta integridade de dados e experiência do usuário

**Status:** Root causes identificados (2 problemas distintos, afetam múltiplas features)

---

## 🔎 1. Onde o Comportamento se Origina

### 1.1 Mobile - AddEventScreen (PROBLEMA PRINCIPAL)

**Arquivo:** `mobile/src/screens/AddEventScreen.tsx`  
**Função:** `handleSave()` (linhas 113-181)

**Problema Identificado:**
- A função `handleSave` é assíncrona mas **NÃO possui proteção contra múltiplas execuções simultâneas**
- O botão de submit no `FormsComponent` (linha 307-311) só é desabilitado se o formulário for inválido, mas **NÃO durante o processamento**
- Não há estado `loading` ou `saving` para desabilitar o botão durante a requisição
- `navigation.goBack()` (linha 172) pode ser chamado múltiplas vezes se o usuário clicar rapidamente

**Código Relevante:**
```typescript
// Linhas 113-181: handleSave sem proteção contra double-click
const handleSave = async () => {
    // Validação...
    
    try {
        // Upload de imagem (se houver)...
        
        await eventsService.create(payload)  // ← Pode ser chamado múltiplas vezes
        
        Toast.show({ /* success */ })
        
        navigation.goBack()  // ← Pode ser chamado múltiplas vezes, causando erro
    } catch (error) {
        // Tratamento de erro...
    }
}
```

### 1.2 Mobile - FormsComponent (PROBLEMA SECUNDÁRIO)

**Arquivo:** `mobile/src/components/FormsComponent.tsx`  
**Função:** Renderização do botão submit (linhas 307-326)

**Problema Identificado:**
- O botão submit apenas verifica `disabled={!isFormValid}` (linha 311)
- **NÃO aceita prop para desabilitar durante processamento**
- Não há feedback visual de loading durante a submissão
- O componente não gerencia estado interno de submissão

**Código Relevante:**
```typescript
// Linhas 307-326: Botão sem proteção de loading
<TouchableOpacity 
    style={styles.saveButton} 
    onPress={onSubmit}  // ← Pode ser chamado múltiplas vezes
    activeOpacity={0.8}
    disabled={!isFormValid}  // ← Apenas verifica validação, não loading
>
    <LinearGradient>
        <Text style={styles.buttonText}>{submitLabel}</Text>
    </LinearGradient>
</TouchableOpacity>
```

### 1.3 Backend - Events Route (PROBLEMA TERCIÁRIO)

**Arquivo:** `backend/src/routes/eventsRoutes.ts`  
**Função:** Rota `POST /events` (linhas 140-184)

**Problema Identificado:**
- O backend **NÃO possui validação que previne eventos duplicados**
- Simplesmente cria o evento sem verificar se já existe um evento idêntico
- Não há validação de unicidade baseada em título + data + branchId

**Código Relevante:**
```typescript
// Linhas 152-166: Criação direta sem validação de duplicação
const newEvent = await prisma.event.create({
    data: {
        title: data.title,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        // ... outros campos
        branchId: user.branchId!,
    },
})
```

---

## 🔍 2. Por Que Acontece (Root Causes)

### 2.1 Causa Raiz Primária: Falta de Proteção Contra Double-Click

**Problema:** Nenhuma das telas de criação possui mecanismo para prevenir múltiplas submissões simultâneas.

**Evidências:**
- `AddEventScreen.tsx` não tem estado `loading` ou `saving`
- `FormsComponent` não aceita prop para desabilitar botão durante processamento
- O botão permanece clicável durante toda a execução da função assíncrona `handleSave`
- Se o usuário clicar duas vezes rapidamente, duas requisições são enviadas ao backend

**Fluxo do Problema:**
1. Usuário preenche formulário e clica em "Salvar" (primeiro clique)
2. `handleSave()` inicia execução assíncrona
3. Usuário clica novamente antes da primeira requisição completar (segundo clique)
4. Segunda execução de `handleSave()` inicia em paralelo
5. Ambas as requisições são enviadas ao backend
6. Backend cria dois eventos duplicados
7. Primeira execução completa e chama `navigation.goBack()`
8. Segunda execução tenta chamar `navigation.goBack()` mas não há mais tela na pilha
9. React Navigation lança erro: `GO_BACK was not handled by any navigator`

### 2.2 Causa Raiz Secundária: Backend Sem Validação de Duplicação

**Problema:** O backend não verifica se já existe um evento similar antes de criar.

**Impacto:**
- Mesmo com proteção no frontend, requisições simultâneas (race condition) ainda podem criar duplicados
- Não há camada de segurança no backend para prevenir duplicação

### 2.3 Causa Raiz Terciária: Navegação Sem Verificação

**Problema:** `navigation.goBack()` é chamado sem verificar se é possível voltar.

**Impacto:**
- Gera erro de console/logs mesmo quando duplicação não ocorre
- Pode causar comportamento inesperado se a pilha de navegação estiver vazia

---

## 📊 3. Invariantes Violados

### 3.1 Invariante de Idempotência
- **Esperado:** Submissões duplicadas do mesmo formulário não devem criar múltiplos recursos
- **Violado:** Múltiplos cliques criam múltiplos eventos

### 3.2 Invariante de Estado de UI
- **Esperado:** Botões de ação devem estar desabilitados durante processamento assíncrono
- **Violado:** Botão permanece habilitado durante toda a requisição

### 3.3 Invariante de Navegação
- **Esperado:** `navigation.goBack()` só deve ser chamado quando há tela anterior na pilha
- **Violado:** Pode ser chamado múltiplas vezes ou quando não há pilha

---

## 🎯 4. Causas Identificadas

### 4.1 Causa Raiz Primária
**Falta de proteção contra double-click no frontend (mobile)**

**Impacto:**
- Permite múltiplas submissões simultâneas
- Cria eventos duplicados no banco de dados
- Gera erro de navegação nos logs
- Afeta todas as telas de criação (eventos, devocionais, contribuições, etc.)

### 4.2 Causa Raiz Secundária
**Backend sem validação de duplicação**

**Impacto:**
- Não previne duplicação em caso de race conditions
- Falta camada de segurança adicional
- Não há validação de integridade de dados

### 4.3 Fatores Contribuintes
- `FormsComponent` não possui prop para desabilitar botão durante loading
- Falta feedback visual durante processamento (loading spinner)
- Nenhuma verificação antes de chamar `navigation.goBack()`

---

## 🔍 5. Outras Features Afetadas

### 5.1 AddDevotionalScreen
**Arquivo:** `mobile/src/screens/AddDevotionalScreen.tsx`  
**Função:** `handleSave()` (linhas 73-107)

**Problema:** Mesmo padrão - sem proteção contra double-click, `navigation.goBack()` na linha 98

**Evidência:**
- Não possui estado `loading` ou `saving`
- Botão permanece clicável durante toda a execução
- Pode criar devocionais duplicados

### 5.2 AddContributionsScreen
**Arquivo:** `mobile/src/screens/AddContributionsScreen.tsx`  
**Função:** `handleSave()` (linhas 64-126)

**Problema:** Possui `setIsLoading(true)` mas **não desabilita o botão**

**Evidência:**
- Linha 84: `setIsLoading(true)` é definido
- Linha 124: `setIsLoading(false)` no finally
- **Mas o botão não usa esse estado para se desabilitar**
- `navigation.goBack()` na linha 115 pode ser chamado múltiplas vezes

### 5.3 MemberRegistrationScreen
**Arquivo:** `mobile/src/screens/MemberRegistrationScreen.tsx`  
**Função:** `handleRegister()` (linhas 66-115)

**Problema:** Sem proteção contra double-click

**Evidência:**
- Não possui estado de loading
- `navigation.goBack()` na linha 100 pode ser chamado múltiplas vezes

### 5.4 Web - AddEvent.tsx
**Arquivo:** `web/src/pages/Events/AddEvent.tsx`  
**Função:** `onSubmit()` (linhas 90-136)

**Problema:** Possui `disabled={uploadingImage}` mas não protege contra múltiplas submissões do formulário

**Evidência:**
- Linha 317: `disabled={uploadingImage}` apenas durante upload de imagem
- Não há estado para desabilitar durante criação do evento
- `navigate('/app/events')` na linha 132 pode ser chamado múltiplas vezes

---

## 🔧 6. Possíveis Correções

### 6.1 Fix Mínimo (Recomendado Primeiro)

**Ação:** Adicionar proteção contra double-click nas telas de criação

**Mudanças Necessárias:**

**a) AddEventScreen.tsx:**
- Adicionar estado `const [saving, setSaving] = useState(false)`
- Iniciar `setSaving(true)` no início de `handleSave`
- Finalizar `setSaving(false)` no finally
- Verificar `if (saving) return` no início de `handleSave`
- Passar `saving` para `FormsComponent` via prop
- Verificar `navigation.canGoBack()` antes de chamar `navigation.goBack()`

**b) FormsComponent.tsx:**
- Adicionar prop opcional `loading?: boolean` ou `disabled?: boolean`
- Desabilitar botão quando `disabled={!isFormValid || loading}`
- Opcional: Mostrar ActivityIndicator quando loading

**c) Outras telas afetadas:**
- Aplicar mesmo padrão em `AddDevotionalScreen`, `AddContributionsScreen`, `MemberRegistrationScreen`

**Prós:**
- ✅ Resolve o problema imediatamente
- ✅ Baixo risco (apenas adiciona estados e verificações)
- ✅ Não requer mudanças no backend
- ✅ Fácil de implementar e testar
- ✅ Previne duplicação em todas as telas de criação
- ✅ Remove erros de navegação dos logs

**Contras:**
- ❌ Não previne duplicação em caso de requisições simultâneas (race condition extremo)
- ❌ Requer mudanças em múltiplos arquivos (mas padronizado)
- ❌ Não resolve problema no backend (camada de segurança)

**Impacto em Fluxos Existentes:**
- ✅ Nenhum impacto negativo
- ✅ Melhora UX ao dar feedback visual durante processamento
- ✅ Previne erros de navegação
- ✅ Requer atualização de `FormsComponent` (mas retrocompatível se prop for opcional)

**Complexidade:** Baixa a Média (mudanças em ~5 arquivos, mas padronizadas)

---

### 6.2 Fix Estrutural (Longo Prazo)

**Ação:** Implementar proteção completa com:
1. Hook customizado para gerenciar submissão de formulários
2. Validação de duplicação no backend
3. Melhorias no FormsComponent com loading state integrado

**Mudanças Necessárias:**

**a) Criar hook useFormSubmission.ts:**
```typescript
// Hook que gerencia estado de loading e previne double-click
export function useFormSubmission(submitFn: () => Promise<void>) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    
    const handleSubmit = async () => {
        if (isSubmitting) return
        setIsSubmitting(true)
        try {
            await submitFn()
        } finally {
            setIsSubmitting(false)
        }
    }
    
    return { handleSubmit, isSubmitting }
}
```

**b) Backend - Validação de Duplicação:**
- Adicionar verificação antes de criar evento
- Verificar se existe evento com mesmo título + startDate + branchId
- Retornar erro 409 (Conflict) se duplicado

**c) FormsComponent:**
- Integrar loading state como parte do componente
- Mostrar ActivityIndicator quando loading
- Desabilitar botão automaticamente durante submissão

**d) Navigation Helper:**
- Criar função helper `safeGoBack(navigation)` que verifica `canGoBack()` antes de navegar

**Prós:**
- ✅ Solução completa e robusta
- ✅ Previne duplicação mesmo em race conditions
- ✅ Melhora arquitetura e reutilização
- ✅ Backend com validação de integridade
- ✅ Melhor experiência do usuário com feedback visual
- ✅ Facilita manutenção futura

**Contras:**
- ❌ Maior complexidade de implementação
- ❌ Requer mudanças em backend (validação de duplicação)
- ❌ Requer refatoração de múltiplos componentes
- ❌ Mais tempo de desenvolvimento
- ❌ Pode exigir definição de critérios de "duplicação" (o que constitui evento duplicado?)

**Impacto em Fluxos Existentes:**
- ✅ Melhora robustez geral do sistema
- ✅ Adiciona camada de segurança no backend
- ✅ Pode requerer ajustes se critérios de duplicação forem muito restritivos
- ✅ Requer testes mais extensivos

**Complexidade:** Alta (refatoração arquitetural + backend)

---

## 📝 7. Recomendações de Implementação

### Fase 1: Fix Mínimo (Imediato)
1. Adicionar proteção contra double-click em `AddEventScreen`
2. Atualizar `FormsComponent` para aceitar prop `loading`
3. Aplicar mesmo padrão em outras telas de criação afetadas
4. Adicionar verificação `navigation.canGoBack()` antes de navegar

**Tempo estimado:** 2-4 horas  
**Risco:** Baixo  
**Prioridade:** Alta

### Fase 2: Melhorias Estruturais (Médio Prazo)
1. Criar hook `useFormSubmission` para padronizar comportamento
2. Refatorar telas para usar o hook
3. Adicionar validação de duplicação no backend
4. Melhorar feedback visual em FormsComponent

**Tempo estimado:** 1-2 dias  
**Risco:** Médio  
**Prioridade:** Média

---

## ✅ 8. Conclusão

**Root Causes:**
1. **Primária:** Falta de proteção contra double-click no frontend (mobile)
2. **Secundária:** Backend sem validação de duplicação
3. **Terciária:** Navegação sem verificação de pilha

**Solução Recomendada:** Implementar Fix Mínimo primeiro (rápido e efetivo), depois considerar Fix Estrutural para robustez adicional

**Prioridade:** Alta - Afeta integridade de dados e experiência do usuário

**Escopo:** 5+ telas de criação afetadas (Eventos, Devocionais, Contribuições, Membros, etc.)

**Esforço de Correção:** Baixo a Médio (Fix Mínimo) | Alto (Fix Estrutural)

**Risco:** Baixo (Fix Mínimo) | Médio (Fix Estrutural)

