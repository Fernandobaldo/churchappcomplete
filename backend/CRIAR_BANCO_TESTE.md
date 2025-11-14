# 🗄️ Como Criar o Banco de Dados para Testes

## 📋 Passo a Passo

### 1. Conectar ao PostgreSQL

Abra o terminal e conecte ao PostgreSQL:

```bash
# Se você tem o PostgreSQL instalado localmente
psql -U postgres

# Ou se estiver usando Docker
docker exec -it <nome_do_container_postgres> psql -U postgres
```

### 2. Criar o Banco de Dados

No prompt do PostgreSQL, execute:

```sql
CREATE DATABASE churchapp_test;
```

### 3. Verificar se foi Criado

```sql
\l
```

Você deve ver `churchapp_test` na lista de bancos.

### 4. Sair do PostgreSQL

```sql
\q
```

---

## 🔧 Alternativa: Usando SQL Direto

Se preferir, você pode criar o banco diretamente via linha de comando:

```bash
# Usando psql
psql -U postgres -c "CREATE DATABASE churchapp_test;"

# Ou com senha
PGPASSWORD=senha psql -U postgres -h localhost -c "CREATE DATABASE churchapp_test;"
```

---

## ⚙️ Configurar o .env.test

Certifique-se de que o arquivo `backend/.env.test` está configurado corretamente:

```env
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/churchapp_test?schema=public"
JWT_SECRET="test_secret_key"
```

**Importante**: Substitua `SUA_SENHA` pela senha real do seu PostgreSQL.

---

## 🚀 Aplicar Migrations no Banco de Teste

Depois de criar o banco, aplique as migrations:

```bash
cd backend

# Usando a DATABASE_URL do .env.test
npx prisma migrate deploy --schema=prisma/schema.prisma
```

Ou especificando a URL diretamente:

```bash
DATABASE_URL="postgresql://postgres:senha@localhost:5432/churchapp_test?schema=public" npx prisma migrate deploy
```

---

## ✅ Verificar se Está Funcionando

Teste a conexão:

```bash
cd backend
DATABASE_URL="postgresql://postgres:senha@localhost:5432/churchapp_test?schema=public" npx prisma db pull
```

Se funcionar, você verá a estrutura do banco sendo lida.

---

## 🧪 Executar os Testes

Agora você pode executar os testes:

```bash
cd backend
npm test
```

---

## 🔍 Solução de Problemas

### Erro: "database does not exist"

O banco não foi criado. Execute novamente o `CREATE DATABASE`.

### Erro: "authentication failed"

As credenciais no `.env.test` estão incorretas. Verifique:
- Usuário correto (geralmente `postgres`)
- Senha correta
- Host correto (geralmente `localhost`)
- Porta correta (geralmente `5432`)

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

---

## 📝 Exemplo Completo

```bash
# 1. Criar banco
psql -U postgres -c "CREATE DATABASE churchapp_test;"

# 2. Configurar .env.test (edite o arquivo)
# DATABASE_URL="postgresql://postgres:senha@localhost:5432/churchapp_test?schema=public"

# 3. Aplicar migrations
cd backend
DATABASE_URL="postgresql://postgres:senha@localhost:5432/churchapp_test?schema=public" npx prisma migrate deploy

# 4. Executar testes
npm test
```

---

## 💡 Dica

Se você quiser usar o mesmo banco de desenvolvimento para testes (não recomendado, mas útil para desenvolvimento rápido):

```bash
# Copie o .env para .env.test
cp .env .env.test
```

⚠️ **Atenção**: Isso fará com que os testes usem o banco de desenvolvimento e possam limpar dados reais!

