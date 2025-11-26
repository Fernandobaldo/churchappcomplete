# 🧪 Como Rodar Testes E2E do Frontend

Os testes E2E do frontend fazem chamadas HTTP reais ao backend. É **ESSENCIAL** que o backend esteja rodando com o **banco de dados de teste**, não o de desenvolvimento.

## ⚠️ IMPORTANTE: Use o Banco de Teste!

**Os testes E2E DEVEM usar o banco `churchapp_test`, nunca o `churchapp` de desenvolvimento!**

## 🚀 Passo a Passo

### 1. Configure o Banco de Teste

```powershell
cd backend

# Cria o banco de teste e aplica o schema
npm run setup-test-db

# Cria o plano gratuito no banco de teste
npm run seed:test
```

### 2. Inicie o Backend em Modo de Teste

**IMPORTANTE**: Use `start:test` ou `dev:test`, **NÃO** use `dev`!

```powershell
cd backend

# Modo produção (recomendado para testes)
npm run start:test

# OU modo watch (desenvolvimento)
npm run dev:test
```

Você deve ver nos logs:
```
[SERVER] 🧪 Detectado banco de teste - modo E2E ativado
[SERVER] ✅ Modo E2E: Usando banco de teste
```

### 3. Execute os Testes E2E

Em outro terminal:

```powershell
cd web
npm run test:e2e
```

## 🔍 Verificação

### Verificar se o Backend Está Usando o Banco de Teste

Quando você iniciar o backend com `start:test` ou `dev:test`, procure por estas mensagens nos logs:

```
[SERVER] 🧪 Detectado banco de teste - modo E2E ativado
[SERVER] ✅ Modo E2E: Usando banco de teste
```

Se não aparecer, o backend pode estar usando o banco de desenvolvimento!

### Verificar a DATABASE_URL

O arquivo `backend/.env.test` deve ter:

```env
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/churchapp_test?schema=public"
JWT_SECRET="test_secret_key"
```

**Importante**: A URL deve conter `churchapp_test` (não `churchapp`).

## ⚠️ Problemas Comuns

### Backend usando banco de desenvolvimento

**Sintoma**: Testes criam dados no banco de desenvolvimento

**Solução**: 
- Certifique-se de usar `npm run start:test` ou `npm run dev:test`
- **NÃO** use `npm run dev` (usa banco de desenvolvimento)
- Verifique os logs do backend para confirmar que está usando banco de teste

### Erro: "Plano gratuito não encontrado"

**Solução**: Execute `npm run seed:test` no backend

### Erro: "database does not exist"

**Solução**: Execute `npm run setup-test-db` no backend

## 📝 Checklist

Antes de executar os testes E2E:

- [ ] Arquivo `backend/.env.test` existe
- [ ] `DATABASE_URL` em `.env.test` aponta para `churchapp_test`
- [ ] Banco de teste foi criado (`npm run setup-test-db`)
- [ ] Plano gratuito foi criado (`npm run seed:test`)
- [ ] Backend está rodando com `npm run start:test` ou `npm run dev:test`
- [ ] Logs do backend mostram "Usando banco de teste"
- [ ] Backend responde em `http://localhost:3333`

## 🔄 Diferença entre os Comandos

| Comando | Banco Usado | Uso |
|---------|------------|-----|
| `npm run dev` | `churchapp` (dev) | Desenvolvimento normal |
| `npm run start:test` | `churchapp_test` | Testes E2E (produção) |
| `npm run dev:test` | `churchapp_test` | Testes E2E (watch) |

## 📚 Referências

- [Backend: Como Criar Banco de Teste](../backend/COMO_CRIAR_BANCO_TESTE.md)
- [Backend: Como Executar Seed](../backend/COMO_EXECUTAR_SEED.md)
- [Testes E2E: README](./src/__tests__/e2e/README.md)


