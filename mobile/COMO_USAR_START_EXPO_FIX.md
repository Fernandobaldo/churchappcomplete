# 🚀 Como Usar o Script start-expo-fix.ps1

Este script resolve o problema de conexão do Expo Go forçando o Metro Bundler a usar o IP da rede local.

## 📋 Como Usar

### Opção 1: Executar o Script Diretamente

```powershell
cd mobile
.\start-expo-fix.ps1
```

### Opção 2: Usar via npm

```powershell
cd mobile
npm run start:fix
```

## ✅ O que o Script Faz

1. **Encerra processos Node.js** que possam estar usando a porta 8081
2. **Libera a porta 8081** se estiver em uso
3. **Detecta automaticamente seu IP** da rede local
4. **Limpa o cache do Expo** para evitar problemas
5. **Configura variáveis de ambiente** críticas:
   - `REACT_NATIVE_PACKAGER_HOSTNAME` - Força o Metro a usar seu IP
   - `EXPO_DEVTOOLS_LISTEN_ADDRESS` - Permite conexões de qualquer IP
   - `EXPO_PACKAGER_PROXY_URL` - Configura a URL do proxy
6. **Inicia o Expo** com as configurações corretas

## 🔍 Verificar se Funcionou

Após iniciar, verifique no terminal:

✅ **Correto:**
```
Metro waiting on exp://192.168.1.23:8081
```

❌ **Incorreto (ainda precisa corrigir):**
```
Metro waiting on exp://127.0.0.1:8081
```

Você também pode verificar com:

```powershell
netstat -ano | findstr :8081
```

Deve aparecer conexões com `0.0.0.0:8081` ou `[::]:8081`, não apenas `[::1]:8081`.

## 🛠️ Se o IP Estiver Errado

Se o script detectar o IP errado, edite o arquivo `start-expo-fix.ps1` e altere a linha:

```powershell
$ip = "192.168.1.23"  # Altere para seu IP
```

Ou descubra seu IP com:

```powershell
ipconfig | findstr /i "IPv4"
```

## ⚠️ Problemas Comuns

### Script não executa (política de execução)

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Ainda mostra 127.0.0.1

1. Pare o Expo (Ctrl+C)
2. Execute o script novamente
3. Se ainda não funcionar, tente o modo tunnel:
   ```powershell
   npx expo start --tunnel
   ```

### Firewall bloqueando

Adicione uma exceção no Windows Firewall para:
- Node.js
- Porta 8081 (TCP)

## 📱 Testando no Celular

1. Abra o **Expo Go** no celular
2. Escaneie o **QR code** que aparece no terminal
3. Se não funcionar, tente **digitar manualmente**:
   - Toque em "Enter URL manually"
   - Digite: `exp://192.168.1.23:8081` (substitua pelo seu IP)

## 🔄 Alternativa: Modo Tunnel

Se nada funcionar, use o modo tunnel (funciona mesmo em redes diferentes):

```powershell
cd mobile
npx expo start --tunnel
```

O modo tunnel é mais lento, mas é mais confiável quando há problemas de rede/firewall.












