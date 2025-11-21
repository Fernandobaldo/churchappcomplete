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

**Linux/macOS:**
```bash
# Se você tem o PostgreSQL instalado localmente
psql -U postgres

# Ou se estiver usando Docker
docker exec -it <nome_do_container_postgres> psql -U postgres
```

**Windows (PowerShell):**
```powershell
# Se você tem o PostgreSQL instalado localmente
# Use o caminho completo (ajuste a versão):
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres

# Ou se estiver usando Docker
docker exec -it <nome_do_container_postgres> psql -U postgres
```

**💡 Dica para Windows:** Se você não tem o `psql` no PATH, use o script npm em vez disso:
```powershell
cd backend
npm run create-test-db
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

### Erro: "psql is not recognized" (Windows)

O comando `psql` não está no PATH do Windows. Você tem 3 opções:

#### ✅ Opção 1: Usar o Script NPM (Recomendado)

Não precisa do `psql`! Use o script que já existe:

```powershell
cd backend
npm run create-test-db
```

Este script usa Node.js/Prisma e não requer o `psql` instalado.

#### Opção 2: Usar o Caminho Completo do psql

Encontre onde o PostgreSQL está instalado e use o caminho completo:

```powershell
# Localizações comuns no Windows:
# C:\Program Files\PostgreSQL\<versão>\bin\psql.exe
# C:\Program Files (x86)\PostgreSQL\<versão>\bin\psql.exe

# Exemplo (ajuste a versão):
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h localhost -p 5432 -c "CREATE DATABASE churchapp_test;"
```

#### Opção 3: Adicionar PostgreSQL ao PATH (Permanente)

1. Encontre o caminho do PostgreSQL (geralmente `C:\Program Files\PostgreSQL\<versão>\bin`)
2. Adicione ao PATH do sistema:
   - Pressione `Win + R`, digite `sysdm.cpl` e pressione Enter
   - Vá em "Avançado" → "Variáveis de Ambiente"
   - Em "Variáveis do sistema", encontre "Path" e clique em "Editar"
   - Clique em "Novo" e adicione: `C:\Program Files\PostgreSQL\<versão>\bin`
   - Reinicie o PowerShell

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

# Windows (PowerShell como Administrador)
Start-Service postgresql-x64-<versão>
# Ou use o Services (services.msc) e inicie o serviço PostgreSQL

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

