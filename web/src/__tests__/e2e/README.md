# Testes E2E (End-to-End) - Frontend

Este diretório contém os testes end-to-end que validam o fluxo completo da aplicação através de chamadas reais à API do backend, sem usar mocks.

## 📋 Visão Geral

Os testes E2E simulam o comportamento real de um usuário fazendo chamadas HTTP diretas à API, testando:

1. **Registro de usuário** (`/public/register`)
2. **Autenticação** (`/auth/login`)
3. **Criação de igreja** (`/churches`)
4. **Criação de eventos** (`/events`)
5. **Criação de contribuições** (`/contributions`)
6. **Redirecionamento de onboarding** após login

## ⚠️ IMPORTANTE: Banco de Dados de Teste

**Os testes E2E do frontend DEVEM usar o banco de dados de teste, não o de desenvolvimento!**

O backend precisa estar rodando em modo de teste para garantir que usa o banco `churchapp_test` em vez de `churchapp`.

## 🚀 Como Executar

### Pré-requisitos

1. **Configure o banco de teste no backend:**
   ```bash
   cd backend
   npm run setup-test-db  # Cria banco e aplica schema
   npm run seed:test      # Cria plano gratuito
   ```

2. **Inicie o backend em modo de teste:**
   ```bash
   cd backend
   npm run start:test
   ```
   
   Ou em modo watch (desenvolvimento):
   ```bash
   cd backend
   npm run dev:test
   ```

   **Importante**: Use `start:test` ou `dev:test` em vez de `dev` para garantir que o backend use o banco de teste!

3. **Execute os testes E2E do frontend:**
   ```bash
   cd web
   npm run test:e2e
   ```

## 🔧 Configuração

### Backend em Modo de Teste

O backend detecta automaticamente quando deve usar o banco de teste através da variável de ambiente `E2E_TEST=true`.

Os scripts `start:test` e `dev:test` definem essa variável automaticamente, garantindo que:
- O backend carrega `.env.test` em vez de `.env`
- O banco de dados usado é `churchapp_test` (não `churchapp`)
- Os dados de teste não interferem com dados de desenvolvimento

### Variáveis de Ambiente

**Backend** (`backend/.env.test`):
```env
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/churchapp_test?schema=public"
JWT_SECRET="test_secret_key"
```

**Frontend** (opcional, `web/.env.test`):
```env
VITE_API_URL=http://localhost:3333
```

Se não configurada, usa `http://localhost:3333` por padrão.

## 📝 Estrutura dos Testes

```
src/__tests__/e2e/
├── README.md                    # Esta documentação
├── complete-flow.test.tsx       # Teste principal com fluxo completo
├── onboarding-redirect.test.tsx # Teste de redirecionamento de onboarding
└── helpers/
    ├── apiHelpers.ts           # Funções auxiliares que fazem chamadas reais à API
    └── testHelpers.tsx         # Helpers para renderização de componentes
```

## 🧪 Cenários de Teste

### 1. Fluxo Completo
- Registro → Criação de Igreja → Evento → Contribuição
- Login após registro → Criação de recursos
- Múltiplos eventos e contribuições
- Validações e tratamento de erros

### 2. Redirecionamento de Onboarding
- Login após registro sem completar onboarding
- Login após completar onboarding
- Tentativa de acessar dashboard sem onboarding

## 🔍 Verificação

Antes de executar os testes, verifique:

1. ✅ Backend está rodando em modo de teste (`npm run start:test`)
2. ✅ Banco `churchapp_test` existe e está configurado
3. ✅ Schema aplicado (`npm run setup-test-db`)
4. ✅ Plano gratuito criado (`npm run seed:test`)
5. ✅ Arquivo `backend/.env.test` existe com `DATABASE_URL` correta

## 🐛 Debugging

Para debugar os testes:

1. **Verificar qual banco o backend está usando:**
   - Procure por logs `[SERVER] ✅ Modo E2E: Usando banco de teste`
   - Verifique se a URL contém `churchapp_test`

2. **Logs do backend:**
   - O backend mostra qual `.env` está sendo usado
   - Verifique se aparece `[SERVER] 🧪 Modo E2E ativado`

3. **Logs dos testes:**
   - Use `console.log('[E2E Frontend] ...')` para logs específicos
   - Os testes mostram qual banco está sendo usado

## ⚠️ Problemas Comuns

### Backend usando banco de desenvolvimento

**Sintoma**: Testes criam dados no banco de desenvolvimento

**Solução**: 
- Certifique-se de usar `npm run start:test` ou `npm run dev:test`
- Não use `npm run dev` (usa banco de desenvolvimento)

### Erro: "Plano gratuito não encontrado"

**Solução**: Execute `npm run seed:test` no backend

### Erro: "database does not exist"

**Solução**: Execute `npm run setup-test-db` no backend

## 📊 Cobertura

Os testes E2E cobrem:
- ✅ Registro público de usuário
- ✅ Autenticação (login)
- ✅ Redirecionamento de onboarding
- ✅ Criação de igreja e filial
- ✅ Criação de eventos
- ✅ Criação de contribuições
- ✅ Validações de campos obrigatórios

## 🎯 Boas Práticas

1. **Isolamento**: Cada teste deve ser independente
2. **Timestamps**: Use timestamps únicos para evitar conflitos
3. **Validação**: Sempre valide os dados retornados
4. **Logs**: Use logs descritivos para facilitar debugging
5. **Timeouts**: Configure timeouts adequados para aguardar respostas do backend
6. **Banco de Teste**: Sempre use o banco de teste, nunca o de desenvolvimento

## 📚 Referências

- [Backend: Como Rodar para Testes](./backend/COMO_RODAR_BACKEND_PARA_TESTES.md)
- [Backend: Como Criar Banco de Teste](./backend/COMO_CRIAR_BANCO_TESTE.md)
- [Backend: Como Executar Seed](./backend/COMO_EXECUTAR_SEED.md)
