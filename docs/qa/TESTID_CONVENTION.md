# TestID Convention

**Versão:** 1.0  
**Data:** 2025-02-01  
**Status:** Padrão Obrigatório

---

## 📋 Objetivo

Este documento define a convenção mínima de `testID` para elementos críticos usados em testes E2E e integration tests. TestIDs devem ser estáveis e não mudar com refatorações de UI.

---

## 🎯 Princípios

1. **Mínimo necessário** - Apenas elementos críticos para testes recebem testID
2. **Estável** - TestIDs não devem mudar com refatorações de estilo/texto
3. **Descritivo** - Nomes claros que indicam função, não aparência
4. **Consistente** - Padrão uniforme em todo o projeto

---

## 📱 Mobile (React Native)

### Formato

```tsx
testID="[screen]-[element-type]-[purpose]"
```

### Exemplos

```tsx
// Buttons
<TouchableOpacity testID="login-submit-button">
  <Text>Entrar</Text>
</TouchableOpacity>

<TouchableOpacity testID="dashboard-add-event-button">
  <Text>Adicionar Evento</Text>
</TouchableOpacity>

// Inputs
<TextInput testID="login-email-input" />
<TextInput testID="login-password-input" />

// Screens/Navigators
<View testID="onboarding-navigator">
  {/* Onboarding screens */}
</View>

<View testID="main-navigator">
  {/* Main app screens */}
</View>

// Cards/Lists
<View testID="event-list-item">
  {/* Event card */}
</View>

// Messages/Feedback
<Text testID="error-message">Error text</Text>
<Text testID="success-message">Success text</Text>
```

### Padrão por Tipo

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Button | `[screen]-[action]-button` | `login-submit-button` |
| Input | `[screen]-[field]-input` | `login-email-input` |
| Navigator | `[type]-navigator` | `onboarding-navigator` |
| List Item | `[entity]-list-item` | `event-list-item` |
| Message | `[type]-message` | `error-message` |

---

## 🌐 Web (React)

### Formato

```tsx
data-testid="[screen]-[element-type]-[purpose]"
```

### Exemplos

```jsx
// Buttons
<button data-testid="login-submit-button">
  Entrar
</button>

<button data-testid="dashboard-add-event-button">
  Adicionar Evento
</button>

// Inputs
<input data-testid="login-email-input" />
<input data-testid="login-password-input" />

// Navigation
<nav data-testid="main-navigator">
  {/* Navigation */}
</nav>

// Lists/Cards
<div data-testid="event-list-item">
  {/* Event card */}
</div>

// Messages/Feedback
<div data-testid="error-message">Error text</div>
<div data-testid="success-message">Success text</div>
```

### Padrão por Tipo

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Button | `[screen]-[action]-button` | `login-submit-button` |
| Input | `[screen]-[field]-input` | `login-email-input` |
| Navigator | `[type]-navigator` | `main-navigator` |
| List Item | `[entity]-list-item` | `event-list-item` |
| Message | `[type]-message` | `error-message` |

---

## ✅ Elementos Críticos que DEVEM Ter TestID

### 1. Formulários

- Todos os inputs de formulários críticos (login, registro, onboarding)
- Botões de submit/action

**Exemplos:**
```tsx
// Mobile
<TextInput testID="login-email-input" />
<TextInput testID="login-password-input" />
<TouchableOpacity testID="login-submit-button">

// Web
<input data-testid="login-email-input" />
<input data-testid="login-password-input" />
<button data-testid="login-submit-button">
```

### 2. Navegação

- Navigators principais (onboarding vs main)
- Botões de navegação críticos

**Exemplos:**
```tsx
// Mobile
<View testID="onboarding-navigator">
<View testID="main-navigator">

// Web
<nav data-testid="main-navigator">
```

### 3. Feedback/Estados

- Mensagens de erro críticas
- Mensagens de sucesso críticas
- Loading states

**Exemplos:**
```tsx
// Mobile
<Text testID="error-message">
<ActivityIndicator testID="loading-spinner" />

// Web
<div data-testid="error-message">
<div data-testid="loading-spinner" />
```

### 4. Ações Críticas

- Botões de criação (add event, add contribution, etc.)
- Botões de confirmação (delete, submit)

**Exemplos:**
```tsx
// Mobile
<TouchableOpacity testID="dashboard-add-event-button">
<TouchableOpacity testID="event-delete-button">

// Web
<button data-testid="dashboard-add-event-button">
<button data-testid="event-delete-button">
```

---

## ❌ Elementos que NÃO Precisam de TestID

- Elementos puramente decorativos
- Textos estáticos (usar `getByText` é suficiente)
- Elementos que podem ser encontrados por role/label
- Elementos não usados em testes

---

## 📝 Checklist ao Adicionar TestID

- [ ] Elemento é crítico para testes?
- [ ] Segue o padrão de nomenclatura?
- [ ] Nome é descritivo (não baseado em estilo)?
- [ ] Não há conflito com testIDs existentes?
- [ ] TestID está no elemento correto (não em wrapper genérico)?

---

## 🔍 Como Encontrar TestIDs

### Mobile (React Native Testing Library)

```typescript
import { getByTestId, queryByTestId } from '@testing-library/react-native'

const submitButton = getByTestId('login-submit-button')
const errorMessage = queryByTestId('error-message')
```

### Web (React Testing Library)

```typescript
import { getByTestId, queryByTestId } from '@testing-library/react'

const submitButton = getByTestId('login-submit-button')
const errorMessage = queryByTestId('error-message')
```

---

## 📚 Referências

- [React Native Testing Library - testID](https://callstack.github.io/react-native-testing-library/docs/api#testid)
- [React Testing Library - data-testid](https://testing-library.com/docs/queries/bytestid/)

---

**Última atualização:** 2025-02-01  
**Mantido por:** Equipe de QA

