# 🧪 Configuração de Testes

## ⚠️ Problema Comum

Se os testes estão falhando com erro de autenticação do banco, verifique:

### 1. Arquivo `.env.test`

O arquivo `backend/.env.test` deve ter a `DATABASE_URL` configurada corretamente:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/churchapp_test?schema=public"
JWT_SECRET="test_secret_key"
```

### 2. Banco de Teste

Certifique-se de que:
- ✅ O PostgreSQL está rodando
- ✅ O banco `churchapp_test` existe
- ✅ As credenciais estão corretas

### 3. Criar Banco de Teste

Se o banco não existe, crie:

```sql
CREATE DATABASE churchapp_test;
```

### 4. Aplicar Migrations no Banco de Teste

```bash
cd backend
DATABASE_URL="postgresql://usuario:senha@localhost:5432/churchapp_test?schema=public" npx prisma migrate deploy
```

### 5. Executar Testes

```bash
npm test
```

---

## 🔧 Solução Rápida

Se você não tem um banco de teste configurado, pode:

1. **Usar o mesmo banco de desenvolvimento** (não recomendado para produção):
   - Copie o `.env` para `.env.test`
   - ⚠️ Cuidado: os testes vão limpar os dados!

2. **Criar um banco de teste separado** (recomendado):
   ```sql
   CREATE DATABASE churchapp_test;
   ```
   E configure o `.env.test` com as credenciais corretas.

---

## 📝 Nota

O `setupTestEnv.ts` agora não mata todos os testes se houver erro no reset do banco. Ele apenas avisa e continua, permitindo que você veja quais testes específicos estão falhando.

