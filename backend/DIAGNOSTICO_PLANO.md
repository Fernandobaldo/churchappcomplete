# 🔍 Diagnóstico: Plano Gratuito Não Encontrado

Se você está recebendo o erro "Plano gratuito não encontrado", siga estes passos para diagnosticar e resolver:

## 🔍 Passo 1: Verificar qual banco o backend está usando

Execute o script de diagnóstico:

```bash
cd backend
npm run check-plan
```

Este script vai mostrar:
- Qual banco o backend está conectado
- Se o plano gratuito existe
- Todos os planos que existem no banco

## 🔍 Passo 2: Verificar os logs do backend

Quando você inicia o backend (`npm run dev`), verifique os logs iniciais. Você deve ver algo como:

```
[SERVER] ✅ DATABASE_URL carregada do .env.test
```

Ou:

```
[SERVER] DATABASE_URL não encontrada no .env, tentando .env.test...
[SERVER] ✅ DATABASE_URL carregada do .env.test
```

Isso indica qual arquivo de configuração está sendo usado.

## 🔍 Passo 3: Verificar se o seed foi executado no banco correto

O problema mais comum é executar o seed em um banco diferente do que o backend está usando.

### Verificar qual banco o seed vai usar:

```bash
cd backend

# Ver qual DATABASE_URL está configurada
# Para .env.test
cat .env.test | grep DATABASE_URL

# Para .env
cat .env | grep DATABASE_URL
```

### Executar o seed no banco correto:

```bash
# Se o backend está usando .env.test
npm run seed:test

# Se o backend está usando .env
npm run seed
```

## 🔍 Passo 4: Verificar se o schema foi aplicado

O plano só pode existir se a tabela `Plan` existir. Verifique:

```bash
cd backend

# Aplicar schema no banco de teste
npm run setup-test-db

# Depois executar o seed
npm run seed:test
```

## ✅ Solução Completa (Passo a Passo)

Execute estes comandos na ordem:

```bash
cd backend

# 1. Verificar qual banco está configurado
npm run check-plan

# 2. Se o plano não existir, aplicar schema e criar plano
npm run setup-test-db
npm run seed:test

# 3. Verificar novamente
npm run check-plan

# 4. Reiniciar o backend
npm run dev
```

## 🚨 Problemas Comuns

### Problema 1: Backend usando banco diferente do seed

**Sintoma**: Seed executa com sucesso, mas backend ainda não encontra o plano.

**Causa**: Backend está usando `.env` mas seed foi executado com `.env.test` (ou vice-versa).

**Solução**: 
1. Verifique qual arquivo o backend está usando (veja logs)
2. Execute o seed no mesmo banco:
   ```bash
   # Se backend usa .env.test
   npm run seed:test
   
   # Se backend usa .env
   npm run seed
   ```

### Problema 2: Schema não aplicado

**Sintoma**: Erro "table does not exist" ou plano não encontrado.

**Causa**: As migrations/schema não foram aplicadas.

**Solução**:
```bash
npm run setup-test-db
npm run seed:test
```

### Problema 3: Múltiplos bancos configurados

**Sintoma**: Confusão sobre qual banco está sendo usado.

**Solução**: 
1. Use apenas um banco para desenvolvimento/testes
2. Configure apenas `.env` OU `.env.test`, não ambos
3. Execute o seed no banco que o backend está usando

## 📝 Checklist Final

Antes de rodar os testes E2E, verifique:

- [ ] Backend está rodando (`npm run dev`)
- [ ] `npm run check-plan` mostra que o plano existe
- [ ] Backend está usando o mesmo banco que tem o plano
- [ ] Schema foi aplicado (`npm run setup-test-db`)
- [ ] Seed foi executado (`npm run seed:test` ou `npm run seed`)

## 🔧 Comando Rápido de Diagnóstico

Execute este comando para ver tudo de uma vez:

```bash
cd backend && npm run check-plan && echo "" && echo "Se o plano não existe, execute:" && echo "npm run setup-test-db && npm run seed:test"
```

