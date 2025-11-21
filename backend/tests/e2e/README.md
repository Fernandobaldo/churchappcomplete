# Testes E2E (End-to-End)

Este diretório contém os testes end-to-end que validam o fluxo completo da aplicação, desde o registro de usuário até a criação de eventos e contribuições.

## 📋 Visão Geral

Os testes E2E simulam o comportamento real de um usuário utilizando a API completa, testando:

1. **Registro de usuário** (`/public/register`)
2. **Autenticação** (`/auth/login`)
3. **Criação de igreja** (`/churches`)
4. **Criação de eventos** (`/events`)
5. **Criação de contribuições** (`/contributions`)

## 🚀 Como Executar

### Executar todos os testes E2E

O comando abaixo configura automaticamente o banco de teste e executa os testes:

```bash
npm run test:e2e
```

Este comando:
1. ✅ Configura o banco de teste (cria tabelas se necessário)
2. ✅ Executa todos os testes E2E

### Executar apenas o setup do banco

Se precisar configurar o banco manualmente:

```bash
npm run test:e2e:setup
```

### Executar em modo watch (desenvolvimento)

```bash
npm run test:e2e:watch
```

**Nota**: O modo watch não executa o setup automaticamente. Execute `npm run test:e2e:setup` primeiro se necessário.

### Executar um teste específico

```bash
npx dotenv-cli -e .env.test -- vitest run tests/e2e/complete-flow.test.ts
```

## 📁 Estrutura

```
tests/e2e/
├── README.md                    # Esta documentação
├── complete-flow.test.ts        # Teste principal com fluxo completo
└── helpers/
    └── testHelpers.ts           # Funções auxiliares para os testes
```

## 🧪 Cenários de Teste

### Cenário 1: Fluxo Completo desde o Registro
Testa o fluxo completo:
- Registro de novo usuário
- Criação de igreja (que cria member e branch automaticamente)
- Criação de evento
- Criação de contribuição
- Verificação de todos os dados no banco

### Cenário 2: Fluxo com Login após Registro
Simula um usuário que:
- Registra-se
- Faz logout/login
- Cria recursos após o login

### Cenário 3: Múltiplos Recursos
Testa a criação de múltiplos eventos e contribuições para o mesmo usuário, validando que todos são criados corretamente na mesma branch.

### Cenário 4: Validações e Erros
Testa as validações de campos obrigatórios e tratamento de erros.

## 🛠️ Helpers Disponíveis

O arquivo `helpers/testHelpers.ts` fornece funções auxiliares:

- `registerUser()` - Registra um novo usuário
- `loginUser()` - Faz login e retorna token
- `createChurch()` - Cria uma igreja
- `createEvent()` - Cria um evento
- `createContribution()` - Cria uma contribuição
- `setupCompleteUser()` - Fluxo completo: registro + criação de igreja

### Exemplo de Uso

```typescript
import { setupCompleteUser, createEvent } from './helpers/testHelpers'

// Setup completo
const auth = await setupCompleteUser(app, {
  name: 'João Silva',
  email: 'joao@example.com',
  password: 'senha123456'
}, {
  name: 'Igreja Teste',
  branchName: 'Sede'
})

// Criar evento
const event = await createEvent(app, auth.token, {
  title: 'Evento de Teste',
  startDate: '25-12-2024',
  endDate: '25-12-2024',
  description: 'Descrição do evento'
})
```

## ⚙️ Configuração

Os testes E2E utilizam:
- Banco de dados de teste (configurado em `.env.test`)
- Vitest como framework de testes
- Supertest para requisições HTTP
- Prisma para verificação de dados no banco

### Pré-requisitos

1. Banco de dados de teste configurado
2. Arquivo `.env.test` com `DATABASE_URL` apontando para o banco de teste
3. Migrações aplicadas no banco de teste

### Setup do Banco de Teste

```bash
# Criar banco de teste
npm run create-test-db

# Aplicar migrações
npm run setup-test-db
```

**⚠️ IMPORTANTE**: Se você receber o erro `The table 'public.User' does not exist`, execute:

```bash
# Garantir que o banco está sincronizado
cd backend
npx dotenv-cli -e .env.test -- npx prisma db push --force-reset --accept-data-loss
```

Ou manualmente:

```bash
# 1. Verifique se o banco existe
psql -U postgres -c "CREATE DATABASE churchapp_test;"

# 2. Aplique o schema
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/churchapp_test" npx prisma db push --force-reset --accept-data-loss
```

## 📝 Formato de Datas

### Eventos
Os eventos utilizam o formato `dd/MM/yyyy` (com barra) para datas:
```typescript
startDate: '25/12/2024'
endDate: '26/12/2024'
```

### Contribuições
As contribuições utilizam ISO string:
```typescript
date: new Date().toISOString()
// ou
date: '2024-12-25T10:00:00.000Z'
```

## 🔍 Debugging

Para debugar os testes:

1. Adicione `console.log()` nos testes
2. Use `console.log('[E2E] ...')` para logs específicos de E2E
3. Verifique os logs do banco de dados
4. Use `vitest --reporter=verbose` para mais detalhes

## 🎯 Boas Práticas

1. **Isolamento**: Cada teste deve ser independente
2. **Limpeza**: O banco é limpo antes e depois dos testes
3. **Timestamps**: Use timestamps únicos para evitar conflitos
4. **Validação**: Sempre valide os dados retornados e no banco
5. **Logs**: Use logs descritivos para facilitar debugging

## 📊 Cobertura

Os testes E2E cobrem:
- ✅ Registro público de usuário
- ✅ Autenticação (login)
- ✅ Criação de igreja e filial
- ✅ Criação de eventos
- ✅ Criação de contribuições
- ✅ Validações de campos obrigatórios
- ✅ Relacionamentos entre entidades (user → church → branch → member → events/contributions)

## 🚨 Troubleshooting

### Erro: "Token inválido"
- Verifique se o JWT_SECRET está configurado no `.env.test`
- Verifique se o token está sendo enviado corretamente no header

### Erro: "Branch não encontrada"
- Certifique-se de que a igreja foi criada antes de criar eventos/contribuições
- Verifique se o member foi criado corretamente com branchId

### Erro: "Permissão negada"
- Verifique se o member tem as permissões necessárias
- Para contribuições, o member precisa ter role ADMINGERAL, ADMINFILIAL ou COORDINATOR

### Erro de conexão com banco
- Verifique se o banco de teste está rodando
- Verifique a `DATABASE_URL` no `.env.test`
- Execute `npm run setup-test-db` novamente

## 📚 Referências

- [Documentação Vitest](https://vitest.dev/)
- [Documentação Supertest](https://github.com/visionmedia/supertest)
- [Documentação Prisma](https://www.prisma.io/docs)

