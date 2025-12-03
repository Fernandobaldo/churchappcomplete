# 🐛 Debug de Testes - Como Identificar Erros

## Problema Comum

Quando os testes falham, às vezes você recebe HTML inteiro no log em vez de uma mensagem de erro clara. Isso geralmente indica:

1. **Rota não encontrada (404)** - A rota não foi registrada corretamente
2. **Erro no servidor** - O servidor está retornando uma página de erro HTML
3. **Problema de roteamento** - A rota existe mas não está sendo encontrada

## Solução: Helper de Logging

Criamos um helper (`testResponseHelper.ts`) que detecta automaticamente quando a resposta é HTML e formata o erro de forma mais legível.

### Como Usar

```typescript
import { logTestResponse } from '../utils/testResponseHelper'

it('meu teste', async () => {
  const response = await request(app.server)
    .get('/minha-rota')
    .set('Authorization', `Bearer ${token}`)

  // Adicione esta linha antes do expect
  logTestResponse(response, 200) // 200 é o status esperado
  
  expect(response.status).toBe(200)
})
```

### O que o Helper Faz

1. **Detecta HTML**: Verifica se a resposta é HTML em vez de JSON
2. **Extrai informações**: Tenta extrair título, cabeçalho e mensagem de erro do HTML
3. **Formata o log**: Mostra apenas informações relevantes, não o HTML inteiro
4. **Mostra JSON**: Se for JSON, formata de forma legível

### Exemplo de Saída

Quando há um erro, você verá algo assim:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ ERRO NO TESTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status esperado: 201
Status recebido: 404
Content-Type: text/html

⚠️  ATENÇÃO: Resposta é HTML, não JSON!
Isso geralmente indica:
  - Rota não encontrada (404)
  - Erro no servidor retornando página de erro
  - Problema de roteamento
  - Rota não registrada corretamente

Título da página: 404 - Not Found
Cabeçalho: Route Not Found

Preview do HTML (primeiros 1000 chars):
<!DOCTYPE html>...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Verificações Comuns

### 1. Rota não registrada

Se você vê HTML com "404 - Not Found", verifique:
- A rota está registrada no `registerRoutes`?
- O método HTTP está correto (GET, POST, etc)?
- A URL está correta?

### 2. Erro de autenticação

Se você vê HTML com "401" ou "403", verifique:
- O token está sendo enviado corretamente?
- O token é válido?
- O usuário tem as permissões necessárias?

### 3. Erro de validação

Se você vê HTML com "400", verifique:
- Os dados enviados estão no formato correto?
- Todos os campos obrigatórios estão presentes?
- O Content-Type está correto (application/json)?

## Aplicando o Helper em Todos os Testes

Para aplicar o helper em todos os testes de uma vez, você pode usar este padrão:

```typescript
// Antes
const response = await request(app.server)
  .get('/rota')
expect(response.status).toBe(200)

// Depois
const response = await request(app.server)
  .get('/rota')
logTestResponse(response, 200) // Adicione esta linha
expect(response.status).toBe(200)
```

## Dicas

1. **Sempre use o helper** quando o status não é o esperado
2. **Verifique o Content-Type** - se for `text/html`, algo está errado
3. **Compare status esperado vs recebido** - isso ajuda a identificar o problema
4. **Use o preview do HTML** - geralmente contém informações úteis sobre o erro




