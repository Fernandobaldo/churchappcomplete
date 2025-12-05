# 🔧 Configuração de Ambiente - Mobile e Web

Este documento descreve como configurar as variáveis de ambiente para os projetos Mobile e Web.

---

## 📱 Mobile (React Native/Expo)

### Variáveis de Ambiente

O Mobile suporta múltiplas fontes de configuração da API (em ordem de prioridade):

1. **Variável de ambiente `EXPO_PUBLIC_API_URL`** (mais alta prioridade)
2. **Configuração no `app.config.js`** (`extra.apiUrl`)
3. **Detecção automática de IP** (fallback para desenvolvimento)

### Configuração

#### Opção 1: Variável de Ambiente (Recomendado)

Crie um arquivo `.env` na raiz do projeto `mobile/`:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.23:3333
```

**Nota**: No Expo, variáveis de ambiente devem começar com `EXPO_PUBLIC_` para serem acessíveis no código.

#### Opção 2: app.config.js

Edite `mobile/app.config.js`:

```javascript
extra: {
  apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.23:3333",
}
```

#### Opção 3: Detecção Automática (Desenvolvimento)

Se nenhuma das opções acima for configurada, o app tentará detectar automaticamente o IP baseado na plataforma:
- **Android Emulator**: `10.0.2.2:3333`
- **iOS Simulator**: `192.168.1.7:3333` (atualize conforme necessário)
- **Outras plataformas**: `192.168.1.7:3333`

### Descobrir seu IP

**Windows:**
```powershell
ipconfig
```
Procure por "IPv4 Address" na interface WiFi ou Ethernet.

**macOS/Linux:**
```bash
ifconfig
```
Procure por "inet" na interface en0 (WiFi) ou en1 (Ethernet).

### Exemplos

```env
# Desenvolvimento local (emulador)
EXPO_PUBLIC_API_URL=http://10.0.2.2:3333

# Desenvolvimento na rede local
EXPO_PUBLIC_API_URL=http://192.168.1.23:3333

# Staging
EXPO_PUBLIC_API_URL=https://api-staging.seudominio.com

# Produção
EXPO_PUBLIC_API_URL=https://api.seudominio.com
```

---

## 🌐 Web (React/Vite)

### Variáveis de Ambiente

O Web usa apenas variável de ambiente `VITE_API_URL`.

### Configuração

Crie um arquivo `.env` na raiz do projeto `web/`:

```env
VITE_API_URL=http://localhost:3333
```

**Nota**: No Vite, variáveis de ambiente devem começar com `VITE_` para serem acessíveis no código.

### Exemplos

```env
# Desenvolvimento local
VITE_API_URL=http://localhost:3333

# Desenvolvimento na rede local
VITE_API_URL=http://192.168.1.23:3333

# Staging
VITE_API_URL=https://api-staging.seudominio.com

# Produção
VITE_API_URL=https://api.seudominio.com
```

### Arquivos de Ambiente

O Vite suporta diferentes arquivos de ambiente:

- `.env` - Carregado em todos os ambientes
- `.env.local` - Carregado em todos os ambientes, ignorado pelo git
- `.env.development` - Carregado apenas em desenvolvimento
- `.env.production` - Carregado apenas em produção

**Recomendação**: Use `.env.local` para variáveis locais (não commitar no git).

---

## 🔒 Segurança

### ⚠️ IMPORTANTE

1. **Nunca commite arquivos `.env` com credenciais reais**
2. Use `.env.example` como template
3. Adicione `.env` e `.env.local` ao `.gitignore`
4. Use variáveis de ambiente do sistema em produção

### .gitignore

Certifique-se de que seu `.gitignore` inclui:

```
# Environment variables
.env
.env.local
.env*.local
```

---

## 🚀 Uso em Produção

### Mobile (Expo)

Para produção, configure as variáveis de ambiente no seu serviço de CI/CD ou plataforma de deploy:

- **Expo EAS Build**: Configure no `eas.json` ou variáveis de ambiente do EAS
- **CI/CD**: Configure nas variáveis de ambiente do seu pipeline

### Web (Vite)

Para produção, configure as variáveis de ambiente:

- **Vercel/Netlify**: Configure no painel de variáveis de ambiente
- **Docker**: Use `-e` ou arquivo `.env`
- **CI/CD**: Configure nas variáveis de ambiente do pipeline

---

## 🧪 Testando a Configuração

### Mobile

Após configurar, reinicie o Expo:

```bash
cd mobile
npm start --clear
```

Verifique os logs no console - você deve ver:
```
📱 Usando API URL da variável de ambiente: http://...
```
ou
```
📱 API Base URL: http://... (Platform: android, Dev: true)
```

### Web

Após configurar, reinicie o Vite:

```bash
cd web
npm run dev
```

Verifique os logs no console do navegador (F12) - você deve ver:
```
🌐 Usando API URL da variável de ambiente: http://...
```

---

## 📝 Checklist de Configuração

- [ ] Criar arquivo `.env` no Mobile (se necessário)
- [ ] Criar arquivo `.env` no Web
- [ ] Configurar `EXPO_PUBLIC_API_URL` (Mobile)
- [ ] Configurar `VITE_API_URL` (Web)
- [ ] Adicionar `.env` ao `.gitignore`
- [ ] Testar conexão com a API
- [ ] Verificar logs de configuração

---

**Última Atualização**: 2024











