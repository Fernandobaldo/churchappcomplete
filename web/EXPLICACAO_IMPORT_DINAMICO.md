# Import Dinâmico vs Estático

## O que é Import Dinâmico?

**Import Dinâmico** é quando você importa um módulo em tempo de execução usando `await import()`:

```typescript
// Import dinâmico (em tempo de execução)
const { serviceScheduleApi } = await import('@/api/serviceScheduleApi')
const result = await serviceScheduleApi.delete(id, deleteEvents)
```

**Vantagens:**
- Code splitting: o código só é carregado quando necessário
- Reduz o bundle inicial
- Útil para lazy loading

**Desvantagens:**
- Mais difícil de mockar em testes
- Vitest precisa interceptar o `import()` em tempo de execução

## O que é Import Estático?

**Import Estático** é quando você importa no topo do arquivo:

```typescript
// Import estático (em tempo de compilação)
import { serviceScheduleApi } from '@/api/serviceScheduleApi'

// Usa diretamente
const result = await serviceScheduleApi.delete(id, deleteEvents)
```

**Vantagens:**
- Fácil de mockar em testes
- TypeScript resolve tipos em tempo de compilação
- Mais simples e direto

**Desvantagens:**
- Aumenta o bundle inicial
- Código sempre carregado, mesmo se não usado

## Solução: Mudar para Import Estático

No arquivo `ChurchSettings/index.tsx`, há dois lugares usando import dinâmico:

1. **Linha 101** - `fetchSchedules()`:
```typescript
const { serviceScheduleApi } = await import('@/api/serviceScheduleApi')
```

2. **Linha 138** - `handleDeleteSchedule()`:
```typescript
const { serviceScheduleApi } = await import('@/api/serviceScheduleApi')
```

**Solução:** Mudar para import estático no topo do arquivo:

```typescript
import { serviceScheduleApi } from '@/api/serviceScheduleApi'
```

Isso tornará o mock muito mais simples e confiável nos testes!













