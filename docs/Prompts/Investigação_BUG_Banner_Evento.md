# 🔍 Análise de Bug: Banner de Evento Não Atualiza na Edição

## 📋 Resumo Executivo

**Problema:** Quando o usuário tenta editar o banner de um evento existente, seleciona uma nova imagem, mas o banner não é alterado após salvar.

**Severidade:** Alta - Impacta funcionalidade crítica de edição de eventos

**Status:** Root causes identificados (2 problemas distintos)

---

## 🔎 1. Onde o Comportamento se Origina

### 1.1 Backend - Atualização de Evento (PROBLEMA PRINCIPAL)

**Arquivo:** `backend/src/routes/eventsRoutes.ts`  
**Função:** Rota `PUT /events/:id` (linhas 186-279)

**Problema Identificado:**
- O código faz `prisma.event.update()` mas **NÃO inclui** `imageUrl` no objeto `data` passado para o Prisma
- O schema `updateEventSchema` aceita `imageUrl` (definido em `eventSchemas.ts` linha 64-66)
- Mas o código hardcoded lista apenas alguns campos específicos e **omite `imageUrl`**

**Código Relevante:**
```typescript
// Linhas 266-278: Update do evento SEM imageUrl
const updated = await prisma.event.update({
  where: { id },
  data: {
    title: data.title,
    startDate: parsedStartDate && isValid(parsedStartDate) ? parsedStartDate : undefined,
    endDate: parsedEndDate && isValid(parsedEndDate) ? parsedEndDate : undefined,
    time: data.time,
    location: data.location,
    description: data.description,
    hasDonation: data.hasDonation ?? false,
    donationReason: data.hasDonation ? data.donationReason : null,
    donationLink: data.hasDonation ? data.donationLink : null,
    // ❌ FALTA: imageUrl: data.imageUrl
  },
})
```

### 1.2 Mobile - Falta de Upload de Imagem (PROBLEMA SECUNDÁRIO)

**Arquivo:** `mobile/src/screens/EditEventScreen.tsx`  
**Função:** `handleUpdate()` (linhas 113-157)

**Problema Identificado:**
- O código **NÃO faz upload** da imagem antes de enviar para o backend
- Diferente de `AddEventScreen.tsx` que tem função `uploadImage()` (linhas 61-111)
- Envia diretamente `form.imageUrl` que pode ser uma URI local (`file:///...`)
- O backend recebe uma URI local inválida em vez de uma URL do servidor

**Código Relevante:**
```typescript
// Linhas 135-139: Envia payload SEM fazer upload da imagem
const payload = {
    ...form,
    startDate: finalStartDate,
    endDate: finalStartDate,
}
// ❌ Não verifica se form.imageUrl é URI local
// ❌ Não faz upload antes de enviar
await eventsService.update(id, payload)
```

**Comparação com AddEventScreen:**
- `AddEventScreen.tsx` tem função `uploadImage()` (linhas 61-111)
- `AddEventScreen.tsx` verifica se é URI local e faz upload antes de enviar (linhas 137-149)
- `EditEventScreen.tsx` **NÃO tem essa lógica**

### 1.3 Web - Funciona Corretamente

**Arquivo:** `web/src/pages/Events/EditEvent.tsx`  
**Função:** `onSubmit()` (linhas 137-178)

**Comportamento Correto:**
- Faz upload da imagem antes de enviar (linhas 142-147)
- Inclui `imageUrl` no payload apenas se houver alteração (linhas 168-170)
- Remove `imageUrl` do data antes de enviar para evitar conflitos (linha 158)

**Código Relevante:**
```typescript
// Linhas 142-170: Lógica correta de upload e inclusão no payload
if (imageFile) {
  imageUrl = await uploadImage()
  // ...
}
// ...
if (imageUrl !== undefined) {
  payload.imageUrl = imageUrl
}
```

---

## 🎯 2. Por Que Acontece (Root Causes)

### 2.1 Causa Primária - Backend Omite imageUrl

**O código do backend lista explicitamente os campos no `data` do `prisma.event.update()` e esqueceu de incluir `imageUrl`.**

**Fluxo do Problema:**
1. Frontend (web ou mobile) envia requisição `PUT /events/:id` com `imageUrl` no body
2. Schema `updateEventSchema` valida e aceita `imageUrl` (passa na validação)
3. Código processa `data` e prepara objeto para Prisma
4. **Código hardcoded lista campos específicos e omite `imageUrl`**
5. Prisma atualiza evento **SEM** alterar `imageUrl`
6. Banner permanece com valor antigo no banco

**Evidência:**
- Schema aceita `imageUrl`: `eventSchemas.ts` linha 16-48 define `imageUrl` como opcional
- Schema de update permite: `updateEventSchema.body = baseEventSchema.partial()` (linha 65)
- Mas código não inclui: `eventsRoutes.ts` linha 268-278 lista campos sem `imageUrl`

### 2.2 Causa Secundária - Mobile Não Faz Upload

**O `EditEventScreen` não tem a lógica de upload que existe no `AddEventScreen`.**

**Fluxo do Problema (Mobile):**
1. Usuário seleciona nova imagem → `FormsComponent` armazena URI local (`file:///...`) em `form.imageUrl`
2. Usuário clica em salvar → `handleUpdate()` é chamado
3. Código envia `form.imageUrl` diretamente no payload (linha 135-139)
4. Backend recebe URI local inválida
5. Mesmo que backend incluísse `imageUrl`, seria uma URI local que não funciona

**Comparação:**
- ✅ `AddEventScreen.tsx`: Tem `uploadImage()` e verifica URI local (linhas 137-149)
- ❌ `EditEventScreen.tsx`: Não tem `uploadImage()` e envia URI local diretamente

---

## ⚠️ 3. Invariantes Violados

### 3.1 Invariante de Consistência de Schema

**Esperado:** Todos os campos aceitos pelo schema de validação devem ser processados e incluídos no update do banco.

**Violado:** O schema aceita `imageUrl`, mas o código não o inclui no update do Prisma.

### 3.2 Invariante de Paridade entre Create e Update

**Esperado:** A lógica de processamento de campos deve ser consistente entre criação e atualização.

**Violado:** 
- Create inclui `imageUrl` (linha 163 de `eventsRoutes.ts`)
- Update omite `imageUrl` (linha 268-278 de `eventsRoutes.ts`)

### 3.3 Invariante de Paridade entre Add e Edit (Mobile)

**Esperado:** A lógica de upload de imagem deve ser a mesma entre adicionar e editar eventos.

**Violado:**
- `AddEventScreen` faz upload de imagens locais
- `EditEventScreen` não faz upload de imagens locais

---

## 🔧 4. Possíveis Correções

### 4.1 Fix Mínimo / Baixo Risco

**Descrição:** Adicionar `imageUrl` ao objeto `data` no update do backend e adicionar lógica de upload no mobile.

**Mudanças Necessárias:**

**Backend:**
- `backend/src/routes/eventsRoutes.ts` (linha 268-278)
  - Adicionar `imageUrl: data.imageUrl` ao objeto `data` do `prisma.event.update()`

**Mobile:**
- `mobile/src/screens/EditEventScreen.tsx`
  - Copiar função `uploadImage()` de `AddEventScreen.tsx` (linhas 61-111)
  - Adicionar lógica em `handleUpdate()` para fazer upload antes de enviar (similar a linhas 137-149 de `AddEventScreen.tsx`)

**Arquivos Afetados:**
- `backend/src/routes/eventsRoutes.ts` (1 linha adicionada)
- `mobile/src/screens/EditEventScreen.tsx` (~50 linhas adicionadas)

**Prós:**
- ✅ Resolve o problema diretamente
- ✅ Mudança mínima e localizada
- ✅ Baixo risco de quebrar funcionalidades existentes
- ✅ Alinha comportamento com `AddEventScreen`
- ✅ Web já funciona, não precisa mudanças

**Contras:**
- ⚠️ Duplica código de upload entre `AddEventScreen` e `EditEventScreen`
- ⚠️ Não resolve problema estrutural de hardcoding de campos

**Impacto em Fluxos Existentes:**
- ✅ Edição de evento (web): Continua funcionando (já funciona)
- ✅ Edição de evento (mobile): Agora funciona corretamente
- ✅ Criação de evento: Não afetado
- ✅ Outros campos do evento: Não afetados

---

### 4.2 Fix Estrutural / Longo Prazo

**Descrição:** Refatorar backend para usar spread operator ou método centralizado que inclui todos os campos do schema, e criar helper compartilhado para upload de imagens no mobile.

**Mudanças Necessárias:**

**Backend:**
1. Refatorar `eventsRoutes.ts` para não hardcodar campos:
   - Usar spread operator: `data: { ...data, startDate: parsedStartDate, ... }`
   - Ou criar método `buildEventUpdateData()` que processa todos os campos do schema
   - Garantir que todos os campos opcionais do schema sejam incluídos se presentes

2. Considerar usar `EventService.update()` em vez de Prisma direto:
   - Mover lógica de parsing de datas para o service
   - Service recebe dados já validados e monta objeto completo

**Mobile:**
1. Criar helper compartilhado `uploadImageHelper.ts`:
   - Extrair função `uploadImage()` de `AddEventScreen`
   - Usar em ambos `AddEventScreen` e `EditEventScreen`
   - Centralizar lógica de detecção de URI local vs URL

2. Refatorar `FormsComponent` para suportar upload automático:
   - Adicionar prop `onImageSelected` que faz upload automaticamente
   - Ou criar wrapper `ImageUploadField` que gerencia upload

**Arquivos Afetados:**
- `backend/src/routes/eventsRoutes.ts` (refatoração completa)
- `backend/src/services/eventService.ts` (possivelmente)
- `mobile/src/screens/AddEventScreen.tsx` (refatoração)
- `mobile/src/screens/EditEventScreen.tsx` (refatoração)
- `mobile/src/utils/uploadImageHelper.ts` (novo arquivo)
- Possivelmente `mobile/src/components/FormsComponent.tsx`

**Prós:**
- ✅ Garante que todos os campos do schema sejam sempre incluídos
- ✅ Previne problemas similares no futuro
- ✅ Centraliza lógica de upload (DRY)
- ✅ Facilita manutenção futura
- ✅ Torna código mais testável
- ✅ Alinha arquitetura entre create e update

**Contras:**
- ⚠️ Mudança mais ampla, requer mais testes
- ⚠️ Risco maior de introduzir regressões
- ⚠️ Requer refatoração de múltiplos arquivos
- ⚠️ Mais tempo de desenvolvimento
- ⚠️ Pode afetar outros fluxos que usam update de eventos

**Impacto em Fluxos Existentes:**
- ✅ Todos os fluxos de atualização de evento: Beneficiam da consistência
- ⚠️ Requer testes extensivos de todos os campos do evento
- ⚠️ Pode afetar outros endpoints que atualizam eventos
- ⚠️ Requer validação cuidadosa de campos opcionais vs undefined

---

## 📊 5. Fatores Contribuintes Secundários

### 5.1 Inconsistência entre Create e Update

- **Create** (`eventsRoutes.ts` linha 152-165): Inclui `imageUrl: data.imageUrl` diretamente
- **Update** (`eventsRoutes.ts` linha 266-278): Lista campos hardcoded e omite `imageUrl`
- Isso sugere que o código foi escrito em momentos diferentes ou por pessoas diferentes

### 5.2 Falta de Teste de Integração

- Não há teste que verifique se `imageUrl` é atualizado corretamente no update
- Testes existentes focam em criação, mas não em atualização de campos específicos como `imageUrl`

### 5.3 Duplicação de Lógica entre Add e Edit (Mobile)

- `AddEventScreen` tem lógica de upload que `EditEventScreen` não tem
- Isso sugere que `EditEventScreen` foi criado copiando código mas esqueceu de incluir upload

### 5.4 Hardcoding de Campos no Backend

- O código lista explicitamente cada campo em vez de usar spread ou método centralizado
- Isso torna fácil esquecer campos ao adicionar novos campos ao schema

---

## ✅ 6. Recomendação

**Recomendação:** Implementar o **Fix Mínimo (4.1)** primeiro para resolver o problema imediatamente, seguido pelo **Fix Estrutural (4.2)** em uma iteração futura para melhorar a arquitetura.

**Justificativa:**
- O fix mínimo resolve ambos os problemas (backend e mobile) com risco mínimo
- Pode ser implementado e testado rapidamente
- O fix estrutural pode ser feito depois como melhoria de arquitetura
- Segue o princípio de resolver problemas críticos primeiro, otimizar depois

---

## 📝 7. Questões para Investigação Adicional

1. **UNKNOWN:** Existem outros campos do schema que também podem estar sendo omitidos no update?
2. **UNKNOWN:** Há outros screens no mobile que têm o mesmo problema de não fazer upload de imagens?
3. **UNKNOWN:** O problema ocorre apenas no mobile ou também no web em algum cenário específico?
4. **UNKNOWN:** Há validação no backend que rejeita URIs locais (`file://`), ou elas são aceitas silenciosamente?

---

## 🔗 8. Referências de Código

### Arquivos Principais:
- `backend/src/routes/eventsRoutes.ts` - Rota PUT /events/:id (linhas 186-279)
- `backend/src/schemas/eventSchemas.ts` - Schema com imageUrl (linhas 16-48, 64-66)
- `mobile/src/screens/EditEventScreen.tsx` - Tela de edição mobile (linhas 113-157)
- `mobile/src/screens/AddEventScreen.tsx` - Tela de criação mobile com upload (linhas 61-111, 137-149)
- `web/src/pages/Events/EditEvent.tsx` - Tela de edição web (funciona corretamente, linhas 137-178)

### Arquivos de Referência (Implementação Correta):
- `web/src/pages/Events/EditEvent.tsx` - Exemplo de upload correto antes de enviar
- `mobile/src/screens/AddEventScreen.tsx` - Exemplo de upload correto no mobile
- `backend/src/routes/eventsRoutes.ts` - Create inclui imageUrl (linha 163)

---

**Data da Análise:** 2024  
**Analista:** AI Assistant  
**Status:** ✅ Root Causes Identificados - Pronto para Implementação

