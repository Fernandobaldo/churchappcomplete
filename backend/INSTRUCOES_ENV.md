# 🔧 Configuração do Ambiente - DATABASE_URL

## ⚠️ Erro Encontrado

O Prisma está tentando executar a migration mas não encontra a variável `DATABASE_URL` no arquivo `.env`.

## ✅ Solução

### 1. Configure o arquivo `.env`

Adicione a variável `DATABASE_URL` no arquivo `backend/.env`:

```bash
# Exemplo para PostgreSQL local
DATABASE_URL="postgresql://usuario:senha@localhost:5432/nome_do_banco?schema=public"

# Exemplo para PostgreSQL com Docker
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/churchapp?schema=public"
```

### 2. Formato da URL

A URL do PostgreSQL segue o formato:
```
postgresql://[usuario]:[senha]@[host]:[porta]/[database]?schema=public
```

### 3. Exemplos Comuns

**PostgreSQL Local:**
```env
DATABASE_URL="postgresql://postgres:senha123@localhost:5432/churchapp?schema=public"
```

**PostgreSQL com Docker:**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/churchapp?schema=public"
```

**PostgreSQL na nuvem (Supabase, Railway, etc.):**
```env
DATABASE_URL="postgresql://usuario:senha@host.railway.app:5432/railway?schema=public"
```

### 4. Outras Variáveis Necessárias

Certifique-se de que o arquivo `.env` também tenha:

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="seu-secret-jwt-aqui"
```

### 5. Após Configurar

Depois de configurar o `.env`, execute a migration:

```bash
cd backend
npx prisma migrate dev --name add_audit_log
```

---

## 🔍 Verificar se está funcionando

Para verificar se o Prisma consegue conectar:

```bash
cd backend
npx prisma db pull
```

Se funcionar, você verá a estrutura do banco. Se não, verifique:
- ✅ O banco de dados está rodando?
- ✅ A URL está correta?
- ✅ As credenciais estão corretas?
- ✅ O banco de dados existe?

---

## 📝 Nota

O arquivo `.env` não deve ser commitado no Git (já está no `.gitignore`). 
Cada desenvolvedor deve criar seu próprio `.env` com suas credenciais locais.

