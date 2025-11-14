# 🔧 Corrigir .env.test

## ⚠️ Problema

O arquivo `.env.test` está com credenciais incorretas. A senha está como `postgres`, mas deveria ser `test123` (igual ao `.env` principal).

## ✅ Solução

Edite manualmente o arquivo `backend/.env.test` e atualize a `DATABASE_URL`:

**Antes:**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/churchapp_test"
```

**Depois:**
```env
DATABASE_URL="postgresql://postgres:test123@localhost:5432/churchapp_test?schema=public"
```

## 🚀 Depois de Corrigir

Execute novamente:

```bash
cd backend
npm run setup-test-db
```

Isso vai:
1. ✅ Criar o banco `churchapp_test` (se não existir)
2. ✅ Aplicar todas as migrations
3. ✅ Deixar tudo pronto para os testes

---

## 📝 Nota

Se sua senha do PostgreSQL for diferente de `test123`, use a senha correta no `.env.test`.

