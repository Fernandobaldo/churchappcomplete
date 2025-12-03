# Análise do Erro no Teste E2E de Contribution (Linhas 993-1002)

## 📋 Problema Identificado

O teste `deve validar campos obrigatórios ao criar contribuição` estava falhando com:
- **Esperado**: Status code >= 400 (erro de validação)
- **Recebido**: Status code 201 (criação bem-sucedida)

## 🔍 Análise

### Erro no Teste (NÃO no código de produção)

O teste estava tentando validar campos que **não existem mais** no modelo atual de `Contribution`.

### Mudança no Modelo

O modelo `Contribution` passou por uma **refatoração significativa**:

#### Modelo Antigo (Migration 20250424220133)
```sql
CREATE TABLE "Contribution" (
    "title" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,  -- ❌ Não existe mais
    "date" TIMESTAMP(3) NOT NULL,        -- ❌ Não existe mais
    "type" "ContributionType" NOT NULL,  -- ❌ Não existe mais
    ...
)
```

#### Modelo Atual (Prisma Schema)
```prisma
model Contribution {
  id          String   @id @default(cuid())
  title       String   // ✅ Único campo obrigatório
  description String?  // Opcional
  goal        Float?   // Opcional - Meta da campanha
  endDate     DateTime? // Opcional
  raised      Float?   // Opcional - Valor arrecadado
  isActive    Boolean  @default(true)
  branchId    String
  ...
}
```

### Schema de Validação Atual

```typescript
export const createContributionBodySchema = z.object({
    title: z.string().min(1, 'Título obrigatório'),  // ✅ Único obrigatório
    description: z.string().optional(),
    goal: z.number().positive('Meta deve ser positiva').optional(),
    endDate: z.string().optional(),
    paymentMethods: z.array(paymentMethodSchema).optional(),
    isActive: z.boolean().optional().default(true),
})
```

### Problema no Teste

O teste estava tentando:
1. Criar uma contribuição com campos `value`, `date`, `type` que **não existem mais**
2. Validar que o campo `value` é obrigatório (mas esse campo não existe)
3. Como o schema atual só valida `title` (que estava presente), a criação era bem-sucedida

### Explicação do Comportamento

1. O teste enviava:
   ```json
   {
     "title": "Contribuição sem valor",  // ✅ Campo obrigatório presente
     "date": "...",                       // ❌ Campo não existe no schema
     "type": "DIZIMO"                     // ❌ Campo não existe no schema
   }
   ```

2. O Zod schema valida apenas campos conhecidos e ignora campos desconhecidos
3. Como `title` estava presente (único campo obrigatório), a validação passava
4. O código retornava 201 (sucesso)

## ✅ Solução Aplicada

### Correção no Teste

O teste foi corrigido para validar o campo realmente obrigatório no modelo atual:

**Antes (incorreto):**
```typescript
payload: {
  title: 'Contribuição sem valor',
  date: new Date().toISOString(),
  type: 'DIZIMO',
  // valor ausente  // ❌ Campo não existe mais
}
```

**Depois (correto):**
```typescript
payload: {
  description: 'Campanha sem título',
  // title ausente  // ✅ Campo realmente obrigatório
}
```

## 🎯 Conclusão

**O erro estava no TESTE, não no código de produção.**

- ✅ O código de produção está **correto** - ele valida adequadamente os campos do modelo atual
- ❌ O teste estava **desatualizado** - estava testando campos de um modelo antigo que não existe mais
- ✅ O teste foi **corrigido** para testar a validação do campo `title` (único obrigatório)

## 📊 Resumo

| Item | Status |
|------|--------|
| Código de Produção | ✅ Correto - Modelo atual validado corretamente |
| Teste Original | ❌ Desatualizado - Testava modelo antigo |
| Teste Corrigido | ✅ Atualizado - Testa modelo atual |
| Modelo Contribution | ✅ Refatorado para representar campanhas, não contribuições individuais |

## 🔄 Mudança Conceitual

O modelo `Contribution` passou de:
- **Contribuição Individual** (com valor, data, tipo)
- Para **Campanha de Contribuição** (com meta, data final, métodos de pagamento)

As contribuições individuais agora são registradas através do modelo `Transaction` vinculado a uma `Contribution`.

