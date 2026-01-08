# Guia de Desenvolvimento - Mobile

Este guia fornece informações sobre como desenvolver e contribuir para o aplicativo mobile.

## Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app no dispositivo móvel (para desenvolvimento)

## Configuração Inicial

### 1. Instalar Dependências

```bash
cd mobile
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto mobile:

```env
EXPO_PUBLIC_API_URL=http://localhost:3333
```

Para dispositivo físico, use o IP da sua máquina:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.7:3333
```

### 3. Configurar app.config.js

Alternativamente, configure a URL da API no `app.config.js`:

```javascript
extra: {
  apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3333',
}
```

## Executando o Projeto

### Desenvolvimento

```bash
npm start
```

Ou use os scripts específicos:

```bash
# Iniciar com configuração fixa
npm run start:fix

# Iniciar com LAN
npm run start:lan
```

### Plataformas Específicas

```bash
# Android
npm run android

# iOS
npm run ios

# Web
npm run web
```

## Estrutura do Projeto

```
mobile/
├── src/
│   ├── api/              # Configuração e endpoints da API
│   ├── components/        # Componentes reutilizáveis
│   ├── navigation/       # Configuração de navegação
│   ├── screens/          # Telas do aplicativo
│   ├── stores/           # Gerenciamento de estado (Zustand)
│   ├── utils/            # Funções utilitárias
│   └── __tests__/        # Testes
├── assets/               # Imagens e recursos
├── app.config.js         # Configuração do Expo
└── package.json
```

## Componentes Principais

### PermissionGuard
Componente que renderiza children condicionalmente baseado em permissão.

```tsx
import PermissionGuard from '../components/PermissionGuard'

<PermissionGuard permission="events_manage">
  <Button title="Criar Evento" />
</PermissionGuard>
```

### withPermissionProtection
HOC para proteger screens baseado em permissões.

```tsx
import { withPermissionProtection } from '../components/withPermissionProtection'

export default withPermissionProtection(MyScreen, {
  permission: 'events_manage'
})
```

## Navegação

O aplicativo usa React Navigation com:
- **Stack Navigator**: Para navegação principal
- **Tab Navigator**: Para navegação por abas

## Gerenciamento de Estado

Usamos **Zustand** para gerenciamento de estado:

```typescript
import { useAuthStore } from '../stores/authStore'

const { user, token } = useAuthStore()
```

## API

A configuração da API está em `src/api/api.ts`. Ela suporta:
- Autenticação automática via token
- Tratamento de erros
- Timeout de 30 segundos
- Transformação de respostas

## Testes

Veja [README_TESTES.md](./README_TESTES.md) para informações sobre testes.

## Debugging

### React Native Debugger
Instale o React Native Debugger para debug avançado.

### Logs
Use `console.log()` normalmente. Os logs aparecem no terminal onde o Expo está rodando.

### Erros de Rede
Se tiver problemas de conexão:
1. Verifique se o backend está rodando
2. Verifique a URL da API nas variáveis de ambiente
3. Para dispositivo físico, use o IP da sua máquina, não localhost

## Build e Deploy

### Build para Produção

```bash
# Android
eas build --platform android

# iOS
eas build --platform ios
```

### Publicar

```bash
eas update
```

## Contribuindo

1. Crie uma branch a partir de `main`
2. Faça suas alterações
3. Adicione testes se necessário
4. Certifique-se de que os testes passam
5. Abra um Pull Request

## Recursos Úteis

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Zustand](https://github.com/pmndrs/zustand)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)


