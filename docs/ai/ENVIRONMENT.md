# Environment Variables — Guia Completo

## Variáveis de Ambiente

### EXPO_PUBLIC_API_URL

**Descrição:** URL base da API backend.

**Prioridade de Leitura:**
1. Variável de ambiente `EXPO_PUBLIC_API_URL` (mais alta prioridade)
2. `app.config.js` → `extra.apiUrl`
3. Fallback localhost (desenvolvimento)

**Uso:**
```bash
# .env ou variável de ambiente
EXPO_PUBLIC_API_URL=https://api.example.com
```

**Configuração em app.config.js:**
```javascript
module.exports = {
  expo: {
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || "https://api.example.com",
    }
  }
}
```

**Fallback Localhost:**
- Android Emulator: `http://10.0.2.2:3333`
- iOS Simulator: `http://localhost:3333`
- Dispositivo físico: Use IP da máquina (ex: `http://192.168.1.7:3333`)

**Onde é usado:**
- `mobile/src/api/api.ts` (configuração do axios)

### EXPO_PUBLIC_BIBLE_API_TOKEN

**Descrição:** Token de autenticação para A Biblia Digital API.

**Prioridade de Leitura:**
1. Variável de ambiente `EXPO_PUBLIC_BIBLE_API_TOKEN` (mais alta prioridade)
2. `app.config.js` → `extra.bibleApiToken`

**Uso:**
```bash
# .env ou variável de ambiente
EXPO_PUBLIC_BIBLE_API_TOKEN=seu_token_aqui
```

**Configuração em app.config.js:**
```javascript
module.exports = {
  expo: {
    extra: {
      bibleApiToken: process.env.EXPO_PUBLIC_BIBLE_API_TOKEN,
    }
  }
}
```

**Onde é usado:**
- `mobile/src/services/bible.service.ts` (via `getBibleApiToken()`)

**Obtendo o Token:**
1. Acesse https://www.abibliadigital.com.br/
2. Crie uma conta
3. Gere um token de API
4. Configure no ambiente

## Configuração de Ambiente

### Desenvolvimento Local

**1. Criar arquivo `.env` (opcional):**

```bash
# mobile/.env
EXPO_PUBLIC_API_URL=http://localhost:3333
EXPO_PUBLIC_BIBLE_API_TOKEN=seu_token_aqui
```

**2. Ou configurar em `app.config.js`:**

```javascript
module.exports = {
  expo: {
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3333",
      bibleApiToken: process.env.EXPO_PUBLIC_BIBLE_API_TOKEN,
    }
  }
}
```

**3. Para dispositivo físico:**

Use o IP da sua máquina:
```bash
EXPO_PUBLIC_API_URL=http://192.168.1.7:3333
```

### Staging/Produção

**1. Variáveis de ambiente do sistema:**

```bash
EXPO_PUBLIC_API_URL=https://api-staging.example.com
EXPO_PUBLIC_BIBLE_API_TOKEN=token_producao
```

**2. Ou configurar em `app.config.js`:**

```javascript
module.exports = {
  expo: {
    extra: {
      apiUrl: "https://api-staging.example.com",
      bibleApiToken: "token_producao",
    }
  }
}
```

## Lendo Variáveis de Ambiente

### No Código

**1. Variáveis de ambiente:**

```typescript
const apiUrl = process.env.EXPO_PUBLIC_API_URL
```

**2. Config do app.config.js:**

```typescript
import Constants from 'expo-constants'

const apiUrl = Constants.expoConfig?.extra?.apiUrl
```

**3. Padrão usado no projeto:**

```typescript
// Prioridade: env > config > fallback
const getValue = () => {
  // 1. Variável de ambiente
  if (process.env.EXPO_PUBLIC_MY_VAR) {
    return process.env.EXPO_PUBLIC_MY_VAR
  }
  
  // 2. Config do app.config.js
  const configValue = Constants.expoConfig?.extra?.myVar
  if (configValue) {
    return configValue
  }
  
  // 3. Fallback
  return 'default-value'
}
```

## Checklist de Configuração

### ✅ Antes de Iniciar Desenvolvimento

- [ ] Configurar `EXPO_PUBLIC_API_URL` (ou usar fallback localhost)
- [ ] Configurar `EXPO_PUBLIC_BIBLE_API_TOKEN` (se usar BibleText)
- [ ] Verificar se backend está rodando
- [ ] Testar conexão com API

### ✅ Antes de Deploy

- [ ] Configurar variáveis de ambiente de produção
- [ ] Verificar se tokens estão seguros (não commitados)
- [ ] Testar em ambiente de staging
- [ ] Documentar variáveis necessárias

## Segurança

### ⚠️ NUNCA

- Não commite tokens em `.env` ou `app.config.js`
- Não exponha tokens em logs
- Não use tokens de produção em desenvolvimento

### ✅ BOAS PRÁTICAS

- Use variáveis de ambiente do sistema para produção
- Mantenha `.env` no `.gitignore`
- Use diferentes tokens para dev/staging/prod
- Revise tokens regularmente

## Troubleshooting

### API não conecta

**Problema:** `Network Error` ou `Connection refused`

**Soluções:**
1. Verificar se backend está rodando
2. Verificar URL da API (localhost vs IP)
3. Para dispositivo físico, usar IP da máquina
4. Verificar firewall/antivírus

### Token da Bíblia não funciona

**Problema:** `Bible API token not configured`

**Soluções:**
1. Verificar se `EXPO_PUBLIC_BIBLE_API_TOKEN` está definido
2. Verificar se token está válido
3. Verificar se token está no formato correto
4. Reiniciar app após configurar variável

### Variável não é lida

**Problema:** Variável de ambiente não é reconhecida

**Soluções:**
1. Variáveis devem começar com `EXPO_PUBLIC_`
2. Reiniciar servidor Expo após mudanças
3. Limpar cache: `expo start -c`
4. Verificar se está usando `process.env.EXPO_PUBLIC_*`

---

**Última atualização:** 2024-12-19

