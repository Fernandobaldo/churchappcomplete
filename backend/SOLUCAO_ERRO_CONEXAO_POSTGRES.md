# 🔧 Solução: Erro de Conexão com PostgreSQL

## ❌ Erro Encontrado

```
PrismaClientInitializationError: Can't reach database server at `localhost:5432`
Please make sure your database server is running at `localhost:5432`.
```

## 🔍 Diagnóstico

O Prisma não consegue conectar ao PostgreSQL porque:
1. ⚠️ O serviço PostgreSQL não está rodando
2. ⚠️ O arquivo `.env` não existe ou está mal configurado

## ✅ Solução Passo a Passo

### Passo 1: Verificar se o PostgreSQL está Instalado

O PostgreSQL 18 está instalado em: `C:\Program Files\PostgreSQL\18`

### Passo 2: Iniciar o PostgreSQL

#### Opção A: Via Serviços do Windows

1. Pressione `Win + R` e digite `services.msc`
2. Procure por um serviço com nome similar a:
   - `postgresql-x64-18`
   - `PostgreSQL 18`
   - `postgresql-x64-18-server`
3. Clique com botão direito → **Iniciar**
4. Se não aparecer, o PostgreSQL pode não ter sido instalado como serviço

#### Opção B: Iniciar Manualmente

Se o PostgreSQL não estiver configurado como serviço, você pode iniciá-lo manualmente:

```powershell
# Navegue até a pasta do PostgreSQL
cd "C:\Program Files\PostgreSQL\18\bin"

# Inicie o PostgreSQL
 & "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" -D "C:\PostgresData" -l "C:\PostgresData\logfile" start
```

#### Opção C: Usar Docker (Recomendado para desenvolvimento)

Se preferir, você pode usar Docker:

```powershell
docker run --name postgres-churchapp `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=churchapp `
  -p 5432:5432 `
  -d postgres:18
```

### Passo 3: Criar o Arquivo `.env`

Crie o arquivo `backend/.env` com o seguinte conteúdo:

```env
# Banco de Dados PostgreSQL
# IMPORTANTE: Substitua SUA_SENHA pela senha real do PostgreSQL
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/churchapp?schema=public"

# JWT Secret (use uma string segura)
JWT_SECRET="churchapp-secret-key-development"
```

**⚠️ ATENÇÃO**: 
- Substitua `SUA_SENHA` pela senha que você definiu durante a instalação do PostgreSQL
- Se você não lembra da senha, pode redefini-la ou usar a senha padrão `postgres` (se configurado assim)

### Passo 4: Criar o Banco de Dados

Se o banco `churchapp` ainda não existir, crie-o:

```powershell
# Conecte ao PostgreSQL
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres

# No prompt do PostgreSQL, execute:
CREATE DATABASE churchapp;

# Saia do PostgreSQL
\q
```

Ou diretamente via linha de comando:

```powershell
# Se você tem a senha configurada, use:
$env:PGPASSWORD="SUA_SENHA"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -c "CREATE DATABASE churchapp;"
```

### Passo 5: Aplicar o Schema (Migrations)

Depois de criar o banco e configurar o `.env`:

```powershell
cd backend
npx prisma migrate deploy
```

Ou, se preferir usar `db push` (mais rápido para desenvolvimento):

```powershell
cd backend
npx prisma db push
```

### Passo 6: Executar o Seed (Criar Plano Gratuito)

```powershell
cd backend
npm run seed
```

### Passo 7: Verificar se Está Funcionando

```powershell
cd backend
npx prisma db pull
```

Se funcionar, você verá a estrutura do banco sendo lida.

### Passo 8: Iniciar o Servidor

```powershell
cd backend
npm run dev
```

O servidor deve iniciar em `http://localhost:3333` sem erros de conexão.

## 🔍 Verificar Status do PostgreSQL

### Testar Conexão

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -c "SELECT version();"
```

### Verificar Porta 5432

```powershell
netstat -an | Select-String ":5432"
```

Se a porta estiver em uso, você verá algo como:
```
TCP    0.0.0.0:5432           0.0.0.0:0              LISTENING
```

## 🆘 Problemas Comuns

### Erro: "authentication failed"

As credenciais no `.env` estão incorretas. Verifique:
- ✅ Usuário correto (geralmente `postgres`)
- ✅ Senha correta
- ✅ Host correto (`localhost`)
- ✅ Porta correta (`5432`)

### Erro: "database does not exist"

Crie o banco de dados (veja Passo 4 acima).

### Erro: "connection refused" ou "Can't reach database server"

O PostgreSQL não está rodando:
1. Verifique os serviços do Windows (`services.msc`)
2. Tente iniciar o serviço manualmente
3. Verifique se a porta 5432 está em uso: `netstat -an | Select-String ":5432"`

### Erro: Serviço não encontrado

Se o PostgreSQL não aparece nos serviços, pode ter sido instalado sem serviço. Você pode:
1. Reinstalar o PostgreSQL e marcar a opção "Install as Windows Service"
2. Usar Docker (veja Opção C no Passo 2)

## 📝 Resumo dos Comandos

```powershell
# 1. Verificar PostgreSQL
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" --version

# 2. Criar banco (substitua SUA_SENHA)
$env:PGPASSWORD="SUA_SENHA"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -c "CREATE DATABASE churchapp;"

# 3. Criar arquivo .env (edite manualmente)
# DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/churchapp?schema=public"
# JWT_SECRET="churchapp-secret-key-development"

# 4. Aplicar migrations
cd backend
npx prisma migrate deploy

# 5. Executar seed
npm run seed

# 6. Iniciar servidor
npm run dev
```

## 💡 Dica

Se você não conseguir resolver, considere usar Docker para o PostgreSQL:

```powershell
docker run --name postgres-churchapp -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=churchapp -p 5432:5432 -d postgres:18
```

E então use no `.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/churchapp?schema=public"
```

---

**Criado em**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")


