# Change Safety — Guia de Segurança em Mudanças

## Princípios de Mudança Segura

### 1. Aditivo Primeiro

**✅ DO:** Adicione novas funcionalidades sem quebrar existentes.

```tsx
// ✅ CORRETO: Adicionar prop opcional
type MyComponentProps = {
  title: string
  subtitle?: string  // ← Nova prop opcional
}
```

**❌ DON'T:** Remova ou mude props obrigatórias sem migração.

```tsx
// ❌ ERRADO: Mudar prop obrigatória
type MyComponentProps = {
  title?: string  // ← Era obrigatório, agora opcional (BREAKING)
}
```

### 2. Backward Compatibility

**✅ DO:** Mantenha compatibilidade com código existente.

```tsx
// ✅ CORRETO: Manter comportamento antigo + novo
const MyComponent = ({ value, newValue }: Props) => {
  const finalValue = newValue ?? value  // Fallback para valor antigo
  return <Text>{finalValue}</Text>
}
```

**❌ DON'T:** Quebre código existente sem aviso.

```tsx
// ❌ ERRADO: Remover prop sem aviso
const MyComponent = ({ newValue }: Props) => {
  // value foi removido sem migração
  return <Text>{newValue}</Text>
}
```

### 3. Migração Gradual

**✅ DO:** Migre uma tela/componente por vez.

```tsx
// ✅ CORRETO: Migrar uma tela, testar, depois próxima
// 1. Migrar EventsScreen
// 2. Testar
// 3. Migrar NoticesScreen
// 4. Testar
// ...
```

**❌ DON'T:** Migre tudo de uma vez.

```tsx
// ❌ ERRADO: Migrar todas as telas de uma vez
// - EventsScreen
// - NoticesScreen
// - ContributionsScreen
// - ... (tudo junto = difícil debugar)
```

## Checklist de Mudança Segura

### Antes de Fazer Mudanças

- [ ] Entender o impacto da mudança
- [ ] Identificar todas as dependências
- [ ] Verificar se há testes existentes
- [ ] Planejar migração gradual (se necessário)

### Durante a Mudança

- [ ] Manter backward compatibility
- [ ] Adicionar novos recursos de forma aditiva
- [ ] Não remover código legado sem migração
- [ ] Documentar mudanças

### Depois da Mudança

- [ ] Verificar se TypeScript compila
- [ ] Testar telas afetadas manualmente
- [ ] Verificar se não quebrou outras telas
- [ ] Atualizar documentação

## Padrões de Refatoração Segura

### Padrão: Adicionar Nova Prop Opcional

```tsx
// ANTES
type MyComponentProps = {
  title: string
}

// DEPOIS (seguro)
type MyComponentProps = {
  title: string
  subtitle?: string  // ← Nova prop opcional
}
```

### Padrão: Adicionar Novo Hook/Service

```tsx
// ✅ CORRETO: Criar novo hook sem quebrar existente
// hooks/useNewFeature.ts (novo arquivo)
export function useNewFeature() {
  // ...
}

// hooks/useOldFeature.ts (mantém existente)
export function useOldFeature() {
  // ...
}
```

### Padrão: Migrar Componente Gradualmente

```tsx
// 1. Adicionar nova versão (não quebra existente)
export function MyComponentV2({ ... }: PropsV2) {
  // ...
}

// 2. Migrar uma tela por vez
// Screen1.tsx → usa MyComponentV2
// Screen2.tsx → ainda usa MyComponent (antigo)

// 3. Depois de todas migradas, remover versão antiga
```

### Padrão: Adicionar Estado a Layout

```tsx
// ANTES
type ViewScreenLayoutProps = {
  headerProps: PageHeaderProps
  children: React.ReactNode
}

// DEPOIS (seguro)
type ViewScreenLayoutProps = {
  headerProps: PageHeaderProps
  children: React.ReactNode
  loading?: boolean      // ← Nova prop opcional
  error?: string | null // ← Nova prop opcional
}
```

## Regras por Tipo de Mudança

### Mudanças em Layouts

**✅ DO:**
- Adicionar props opcionais
- Adicionar novos slots (topSlot, bottomSlot, floatingSlot)
- Melhorar tipagem sem quebrar

**❌ DON'T:**
- Remover props existentes
- Mudar comportamento padrão
- Quebrar compatibilidade com telas existentes

### Mudanças em Components

**✅ DO:**
- Adicionar props opcionais
- Melhorar tipagem
- Adicionar novos componentes

**❌ DON'T:**
- Fazer componentes fazerem API calls
- Remover props obrigatórias
- Mudar comportamento sem aviso

### Mudanças em Services

**✅ DO:**
- Adicionar novos métodos
- Melhorar tipagem
- Adicionar novos services

**❌ DON'T:**
- Remover métodos existentes
- Mudar assinaturas de métodos
- Quebrar contratos de API

### Mudanças em Hooks

**✅ DO:**
- Adicionar novos hooks
- Melhorar hooks existentes (mantendo API)
- Adicionar opções opcionais

**❌ DON'T:**
- Mudar retorno de hooks existentes
- Remover hooks sem migração
- Quebrar contratos de hooks

### Mudanças em Screens

**✅ DO:**
- Migrar uma tela por vez
- Usar novos recursos de forma aditiva
- Melhorar código sem quebrar funcionalidade

**❌ DON'T:**
- Migrar todas as telas de uma vez
- Remover funcionalidades sem aviso
- Quebrar navegação

## Exemplos de Mudanças Seguras

### ✅ Exemplo 1: Adicionar Estado a Layout

```tsx
// ANTES
<ViewScreenLayout
  headerProps={{ title: "Eventos" }}
>
  <FlatList ... />
</ViewScreenLayout>

// DEPOIS (seguro - props opcionais)
<ViewScreenLayout
  headerProps={{ title: "Eventos" }}
  loading={loading}      // ← Nova prop opcional
  error={error}          // ← Nova prop opcional
  empty={isEmpty}        // ← Nova prop opcional
>
  <FlatList ... />
</ViewScreenLayout>
```

### ✅ Exemplo 2: Adicionar Novo Service

```tsx
// services/myNewService.ts (novo arquivo)
export const myNewService = {
  getAll: async () => { ... }
}

// services/index.ts (adicionar export)
export { myNewService } from './myNewService'

// Nenhuma tela quebra porque é novo código
```

### ✅ Exemplo 3: Melhorar Tipagem

```tsx
// ANTES
type Props = {
  form: any
}

// DEPOIS (seguro - mais específico, mas compatível)
type Props = {
  form: Record<string, any>  // ← Mais específico, mas ainda aceita qualquer objeto
}
```

## Exemplos de Mudanças Perigosas

### ❌ Exemplo 1: Remover Prop Obrigatória

```tsx
// ANTES
type Props = {
  title: string  // obrigatório
}

// DEPOIS (PERIGOSO)
type Props = {
  title?: string  // agora opcional - quebra código que não passa title
}
```

### ❌ Exemplo 2: Mudar Comportamento Padrão

```tsx
// ANTES
<ViewScreenLayout scrollable={true} />  // default true

// DEPOIS (PERIGOSO)
<ViewScreenLayout scrollable={false} />  // default mudou para false - quebra telas
```

### ❌ Exemplo 3: Remover Método de Service

```tsx
// ANTES
eventsService.getAll()
eventsService.getById(id)

// DEPOIS (PERIGOSO)
eventsService.getAll()  // removido - quebra todas as telas que usam
```

## Processo de Migração Segura

### 1. Planejamento

- Identificar escopo da mudança
- Listar todas as dependências
- Planejar migração gradual

### 2. Implementação Aditiva

- Adicionar novo código sem remover antigo
- Manter backward compatibility
- Adicionar props opcionais

### 3. Migração Gradual

- Migrar uma tela/componente por vez
- Testar após cada migração
- Verificar se TypeScript compila

### 4. Validação

- Testar todas as telas afetadas
- Verificar se não quebrou outras telas
- Verificar se comportamento está correto

### 5. Limpeza (Opcional)

- Remover código legado apenas após todas as migrações
- Documentar mudanças
- Atualizar documentação

## Red Flags (Sinais de Perigo)

### 🚩 Mudanças que Quebram

- Remover props/métodos sem migração
- Mudar comportamento padrão
- Mudar tipos de retorno
- Remover código sem aviso

### 🚩 Mudanças que Podem Quebrar

- Mudar nomes de props/métodos
- Mudar estrutura de dados
- Mudar dependências
- Mudar comportamento de hooks

### ✅ Mudanças Seguras

- Adicionar props opcionais
- Adicionar novos métodos/services/hooks
- Melhorar tipagem (sem quebrar)
- Adicionar novos componentes

## Checklist Final

Antes de fazer uma mudança, pergunte:

- [ ] Esta mudança quebra código existente?
- [ ] Posso fazer isso de forma aditiva?
- [ ] Preciso migrar código existente?
- [ ] Se sim, posso migrar gradualmente?
- [ ] Testei a mudança?
- [ ] TypeScript compila?
- [ ] Documentei a mudança?

---

**Última atualização:** 2024-12-19

