# 🚀 Como Rodar o Backend para Testes E2E do Frontend

Os testes E2E do frontend fazem chamadas HTTP reais ao backend. O backend precisa estar rodando e configurado corretamente.

## ⚠️ IMPORTANTE: Use o Banco de Teste!

**Os testes E2E do frontend DEVEM usar o banco de dados de teste (`churchapp_test`), não o de desenvolvimento (`churchapp`)!**

Para garantir isso, use os comandos `start:test` ou `dev:test` em vez de `dev`.

## ⚙️ Configuração Necessária

### 1. Configure o arquivo `.env.test`

Crie o arquivo `backend/.env.test`:

```env
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/churchapp_test?schema=public"
JWT_SECRET="test_secret_key"
```

**Importante**: 
- Use `churchapp_test` (não `churchapp`)
- Substitua `SUA_SENHA` pela senha real do seu PostgreSQL

## 🚀 Como Rodar o Backend para Testes E2E

### 1. Configure o banco de teste

```bash
cd backend

# Cria o banco de teste e aplica o schema
npm run setup-test-db

# Cria o plano gratuito no banco de teste
npm run seed:test
```

### 2. Inicie o servidor em modo de teste

**Opção A: Modo produção (recomendado para testes)**
```bash
cd backend
npm run start:test
```

**Opção B: Modo watch (desenvolvimento)**
```bash
cd backend
npm run dev:test
```

⚠️ **NÃO use `npm run dev`** - isso usa o banco de desenvolvimento!

O servidor deve iniciar em `http://localhost:3333` e mostrar:
```
[SERVER] 🧪 Modo E2E ativado - usando .env.test
[SERVER] ✅ Modo E2E: Usando banco de teste
```

### 3. Verifique se está funcionando

Abra no navegador: `http://localhost:3333/docs`

Você deve ver a documentação Swagger da API.

## 🧪 Executar Testes E2E do Frontend

Com o backend rodando em modo de teste (`npm run start:test` ou `npm run dev:test`):

```bash
cd web
npm run test:e2e
```

## 🔍 Verificar se Está Usando o Banco de Teste

Quando você iniciar o backend com `start:test` ou `dev:test`, você deve ver nos logs:

```
[SERVER] 🧪 Modo E2E ativado - usando .env.test
[SERVER] ✅ Modo E2E: Usando banco de teste
```

Se não aparecer essas mensagens, o backend não está em modo de teste e pode estar usando o banco de desenvolvimento!

## ⚠️ Problemas Comuns

### Erro: "Environment variable not found: DATABASE_URL"

**Causa**: O backend não encontrou a `DATABASE_URL` em `.env` nem em `.env.test`.

**Solução**:
1. Crie o arquivo `backend/.env` ou `backend/.env.test`
2. Adicione a `DATABASE_URL` com a URL do seu PostgreSQL
3. Reinicie o servidor: `npm run dev`

### Erro: "Plano gratuito não encontrado"

**Causa**: O banco não tem o plano gratuito criado.

**Solução**:
```bash
cd backend
npm run seed        # Para banco de desenvolvimento
# OU
npm run seed:test   # Para banco de teste
```

### Erro: "The table `public.Plan` does not exist"

**Causa**: As migrations/schema não foram aplicadas.

**Solução**:
```bash
cd backend
npm run setup-test-db
```

## 📝 Checklist Antes de Rodar Testes E2E

- [ ] Arquivo `backend/.env.test` existe com `DATABASE_URL` apontando para `churchapp_test`
- [ ] Banco de teste foi criado (`npm run setup-test-db`)
- [ ] Schema foi aplicado no banco de teste
- [ ] Plano gratuito foi criado no banco de teste (`npm run seed:test`)
- [ ] Backend está rodando em modo de teste (`npm run start:test` ou `npm run dev:test`)
- [ ] Logs do backend mostram "Modo E2E ativado" e "Usando banco de teste"
- [ ] Backend responde em `http://localhost:3333`

## 🔍 Verificar se Está Tudo OK

```bash
# 1. Verificar se o backend está rodando
curl http://localhost:3333/docs

# 2. Verificar se consegue registrar um usuário (deve retornar 201)
curl -X POST http://localhost:3333/public/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste","email":"teste@test.com","password":"123456"}'
```

Se ambos funcionarem, está tudo configurado! ✅

