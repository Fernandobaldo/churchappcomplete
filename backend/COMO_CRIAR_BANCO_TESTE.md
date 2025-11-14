# 🗄️ Como Criar o Banco de Dados para Testes

## 🚀 Método Rápido (Recomendado)

### Opção 1: Script Automático

```bash
cd backend
npm run create-test-db
```

Este script vai:
1. Ler o `.env.test`
2. Conectar ao PostgreSQL
3. Criar o banco `churchapp_test` se não existir

### Opção 2: Setup Completo (Criar + Migrations)

```bash
cd backend
npm run setup-test-db
```

Este comando faz tudo:
1. Cria o banco de dados
2. Aplica todas as migrations

---

## 📝 Método Manual

### 1. Conectar ao PostgreSQL

```bash
# Se você tem o PostgreSQL instalado localmente
psql -U postgres

# Ou se estiver usando Docker
docker exec -it <nome_do_container_postgres> psql -U postgres
```

### 2. Criar o Banco

No prompt do PostgreSQL:

```sql
CREATE DATABASE churchapp_test;
```

### 3. Verificar

```sql
\l
```

Você deve ver `churchapp_test` na lista.

### 4. Sair

```sql
\q
```

### 5. Aplicar Migrations

```bash
cd backend
dotenv -e .env.test -- npx prisma migrate deploy
```

---

## ⚙️ Verificar Configuração

Certifique-se de que o arquivo `backend/.env.test` está correto:

```env
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/churchapp_test?schema=public"
JWT_SECRET="test_secret_key"
```

**Importante**: Substitua `SUA_SENHA` pela senha real do seu PostgreSQL.

---

## ✅ Testar

Depois de criar o banco, teste a conexão:

```bash
cd backend
npm test
```

---

## 🔍 Solução de Problemas

### Erro: "authentication failed"

As credenciais no `.env.test` estão incorretas. Verifique:
- ✅ Usuário correto (geralmente `postgres`)
- ✅ Senha correta
- ✅ Host correto (geralmente `localhost`)
- ✅ Porta correta (geralmente `5432`)

### Erro: "connection refused"

O PostgreSQL não está rodando. Inicie o serviço:

```bash
# macOS (Homebrew)
brew services start postgresql

# Linux (systemd)
sudo systemctl start postgresql

# Docker
docker start <nome_do_container>
```

### Erro: "database does not exist"

O banco não foi criado. Execute novamente:
```bash
npm run create-test-db
```

---

## 📋 Resumo dos Comandos

```bash
# Criar banco
npm run create-test-db

# Criar banco + aplicar migrations
npm run setup-test-db

# Apenas aplicar migrations
dotenv -e .env.test -- npx prisma migrate deploy

# Executar testes
npm test
```

---

## 💡 Dica

Se você quiser usar o mesmo banco de desenvolvimento para testes (não recomendado):

```bash
# Copie o .env para .env.test
cp .env .env.test
```

⚠️ **Atenção**: Isso fará com que os testes usem o banco de desenvolvimento e possam limpar dados reais!

