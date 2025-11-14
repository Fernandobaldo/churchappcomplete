# 📋 Instruções para Aplicar Migration de Auditoria

## 🚀 Passos para Aplicar

### 1. Criar e Aplicar a Migration

```bash
cd backend
npx prisma migrate dev --name add_audit_log
```

Isso irá:
- Criar a migration com o modelo `AuditLog` e enum `AuditAction`
- Aplicar a migration no banco de dados
- Gerar o Prisma Client atualizado

### 2. Verificar se a Migration foi Aplicada

```bash
npx prisma migrate status
```

### 3. Gerar Prisma Client (se necessário)

```bash
npx prisma generate
```

---

## ✅ Verificação

Após aplicar a migration, você pode verificar se a tabela foi criada:

```sql
-- No PostgreSQL
SELECT * FROM "AuditLog" LIMIT 10;
```

---

## 📝 Nota

A migration já foi criada em:
`backend/prisma/migrations/20250127000000_add_audit_log/migration.sql`

Você pode aplicá-la manualmente ou usar o comando `prisma migrate dev`.

