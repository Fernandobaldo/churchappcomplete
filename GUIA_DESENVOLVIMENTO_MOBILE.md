# 📱 Guia de Desenvolvimento - Mobile

Guia completo para desenvolvimento do aplicativo Mobile do ChurchPulse.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Setup Inicial](#setup-inicial)
3. [Estrutura do Projeto](#estrutura-do-projeto)
4. [Configuração](#configuração)
5. [Desenvolvimento](#desenvolvimento)
6. [Navegação](#navegação)
7. [Estado Global](#estado-global)
8. [API](#api)
9. [Testes](#testes)
10. [Build e Deploy](#build-e-deploy)

---

## 🎯 Visão Geral

O aplicativo Mobile é construído com:
- **React Native 0.81.5**
- **Expo ~54.0.0**
- **TypeScript**
- **React Navigation** (Stack + Bottom Tabs)
- **Zustand** para estado global
- **Axios** para requisições HTTP

---

## 🚀 Setup Inicial

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Expo CLI (opcional, mas recomendado)
- Android Studio (para Android) ou Xcode (para iOS)

### Instalação

```bash
cd mobile
npm install
```

### Configuração da API

1. Edite `app.config.js` ou crie `.env`:
```javascript
extra: {
  apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.23:3333",
}
```

2. Para desenvolvimento, descubra seu IP:
```powershell
# Windows
ipconfig

# macOS/Linux
ifconfig
```

**📖 Mais detalhes**: [README_API_CONFIG.md](./README_API_CONFIG.md)

---

## 📁 Estrutura do Projeto

```
mobile/
├── src/
│   ├── api/              # Configuração do Axios
│   │   └── api.ts
│   ├── components/        # Componentes reutilizáveis
│   │   ├── Header.tsx
│   │   ├── Protected.tsx
│   │   └── ...
│   ├── navigation/        # Configuração de navegação
│   │   ├── AppNavigator.tsx
│   │   └── TabNavigator.tsx
│   ├── screens/           # Telas da aplicação
│   │   ├── LoginScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── onboarding/    # Telas de onboarding
│   │   └── ...
│   ├── stores/            # Stores Zustand
│   │   └── authStore.ts
│   ├── utils/             # Utilitários
│   │   ├── authUtils.ts
│   │   └── translateBooks.js
│   ├── __tests__/         # Testes
│   │   └── unit/
│   └── test/              # Setup de testes
│       ├── setup.ts
│       └── mocks/
├── assets/                # Imagens e recursos
├── App.tsx                # Componente raiz
├── app.config.js          # Configuração do Expo
├── package.json
└── tsconfig.json
```

---

## ⚙️ Configuração

### Variáveis de Ambiente

O Mobile suporta múltiplas fontes de configuração (em ordem de prioridade):

1. `EXPO_PUBLIC_API_URL` (variável de ambiente)
2. `app.config.js` → `extra.apiUrl`
3. Detecção automática de IP (fallback)

### app.config.js

```javascript
module.exports = {
  expo: {
    name: "mobile",
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.23:3333",
    }
  }
}
```

---

## 💻 Desenvolvimento

### Iniciar o Expo

```bash
# Modo padrão
npm start

# Rede local (recomendado para dispositivo físico)
npm run start:lan

# Com correções
npm run start:fix

# Tunnel (para testar remotamente)
npm run start:tunnel
```

### Scripts Disponíveis

```bash
npm start              # Inicia o Expo
npm run android        # Abre no Android
npm run ios            # Abre no iOS
npm run web            # Abre no navegador
npm test               # Executa testes
npm run test:watch    # Testes em modo watch
npm run test:coverage  # Testes com cobertura
```

### Desenvolvimento com Dispositivo Físico

1. Instale o **Expo Go** no seu dispositivo
2. Certifique-se de que o dispositivo está na mesma rede
3. Use `npm run start:lan` ou configure o IP manualmente
4. Escaneie o QR code com o Expo Go

**📖 Mais detalhes**: [COMO_USAR_START_EXPO_FIX.md](./COMO_USAR_START_EXPO_FIX.md)

---

## 🧭 Navegação

### Estrutura de Navegação

O app usa **React Navigation** com duas camadas:

1. **Stack Navigator** (`AppNavigator.tsx`)
   - Telas principais (Login, Dashboard, etc.)
   - Navegação por push/pop

2. **Tab Navigator** (`TabNavigator.tsx`)
   - Navegação por abas na parte inferior

### Adicionar Nova Tela

1. Crie o arquivo em `src/screens/`:
```typescript
// src/screens/MinhaTela.tsx
import React from 'react'
import { View, Text } from 'react-native'

export default function MinhaTela() {
  return (
    <View>
      <Text>Minha Tela</Text>
    </View>
  )
}
```

2. Adicione a rota em `AppNavigator.tsx`:
```typescript
import MinhaTela from '../screens/MinhaTela'

// Dentro do Stack.Navigator
<Stack.Screen name="MinhaTela" component={MinhaTela} />
```

3. Navegue para a tela:
```typescript
navigation.navigate('MinhaTela' as never)
```

---

## 🗄️ Estado Global

### Zustand Store

O app usa **Zustand** para estado global. Exemplo:

```typescript
// src/stores/authStore.ts
import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  setUserFromToken: (token) => {
    // Lógica aqui
    set({ token, user: decodedUser })
  },
  logout: () => set({ user: null, token: null }),
}))
```

### Usar o Store

```typescript
import { useAuthStore } from '../stores/authStore'

function MinhaTela() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  
  // Ou usar getState() para acesso direto
  const token = useAuthStore.getState().token
}
```

---

## 🌐 API

### Configuração

A API está configurada em `src/api/api.ts` com:
- Timeout de 30 segundos
- Interceptors para token
- Tratamento de erros
- Logs em desenvolvimento

### Fazer Requisições

```typescript
import api from '../api/api'

// GET
const response = await api.get('/events')
const events = response.data

// POST
const newEvent = await api.post('/events', {
  title: 'Culto de Domingo',
  date: '2024-01-01',
})

// PUT
await api.put(`/events/${id}`, updatedData)

// DELETE
await api.delete(`/events/${id}`)
```

### Tratamento de Erros

```typescript
try {
  await api.post('/events', data)
} catch (error: any) {
  if (error.response?.status === 401) {
    // Token inválido - será tratado pelo interceptor
  } else {
    Toast.show({
      type: 'error',
      text1: 'Erro',
      text2: error.response?.data?.message || 'Erro desconhecido',
    })
  }
}
```

---

## 🧪 Testes

### Estrutura

```
src/
├── __tests__/
│   └── unit/
│       ├── api/
│       │   └── api.test.ts
│       └── stores/
│           └── authStore.test.ts
└── test/
    ├── setup.ts
    └── mocks/
        └── mockData.ts
```

### Executar Testes

```bash
npm test              # Todos os testes
npm run test:watch    # Modo watch
npm run test:coverage # Com cobertura
```

### Escrever Testes

```typescript
import { describe, it, expect } from '@jest/globals'
import { useAuthStore } from '../../../stores/authStore'

describe('AuthStore', () => {
  it('deve definir token corretamente', () => {
    useAuthStore.getState().setToken('test-token')
    expect(useAuthStore.getState().token).toBe('test-token')
  })
})
```

**📖 Mais detalhes**: [README_TESTES.md](./README_TESTES.md)

---

## 📦 Build e Deploy

### Build para Produção

```bash
# Build Android
eas build --platform android

# Build iOS
eas build --platform ios
```

### Configuração EAS

1. Instale EAS CLI:
```bash
npm install -g eas-cli
```

2. Configure o projeto:
```bash
eas build:configure
```

3. Faça o build:
```bash
eas build --platform android
```

---

## 🎨 Estilização

### StyleSheet

Use `StyleSheet.create` para estilos:

```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
})
```

### Componentes de UI

O app usa componentes nativos do React Native:
- `View`, `Text`, `TextInput`
- `TouchableOpacity`, `ScrollView`
- `FlatList` para listas
- `Image` para imagens

---

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. Erro de conexão com API
- Verifique se o backend está rodando
- Confirme o IP no `app.config.js`
- Certifique-se de que o dispositivo está na mesma rede

#### 2. Erro de Metro Bundler
```bash
npm run start:clear
```

#### 3. Problemas com dependências
```bash
rm -rf node_modules
npm install
```

**📖 Mais soluções**: [SOLUCAO_QR_CODE.md](./SOLUCAO_QR_CODE.md)

---

## 📚 Recursos

- [Documentação Expo](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native](https://reactnative.dev/)
- [Zustand](https://zustand-demo.pmnd.rs/)

---

**Última Atualização**: 2024








