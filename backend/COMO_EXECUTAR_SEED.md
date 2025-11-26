# 🌱 Como Executar o Seed do Banco de Dados

O seed cria o plano gratuito necessário para o registro de usuários.

## ⚠️ IMPORTANTE: Aplique as Migrations Primeiro!

**Antes de executar o seed, você DEVE aplicar as migrations no banco de dados.** O seed precisa que as tabelas já existam.

### Método Rápido (Recomendado para Testes)

Para o banco de teste, use o comando que faz tudo automaticamente:

```bash
cd backend
npm run setup-test-db
npm run seed:test
```

Este comando:
1. Cria o banco de dados (se não existir)
2. Aplica todas as migrations
3. Depois você pode executar o seed

## 🚀 Método Manual

### Opção 1: Usar o banco de desenvolvimento (`.env`)

1. **Crie o arquivo `.env`** no diretório `backend/` (se não existir):

```env
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/churchapp?schema=public"
JWT_SECRET="seu-secret-jwt-aqui"
```

2. **Aplique as migrations:**

```bash
cd backend
npx prisma migrate deploy
```

3. **Execute o seed:**

```bash
npm run seed
```

### Opção 2: Usar o banco de teste (`.env.test`)

1. **Crie o arquivo `.env.test`** no diretório `backend/` (se não existir):

```env
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/churchapp_test?schema=public"
JWT_SECRET="test_secret_key"
```

2. **Aplique o schema (para testes, usa db push):**

```bash
cd backend
npx dotenv-cli -e .env.test -- npx prisma db push --force-reset --accept-data-loss
```

**Nota**: Para banco de teste, usamos `db push` em vez de `migrate deploy` porque:
- Reseta o banco completamente
- Aplica o schema atual sem precisar do histórico de migrations
- É mais simples e confiável para ambientes de teste

3. **Execute o seed:**

```bash
npm run seed:test
```

## 📝 O que o seed faz?

O seed cria o plano gratuito (`free`) com as seguintes características:
- Nome: `free`
- Preço: R$ 0,00
- Limite de igrejas: 1
- Limite de filiais: 1
- Limite de membros: 20

## ⚠️ Importante

- O seed verifica se o plano já existe antes de criar
- Se o plano já existir, apenas informa e não cria duplicado
- Você precisa ter um banco de dados PostgreSQL rodando
- O banco deve estar acessível com as credenciais fornecidas na `DATABASE_URL`

## 🔍 Verificar se funcionou

Após executar o seed, você deve ver uma das mensagens:

- ✅ `Plano Free criado com sucesso.` (se foi criado)
- ℹ️ `Plano Free já existe (nome: "free").` (se já existia)

## 🚨 Solução de Problemas

### Erro: "The table `public.Plan` does not exist"

**Causa**: O schema não foi aplicado no banco de dados.

**Solução**: 
1. Aplique o schema primeiro:
   ```bash
   # Para banco de desenvolvimento
   npx prisma migrate deploy
   
   # Para banco de teste (recomendado usar db push)
   npx dotenv-cli -e .env.test -- npx prisma db push --force-reset --accept-data-loss
   ```
2. Depois execute o seed novamente

### Erro: "The database schema is not empty" (P3005)

**Causa**: O banco já tem tabelas, mas o Prisma não tem histórico de migrations.

**Solução**: 
Para banco de teste, use `db push` em vez de `migrate deploy`:
```bash
npx dotenv-cli -e .env.test -- npx prisma db push --force-reset --accept-data-loss
```

Isso vai resetar o banco e aplicar o schema atual.

### Erro: "Environment variable not found: DATABASE_URL"

**Causa**: O arquivo `.env` ou `.env.test` não existe ou não contém `DATABASE_URL`.

**Solução**: 
1. Crie o arquivo `.env` ou `.env.test` no diretório `backend/`
2. Adicione a variável `DATABASE_URL` com a URL do seu banco PostgreSQL

### Erro: "Can't reach database server"

**Causa**: O PostgreSQL não está rodando ou as credenciais estão incorretas.

**Solução**:
1. Verifique se o PostgreSQL está rodando
2. Verifique se a `DATABASE_URL` está correta
3. Teste a conexão manualmente com `psql` ou outra ferramenta

### Erro: "database does not exist"

**Causa**: O banco de dados especificado na `DATABASE_URL` não existe.

**Solução**:
1. Crie o banco de dados manualmente:
   ```sql
   CREATE DATABASE churchapp;
   ```
2. Ou use o script de criação: `npm run create-test-db` (para banco de teste)
3. Depois aplique as migrations antes de executar o seed

## 📚 Próximos Passos

Depois de executar o seed com sucesso:

1. **Para desenvolvimento**: O backend pode registrar novos usuários
2. **Para testes**: Execute os testes E2E do frontend: `cd web && npm run test:e2e`

---

**Nota**: O seed foi atualizado para carregar automaticamente o arquivo `.env` ou `.env.test` se disponível.

