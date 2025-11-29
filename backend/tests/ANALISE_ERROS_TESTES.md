# Análise de Erros nos Testes

## 1. registerInvite.test.ts - Erros 500

### Problema: Todos os testes retornam 500 ao invés dos códigos esperados

**Causa Identificada**: A rota `/public/register/invite` está registrada, mas o controller pode não estar tratando corretamente os erros ou a rota não está sendo encontrada.

**Solução**: Verificar se a rota está sendo registrada corretamente e se o controller trata todos os casos de erro.

## 2. inviteLinkRoutes.test.ts - Erros 500 e 404

### Problema 1: POST /invite-links retorna 500
**Causa**: Possível erro na validação ou no serviço de geração de link.

### Problema 2: GET /invite-links/:token/info retorna 404
**Causa**: A rota pode não estar registrada ou o controller não está implementado.

### Problema 3: GET /invite-links/:token/qrcode retorna 404
**Causa**: Mesma situação - rota não encontrada.

### Problema 4: PATCH /invite-links/:id/deactivate retorna 400
**Causa**: Validação de parâmetros pode estar falhando.

## 3. inviteLinkService.test.ts - Erro no código do erro

### Problema: error.message não é 'PLAN_LIMIT_REACHED'
**Causa**: O erro está sendo criado com message diferente do code.
**Solução**: O teste deve verificar error.code, não error.message.

## 4. registerInvite.test.ts - Erro de email duplicado

### Problema: Unique constraint failed on email
**Causa**: O teste está tentando criar membros com emails que já existem de testes anteriores.
**Solução**: Usar timestamps únicos ou limpar dados entre testes.



