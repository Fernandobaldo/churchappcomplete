# Correções Necessárias nos Testes

## Problemas Identificados e Correções

### 1. ✅ inviteLinkService.test.ts - Erro no código do erro
**Problema**: Teste verificava `error.message === 'PLAN_LIMIT_REACHED'` mas a mensagem é diferente.
**Correção**: Alterado para verificar `error.code === 'PLAN_LIMIT_REACHED'` e `error.message` contém a mensagem esperada.

### 2. ✅ registerInvite.test.ts - Emails duplicados
**Problema**: Teste cria membros com emails que podem já existir de testes anteriores.
**Correção**: Adicionado limpeza de dados no `beforeEach` e uso de timestamps únicos nos emails.

### 3. ⚠️ registerInvite.test.ts - Erros 500
**Problema**: Todos os testes retornam 500 ao invés dos códigos esperados.
**Causa Possível**: 
- Rota `/public/register/invite` pode não estar sendo encontrada
- Controller pode não estar tratando erros corretamente
- Validação do schema pode estar falhando

**Ação Necessária**: Verificar logs do servidor durante os testes para identificar o erro exato.

### 4. ⚠️ inviteLinkRoutes.test.ts - Erros 500 e 404
**Problema**: 
- POST /invite-links retorna 500
- GET /invite-links/:token/info retorna 404
- GET /invite-links/:token/qrcode retorna 404
- PATCH /invite-links/:id/deactivate retorna 400

**Causa Possível**:
- Rotas podem não estar registradas corretamente
- Controller pode ter problemas de validação
- Dados de teste podem estar incorretos

**Ação Necessária**: Verificar se todas as rotas estão registradas e se os controllers estão funcionando.

### 5. ⚠️ Outros testes falhando (não relacionados a invite links)
- noticesRoutes.test.ts - Campo 'read' não está sendo retornado
- authService.test.ts - Mudanças no comportamento do serviço
- serviceScheduleService.test.ts - Problema com atualização de location

**Ação**: Estes são problemas separados que precisam ser corrigidos individualmente.



