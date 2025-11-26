# 🗄️ Como Criar o Banco de Dados para Desenvolvimento

Este guia mostra como configurar o banco de dados para desenvolvimento local.

## 🚀 Método Rápido (Recomendado)

### Passo 1: Criar o arquivo `.env`

Crie o arquivo `backend/.env` com as seguintes variáveis:

```env
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/churchapp?schema=public"
JWT_SECRET="seu-secret-jwt-aqui"
```

**Importante**: 
- Substitua `SUA_SENHA` pela senha real do seu PostgreSQL
- O nome do banco pode ser `churchapp` ou qualquer outro nome que você preferir

### Passo 2: Criar o banco de dados

Você tem duas opções:

#### Opção A: Usando Script (se existir script para dev)

```powershell
cd backend
# Se houver script específico para dev, use-o
# Caso contrário, crie manualmente (veja Opção B)
```

#### Opção B: Criar Manualmente

**Windows (PowerShell):**

```powershell
# Se você tem o PostgreSQL instalado localmente
# Use o caminho completo (ajuste a versão):
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres

# No prompt do PostgreSQL, execute:
CREATE DATABASE churchapp;
\q
```

**Linux/macOS:**

```bash
psql -U postgres
# No prompt do PostgreSQL:
CREATE DATABASE churchapp;
\q
```

**Docker:**

```bash
docker exec -it <nome_do_container_postgres> psql -U postgres -c "CREATE DATABASE churchapp;"
```

### Passo 3: Aplicar o Schema (Migrations)

Para banco de desenvolvimento, você pode usar `migrate deploy` ou `db push`:

#### Opção A: Usar Migrations (Recomendado para produção/dev)

```powershell
cd backend
npx prisma migrate deploy
```

#### Opção B: Usar db push (Mais rápido, mas não mantém histórico)

```powershell
cd backend
npx prisma db push
```

**Nota**: `db push` aplica o schema diretamente sem usar o histórico de migrations. É mais rápido, mas `migrate deploy` é recomendado para manter o histórico.

### Passo 4: Executar o Seed (Criar Plano Gratuito)

```powershell
cd backend
npm run seed
```

Isso cria o plano gratuito necessário para registro de usuários.

## ✅ Verificar se Está Funcionando

### 1. Verificar conexão

```powershell
cd backend
npx prisma db pull
```

Se funcionar, você verá a estrutura do banco sendo lida.

### 2. Verificar se o plano existe

```powershell
cd backend
npm run check-plan
```

Deve mostrar que o plano gratuito existe.

### 3. Iniciar o servidor

```powershell
cd backend
npm run dev
```

O servidor deve iniciar em `http://localhost:3333` sem erros.

## 📝 Exemplo Completo de `.env`

```env
# Banco de Dados
DATABASE_URL="postgresql://postgres:minhasenha123@localhost:5432/churchapp?schema=public"

# JWT Secret (use uma string segura em produção)
JWT_SECRET="meu-secret-jwt-super-seguro-para-desenvolvimento"
```

## 🔍 Solução de Problemas

### Erro: "database does not exist"

O banco não foi criado. Crie manualmente:

```sql
CREATE DATABASE churchapp;
```

### Erro: "authentication failed"

As credenciais no `.env` estão incorretas. Verifique:
- ✅ Usuário correto (geralmente `postgres`)
- ✅ Senha correta
- ✅ Host correto (geralmente `localhost`)
- ✅ Porta correta (geralmente `5432`)

### Erro: "connection refused"

O PostgreSQL não está rodando. Inicie o serviço:

**Windows (PowerShell como Administrador):**
```powershell
Start-Service postgresql-x64-16
# Ou use o Services (services.msc) e inicie o serviço PostgreSQL
```

**Linux:**
```bash
sudo systemctl start postgresql
```

**macOS:**
```bash
brew services start postgresql
```

**Docker:**
```bash
docker start <nome_do_container>
```

### Erro: "The database schema is not empty" (P3005)

Se você já tem tabelas no banco mas não tem histórico de migrations, use `db push`:

```powershell
cd backend
npx prisma db push --force-reset --accept-data-loss
```

⚠️ **ATENÇÃO**: Isso vai apagar todos os dados do banco!

### Erro: "Plano gratuito não encontrado"

Execute o seed:

```powershell
cd backend
npm run seed
```

## 📋 Resumo dos Comandos

```powershell
# 1. Criar arquivo .env (manualmente)
# Edite backend/.env e adicione DATABASE_URL e JWT_SECRET

# 2. Criar banco de dados (manualmente via psql ou script)
CREATE DATABASE churchapp;

# 3. Aplicar schema
cd backend
npx prisma migrate deploy
# OU
npx prisma db push

# 4. Executar seed
npm run seed

# 5. Verificar
npm run check-plan

# 6. Iniciar servidor
npm run dev
```

## 🔄 Diferença entre Banco de Desenvolvimento e Teste

| Aspecto | Desenvolvimento | Teste |
|---------|----------------|-------|
| Arquivo de config | `.env` | `.env.test` |
| Nome do banco | `churchapp` | `churchapp_test` |
| Método de schema | `migrate deploy` | `db push` (reseta) |
| Seed | `npm run seed` | `npm run seed:test` |
| Uso | Desenvolvimento diário | Execução de testes |

## 💡 Dicas

1. **Use bancos separados**: Mantenha `churchapp` para desenvolvimento e `churchapp_test` para testes
2. **Backup regular**: Faça backup do banco de desenvolvimento antes de mudanças grandes
3. **Migrations**: Use `migrate deploy` para manter histórico, `db push` apenas para prototipagem rápida
4. **Seed**: Execute o seed sempre que resetar o banco ou criar um novo

## 🚀 Próximos Passos

Após configurar o banco de desenvolvimento:

1. ✅ Banco criado
2. ✅ Schema aplicado
3. ✅ Seed executado
4. ✅ Servidor rodando (`npm run dev`)

Agora você pode:
- Desenvolver normalmente
- Testar a API em `http://localhost:3333/docs`
- Registrar usuários e criar recursos

---

**Nota**: O arquivo `.env` não deve ser commitado no Git (já está no `.gitignore`). Cada desenvolvedor deve criar seu próprio `.env` com suas credenciais locais.

