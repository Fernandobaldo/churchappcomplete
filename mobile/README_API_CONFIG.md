# Configuração da API - Mobile App

Este documento explica como configurar a URL da API backend no aplicativo mobile.

## 📋 Formas de Configuração

A configuração da URL da API segue esta ordem de prioridade:

1. **Variável de ambiente `EXPO_PUBLIC_API_URL`** (mais alta prioridade)
2. **Configuração no `app.config.js`** (via `extra.apiUrl`)
3. **IP padrão de desenvolvimento** (fallback: `192.168.1.23:3333`)

## 🔧 Método 1: Variável de Ambiente (Recomendado)

### No Windows PowerShell:

```powershell
# Definir variável de ambiente temporariamente (apenas para esta sessão)
$env:EXPO_PUBLIC_API_URL="http://192.168.1.23:3333"

# Iniciar o Expo
cd mobile
npx expo start
```

### No Windows CMD:

```cmd
set EXPO_PUBLIC_API_URL=http://192.168.1.23:3333
cd mobile
npx expo start
```

### Permanente (Windows):

1. Abra as **Variáveis de Ambiente do Sistema**
2. Adicione uma nova variável:
   - Nome: `EXPO_PUBLIC_API_URL`
   - Valor: `http://192.168.1.23:3333` (ou seu IP)

## 🔧 Método 2: Configuração no app.config.js

Edite o arquivo `mobile/app.config.js` e altere o valor de `apiUrl`:

```javascript
extra: {
  apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://SEU_IP_AQUI:3333",
}
```

## 🔧 Método 3: Alterar IP Diretamente no Código

Edite o arquivo `mobile/src/api/api.ts` e altere o valor de `devIP`:

```typescript
const devIP = '192.168.1.23' // Altere para seu IP
```

## 🔍 Como Descobrir Seu IP

### No Windows PowerShell:

```powershell
ipconfig | findstr /i "IPv4"
```

Procure pelo IP da sua interface Wi-Fi ou Ethernet (geralmente começa com `192.168.` ou `172.20.`).

### Exemplos de IPs comuns:

- Wi-Fi doméstico: `192.168.1.x` ou `192.168.0.x`
- Hotspot: `172.20.10.x`
- Rede corporativa: `10.x.x.x`

## ⚠️ Importante

- **Certifique-se de que o backend está rodando** na porta `3333`
- **Verifique se o firewall permite conexões** na porta `3333`
- **O dispositivo móvel e o computador devem estar na mesma rede** (para IP local)
- **Após alterar a configuração, reinicie o Expo** (`npx expo start --clear`)

## 🚀 Para Produção

Para produção, configure a URL da API de produção:

```javascript
// app.config.js
extra: {
  apiUrl: process.env.EXPO_PUBLIC_API_URL || "https://api.seudominio.com",
}
```

Ou use variável de ambiente:

```powershell
$env:EXPO_PUBLIC_API_URL="https://api.seudominio.com"
```

## 📝 Notas

- O timeout padrão é de **10 segundos**
- Erros de rede são logados no console
- Erros 401 (não autorizado) fazem logout automático
- A URL é configurada automaticamente na inicialização do app

