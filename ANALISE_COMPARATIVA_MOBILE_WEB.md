# Análise Comparativa: Mobile vs Web

## 📋 Resumo Executivo

Este documento compara as diferenças entre os projetos **Mobile** (React Native/Expo) e **Web** (React/Vite) do ChurchApp.

---

## 🏗️ Arquitetura e Stack Tecnológica

### Mobile
- **Framework**: React Native com Expo (~54.0.0)
- **React**: 19.1.0
- **Navegação**: React Navigation (Stack + Bottom Tabs)
- **Build Tool**: Metro Bundler (Expo)
- **TypeScript**: ~5.9.2
- **Gerenciamento de Estado**: Zustand (v5.0.4)
- **Storage**: AsyncStorage (@react-native-async-storage/async-storage)

### Web
- **Framework**: React 18.2.0
- **Build Tool**: Vite 5.0.8
- **Navegação**: React Router DOM v6.20.0
- **TypeScript**: 5.2.2
- **Gerenciamento de Estado**: Zustand (v4.4.7)
- **Storage**: localStorage (via Zustand persist)
- **Styling**: Tailwind CSS 3.3.6
- **Testes**: Vitest + Testing Library (unit, integration, e2e)

---

## 📦 Dependências Principais

### Mobile - Dependências Específicas
```json
{
  "@expo/vector-icons": "^15.0.3",
  "@react-native-async-storage/async-storage": "2.2.0",
  "@react-native-community/datetimepicker": "8.4.4",
  "@react-navigation/bottom-tabs": "^7.3.10",
  "@react-navigation/native": "^7.1.6",
  "expo": "~54.0.0",
  "expo-constants": "~18.0.10",
  "expo-image-picker": "~17.0.8",
  "react-native": "0.81.5",
  "react-native-chart-kit": "^6.12.0",
  "react-native-toast-message": "^2.3.0"
}
```

### Web - Dependências Específicas
```json
{
  "react-router-dom": "^6.20.0",
  "react-hook-form": "^7.48.2",
  "react-hot-toast": "^2.4.1",
  "lucide-react": "^0.294.0",
  "tailwindcss": "^3.3.6",
  "msw": "^2.12.2" // Mock Service Worker para testes
}
```

### Dependências Compartilhadas
- `axios`: ^1.8.4 (mobile) vs ^1.6.2 (web)
- `date-fns`: ^4.1.0 (mobile) vs ^2.30.0 (web)
- `jwt-decode`: ^4.0.0 (ambos)
- `zustand`: ^5.0.4 (mobile) vs ^4.4.7 (web)

---

## 🔧 Configuração da API

### Mobile (`mobile/src/api/api.ts`)
- **Configuração Complexa**: Múltiplas fontes de configuração
  - Prioridade 1: `process.env.EXPO_PUBLIC_API_URL`
  - Prioridade 2: `Constants.expoConfig?.extra?.apiUrl` (app.config.js)
  - Prioridade 3: Detecção automática de IP por plataforma (Android/iOS)
- **Timeout**: 30 segundos
- **Transform Response**: Customizado para React Native
- **Logs Detalhados**: Logs de requisições e erros em desenvolvimento
- **Tratamento de Erros**: Mais robusto (Network Error, Timeout, 401)

### Web (`web/src/api/api.ts`)
- **Configuração Simples**: `import.meta.env.VITE_API_URL || 'http://localhost:3333'`
- **Timeout**: Padrão do axios
- **Tratamento de Erros**: Básico (apenas 401 com redirect)
- **Sem Transform Response**: Usa comportamento padrão do axios

**Diferença Principal**: Mobile tem lógica complexa de detecção de IP para desenvolvimento, enquanto Web usa variável de ambiente simples.

---

## 🗄️ AuthStore (Zustand)

### Mobile (`mobile/src/stores/authStore.ts`)
- **Storage**: AsyncStorage (React Native)
- **Tratamento de Erros**: Try-catch no `setUserFromToken`
- **Validação**: Garante que `permissions` seja sempre array
- **Fallback**: Em caso de erro ao decodificar token, ainda salva o token

### Web (`web/src/stores/authStore.ts`)
- **Storage**: localStorage (browser)
- **Tratamento de Erros**: Sem try-catch (mais simples)
- **Validação**: Mapeia permissions diretamente
- **Log de Aviso**: Console.warn se `branchId` não estiver presente

**Diferença Principal**: Mobile tem mais tratamento de erros e validações, provavelmente devido às peculiaridades do React Native.

---

## 📱 Estrutura de Navegação

### Mobile
- **Tipo**: Stack Navigator + Bottom Tab Navigator
- **Arquivos**:
  - `AppNavigator.tsx` - Navegação principal
  - `TabNavigator.tsx` - Navegação por abas
- **Rotas**: Baseadas em nomes de telas (ex: `'Events'`, `'Devotionals'`)

### Web
- **Tipo**: React Router (BrowserRouter)
- **Arquivo**: `App.tsx` - Todas as rotas definidas
- **Rotas**: Baseadas em paths (ex: `/app/events`, `/app/devotionals`)
- **Proteção**: Componente `ProtectedRoute` e `PublicRoute`
- **Onboarding**: Rotas dedicadas (`/onboarding/*`)

---

## 📄 Telas/Páginas Disponíveis

### Mobile - Telas (`mobile/src/screens/`)
1. **Autenticação**:
   - `LoginScreen.tsx`
   - `ProfileScreen.tsx`
   - `EditProfileScreen.tsx`

2. **Dashboard e Navegação**:
   - `DashboardScreen.tsx`
   - `MoreScreen.tsx` (menu adicional)

3. **Eventos**:
   - `EventsScreen.tsx`
   - `AddEventScreen.tsx`
   - `EditEventScreen.tsx`
   - `EventDetailsScreen.tsx`

4. **Contribuições**:
   - `ContributionsScreen.tsx`
   - `AddContributionsScreen.tsx`
   - `ContributionDetailScreen.tsx`

5. **Devocionais**:
   - `DevotionalsScreen.tsx`
   - `AddDevotionalScreen.tsx`
   - `DevotionalDetailScreen.tsx`

6. **Membros**:
   - `MembersListScreen.tsx`
   - `MemberRegistrationScreen.tsx`
   - `EditMemberPermissionsScreen.tsx`
   - `ManagePermissionsScreen.tsx`
   - `PermissionsScreen.tsx`
   - `InviteLinkScreen.tsx`

7. **Finanças**:
   - `FinancesScreen.tsx`
   - `AddTransactionScreen.tsx`

8. **Notícias**:
   - `NoticesScreen.tsx`
   - `AddNoticeScreen.tsx`

### Web - Páginas (`web/src/pages/`)
1. **Autenticação**:
   - `Login.tsx`
   - `Register.tsx`
   - `Profile/index.tsx`

2. **Dashboard**:
   - `Dashboard.tsx`

3. **Eventos**:
   - `Events/index.tsx`
   - `Events/AddEvent.tsx`
   - `Events/EditEvent.tsx`
   - `Events/EventDetails.tsx`

4. **Contribuições**:
   - `Contributions/index.tsx`
   - `Contributions/AddContribution.tsx`
   - `Contributions/ContributionDetails.tsx`

5. **Devocionais**:
   - `Devotionals/index.tsx`
   - `Devotionals/AddDevotional.tsx`
   - `Devotionals/DevotionalDetails.tsx`

6. **Membros**:
   - `Members/index.tsx`
   - `Members/AddMember.tsx`
   - `Members/MemberDetails.tsx`

7. **Permissões**:
   - `Permissions/index.tsx`

8. **Onboarding** (exclusivo do Web):
   - `onboarding/BemVindo.tsx`
   - `onboarding/Start.tsx`
   - `onboarding/Church.tsx`
   - `onboarding/Branches.tsx`
   - `onboarding/Settings.tsx`
   - `onboarding/Igreja.tsx` (legado)
   - `onboarding/Filial.tsx` (legado)
   - `onboarding/Convites.tsx` (legado)
   - `onboarding/Concluido.tsx`

**Diferenças Principais**:
- ✅ **Web tem fluxo de Onboarding completo** (Mobile não tem)
- ✅ **Web tem página de Registro** (Mobile não tem)
- ✅ **Mobile tem tela de Finanças** (Web não tem página dedicada)
- ✅ **Mobile tem tela de Notícias** (Web não tem página dedicada)
- ✅ **Mobile tem `MoreScreen`** (menu adicional)

---

## 🧩 Componentes

### Mobile (`mobile/src/components/`)
- `BibleText.tsx`
- `DevotionalCard.tsx`
- `FormsComponent.tsx`
- `Header.tsx`
- `PageHeader.tsx`
- `Protected.tsx`

### Web (`web/src/components/`)
- `Header.tsx`
- `Layout.tsx` (com Sidebar)
- `OnboardingHeader.tsx`
- `ProtectedRoute.tsx`
- `Sidebar.tsx`

**Diferenças**:
- Web tem `Layout` e `Sidebar` (estrutura de layout web)
- Web tem `OnboardingHeader` (para fluxo de onboarding)
- Mobile tem componentes específicos como `BibleText` e `DevotionalCard`

---

## 🧪 Testes

### Mobile
- ❌ **Sem testes implementados**

### Web
- ✅ **Suite completa de testes**:
  - **Unit Tests**: `src/__tests__/unit/`
    - API endpoints
    - Components
    - Pages
    - Stores
  - **Integration Tests**: `src/__tests__/integration/`
    - Auth flow
    - CRUD operations
    - Navigation
    - Onboarding flow
  - **E2E Tests**: `src/__tests__/e2e/`
    - Complete flow
    - Onboarding redirect
  - **Mocking**: MSW (Mock Service Worker)
  - **Coverage**: Vitest coverage

---

## 🎨 Estilização

### Mobile
- **StyleSheet** (React Native StyleSheet)
- Estilos inline e StyleSheet.create
- Sem framework CSS

### Web
- **Tailwind CSS** 3.3.6
- Classes utilitárias
- Design system consistente

---

## 📝 Configurações de Build

### Mobile
- **app.config.js**: Configuração do Expo
- **babel.config.js**: Configuração do Babel
- **metro.config.js**: Configuração do Metro Bundler
- **tsconfig.json**: Extends `expo/tsconfig.base`

### Web
- **vite.config.ts**: Configuração do Vite
- **tailwind.config.js**: Configuração do Tailwind
- **postcss.config.js**: Configuração do PostCSS
- **tsconfig.json**: Configuração completa do TypeScript
- **vitest.config.ts**: Configuração de testes

---

## 📚 Documentação

### Mobile
- `COMO_USAR_START_EXPO_FIX.md`
- `SOLUCAO_QR_CODE.md`
- `README_API_CONFIG.md`
- Scripts PowerShell para iniciar Expo

### Web
- `README.md`
- `README_TESTES.md`
- `COMO_RODAR_TESTES_E2E.md`
- `PLANO_TESTES_COMPLETO.md`
- `TESTE_RAPIDO.md`
- `INSTRUCOES_TESTE.md`
- Scripts de teste (`.bat` e `.sh`)

---

## 🔄 Funcionalidades Exclusivas

### Mobile Exclusivo
- ✅ Detecção automática de IP para desenvolvimento
- ✅ Suporte a múltiplas plataformas (iOS, Android)
- ✅ Integração com câmera (expo-image-picker)
- ✅ Tela de Finanças (`FinancesScreen`)
- ✅ Tela de Notícias (`NoticesScreen`)
- ✅ `MoreScreen` (menu adicional)
- ✅ Scripts PowerShell para desenvolvimento

### Web Exclusivo
- ✅ Fluxo completo de Onboarding
- ✅ Página de Registro
- ✅ Suite completa de testes
- ✅ Layout com Sidebar
- ✅ Mock Service Worker para testes
- ✅ Documentação extensa de testes

---

## 🚀 Scripts NPM

### Mobile
```json
{
  "start": "expo start",
  "start:lan": "powershell -ExecutionPolicy Bypass -File ./start-expo.ps1",
  "start:fix": "powershell -ExecutionPolicy Bypass -File ./start-expo-fix.ps1",
  "start:tunnel": "expo start --tunnel",
  "android": "expo start --android",
  "ios": "expo start --ios",
  "web": "expo start --web"
}
```

### Web
```json
{
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest --coverage",
  "test:unit": "vitest run src/__tests__/unit",
  "test:integration": "vitest run src/__tests__/integration",
  "test:e2e": "vitest run src/__tests__/e2e"
}
```

---

## 📊 Resumo das Diferenças Principais

| Aspecto | Mobile | Web |
|---------|--------|-----|
| **Framework** | React Native + Expo | React + Vite |
| **Navegação** | React Navigation | React Router |
| **Styling** | StyleSheet | Tailwind CSS |
| **Storage** | AsyncStorage | localStorage |
| **Testes** | ❌ Nenhum | ✅ Completo (Unit, Integration, E2E) |
| **Onboarding** | ❌ Não tem | ✅ Completo |
| **Registro** | ❌ Não tem | ✅ Tem |
| **Finanças** | ✅ Tem tela | ❌ Não tem |
| **Notícias** | ✅ Tem tela | ❌ Não tem |
| **API Config** | Complexa (múltiplas fontes) | Simples (env var) |
| **Documentação** | Básica | Extensa |
| **React Version** | 19.1.0 | 18.2.0 |
| **Zustand Version** | 5.0.4 | 4.4.7 |

---

## 🎯 Recomendações

1. **Sincronizar Funcionalidades**:
   - Adicionar Onboarding no Mobile
   - Adicionar tela de Finanças no Web
   - Adicionar tela de Notícias no Web

2. **Padronizar API**:
   - Unificar configuração da API (ambos deveriam usar variáveis de ambiente)
   - Padronizar tratamento de erros

3. **Adicionar Testes no Mobile**:
   - Implementar testes básicos no Mobile usando Jest ou similar

4. **Sincronizar Versões**:
   - Alinhar versões do React (19 vs 18)
   - Alinhar versões do Zustand (5 vs 4)

5. **Documentação**:
   - Criar documentação unificada
   - Adicionar guias de desenvolvimento para ambos

---

**Data da Análise**: 2024
**Versões Analisadas**: 
- Mobile: Expo ~54.0.0, React 19.1.0
- Web: Vite 5.0.8, React 18.2.0











