# 🔧 Solução para Erro P3005: "The database schema is not empty"

## ⚠️ Erro

```
Error: P3005
The database schema is not empty. Read more about how to baseline an existing production database
```

## 📋 Causa

Este erro ocorre quando:
- O banco de dados já tem tabelas criadas
- O Prisma não tem um histórico de migrations aplicadas
- Você está tentando usar `prisma migrate deploy` em um banco que não foi inicializado com migrations

## ✅ Solução para Banco de Teste

Para banco de **teste**, use `prisma db push` em vez de `migrate deploy`:

```bash
cd backend
npx dotenv-cli -e .env.test -- npx prisma db push --force-reset --accept-data-loss
```

### O que este comando faz:

1. **`--force-reset`**: Reseta o banco completamente (apaga todas as tabelas)
2. **`--accept-data-loss`**: Confirma que você aceita perder os dados
3. **`db push`**: Aplica o schema atual diretamente, sem precisar do histórico de migrations

### Por que usar `db push` para testes?

- ✅ Mais simples e rápido
- ✅ Não precisa do histórico de migrations
- ✅ Garante que o schema está sempre sincronizado
- ✅ Perfeito para ambientes de teste onde você pode resetar o banco

## ✅ Solução para Banco de Produção/Desenvolvimento

Para banco de **produção ou desenvolvimento**, você tem duas opções:

### Opção 1: Baseline das migrations (recomendado)

Marque todas as migrations como aplicadas sem executá-las:

```bash
# Primeiro, liste todas as migrations
ls prisma/migrations

# Depois, marque cada uma como aplicada
npx prisma migrate resolve --applied NOME_DA_MIGRATION
```

### Opção 2: Resetar e aplicar migrations

⚠️ **ATENÇÃO**: Isso vai apagar todos os dados!

```bash
npx prisma migrate reset
npx prisma migrate deploy
```

## 🚀 Comando Completo para Testes

Para configurar o banco de teste do zero:

```bash
cd backend

# 1. Criar banco (se não existir)
npm run create-test-db

# 2. Aplicar schema (usa db push)
npx dotenv-cli -e .env.test -- npx prisma db push --force-reset --accept-data-loss

# 3. Executar seed
npm run seed:test
```

Ou use o comando que faz tudo:

```bash
npm run setup-test-db
npm run seed:test
```

## 📝 Diferença entre `migrate deploy` e `db push`

| Comando | Uso | Histórico de Migrations | Reset |
|---------|-----|------------------------|-------|
| `migrate deploy` | Produção | ✅ Necessário | ❌ Não reseta |
| `db push` | Desenvolvimento/Teste | ❌ Não precisa | ✅ Pode resetar |

## 🔍 Verificar se Funcionou

Após aplicar o schema, verifique:

```bash
# Verificar se as tabelas foram criadas
npx dotenv-cli -e .env.test -- npx prisma db pull

# Ou executar o seed
npm run seed:test
```

Se o seed executar sem erros, está tudo funcionando! ✅

