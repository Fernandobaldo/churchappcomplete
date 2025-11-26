# 🔧 Solução: Problema de Conexão via QR Code

## ❌ Problema
O Expo Go mostra: `Could not connect to the server exp://127.0.0.1:8081`

Isso acontece porque o Expo está usando `localhost` (127.0.0.1) em vez do IP da sua rede local.

## ✅ Soluções

### Solução 1: Usar o Script Automático (Recomendado)

Execute o script que detecta automaticamente seu IP:

```powershell
cd mobile
.\start-expo.ps1
```

Ou usando npm:

```powershell
cd mobile
npm run start:lan
```

### Solução 2: Usar o Script Manual com IP Específico

Se o script automático não funcionar, use o script manual:

```powershell
cd mobile
.\start-expo-manual.ps1 -IP "192.168.1.23"
```

### Solução 3: Configurar Variáveis de Ambiente Manualmente

No PowerShell, antes de iniciar o Expo:

```powershell
cd mobile

# Substitua 192.168.1.23 pelo seu IP
$env:EXPO_DEVTOOLS_LISTEN_ADDRESS = "0.0.0.0"
$env:REACT_NATIVE_PACKAGER_HOSTNAME = "192.168.1.23"
$env:EXPO_PACKAGER_PROXY_URL = "http://192.168.1.23:8081"

# Limpar cache e iniciar
npx expo start --lan --clear
```

### Solução 4: Usar Modo Tunnel (Funciona em Qualquer Rede)

Se nenhuma das soluções acima funcionar, use o modo tunnel:

```powershell
cd mobile
npx expo start --tunnel
```

**Nota:** O modo tunnel pode ser mais lento, mas funciona mesmo se você e o celular estiverem em redes diferentes.

## 🔍 Verificar se Está Funcionando

Após iniciar o Expo, verifique no terminal:

✅ **Correto:**
```
Metro waiting on exp://192.168.1.23:8081
```

❌ **Incorreto:**
```
Metro waiting on exp://127.0.0.1:8081
```

## 🛠️ Troubleshooting

### 1. Descobrir Seu IP

```powershell
ipconfig | findstr /i "IPv4"
```

Procure pelo IP da sua interface Wi-Fi ou Ethernet.

### 2. Verificar Firewall

Certifique-se de que o Windows Firewall permite conexões na porta `8081`:

1. Abra **Windows Defender Firewall**
2. Clique em **Configurações Avançadas**
3. Verifique se há regras bloqueando a porta 8081

### 3. Verificar se Está na Mesma Rede

- O celular e o computador devem estar na **mesma rede Wi-Fi**
- Não use dados móveis no celular
- Verifique se não há VPN ativa que possa interferir

### 4. Limpar Cache Completamente

```powershell
cd mobile

# Limpar cache do Expo
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue

# Limpar cache do npm
npm cache clean --force

# Reinstalar dependências
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
npm install

# Iniciar com cache limpo
npx expo start --clear
```

### 5. Verificar Porta 8081

Verifique se a porta 8081 não está sendo usada por outro processo:

```powershell
netstat -ano | findstr :8081
```

Se houver outro processo usando a porta, encerre-o ou use outra porta:

```powershell
$env:EXPO_DEVTOOLS_LISTEN_ADDRESS = "0.0.0.0"
$env:REACT_NATIVE_PACKAGER_HOSTNAME = "192.168.1.23"
npx expo start --lan --port 8082
```

## 📱 Testando no Celular

1. **Abra o Expo Go** no celular
2. **Escaneie o QR code** que aparece no terminal
3. Se não funcionar, tente **digitar manualmente** no Expo Go:
   - Toque em "Enter URL manually"
   - Digite: `exp://192.168.1.23:8081` (substitua pelo seu IP)

## 🔄 Se Nada Funcionar

1. **Reinicie o computador** (às vezes ajuda a limpar configurações de rede)
2. **Reinicie o roteador Wi-Fi**
3. **Use o modo tunnel** como última opção:
   ```powershell
   npx expo start --tunnel
   ```

## 📝 Notas Importantes

- O IP pode mudar se você se reconectar à rede Wi-Fi
- Se o IP mudar, atualize os scripts ou use variáveis de ambiente
- O modo tunnel é mais confiável, mas pode ser mais lento
- Certifique-se de que o backend está rodando na porta 3333


