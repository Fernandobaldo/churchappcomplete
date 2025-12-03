# 🧪 Guia de Testes - ChurchPulse Mobile

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Estrutura de Testes](#estrutura-de-testes)
3. [Executando Testes](#executando-testes)
4. [Cobertura de Testes](#cobertura-de-testes)
5. [Escrevendo Novos Testes](#escrevendo-novos-testes)

---

## 🎯 Visão Geral

O projeto Mobile utiliza **Jest** como framework de testes e **React Native Testing Library** para testes de componentes React Native. Os testes estão organizados em:

- **Testes Unitários**: Testam stores, API e utilitários isoladamente
- **Testes de Integração**: Testam fluxos completos e interações entre componentes

---

## 📁 Estrutura de Testes

```
mobile/
├── src/
│   ├── __tests__/
│   │   └── unit/
│   │       ├── api/
│   │       │   └── api.test.ts
│   │       └── stores/
│   │           └── authStore.test.ts
│   └── test/
│       ├── setup.ts
│       └── mocks/
│           └── mockData.ts
├── jest.config.js
└── package.json
```

---

## 🚀 Executando Testes

### Executar todos os testes
```bash
cd mobile
npm test
```

### Executar em modo watch
```bash
npm run test:watch
```

### Executar com cobertura
```bash
npm run test:coverage
```

### Executar um arquivo específico
```bash
npm test -- api.test.ts
```

---

## 📊 Cobertura de Testes

### Meta de Cobertura
- **Branches**: 50%
- **Functions**: 50%
- **Lines**: 50%
- **Statements**: 50%

### Verificar Cobertura
```bash
npm run test:coverage
```

Isso gerará um relatório de cobertura no terminal e criará uma pasta `coverage/` com relatórios HTML detalhados.

---

## ✍️ Escrevendo Novos Testes

### Estrutura de um Teste

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals'

describe('NomeDoComponente', () => {
  beforeEach(() => {
    // Setup antes de cada teste
  })

  it('deve fazer algo específico', () => {
    // Arrange
    const input = 'valor'
    
    // Act
    const result = funcao(input)
    
    // Assert
    expect(result).toBe('esperado')
  })
})
```

### Testando Stores (Zustand)

```typescript
import { useAuthStore } from '../../../stores/authStore'

describe('AuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null })
  })

  it('deve atualizar o estado corretamente', () => {
    useAuthStore.getState().setToken('token-123')
    expect(useAuthStore.getState().token).toBe('token-123')
  })
})
```

### Testando API

```typescript
import api from '../../../api/api'

// Mock do axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
  })),
}))

describe('API', () => {
  it('deve fazer requisição GET', async () => {
    // Mock da resposta
    const mockResponse = { data: { id: '123' } }
    api.get = jest.fn().mockResolvedValue(mockResponse)
    
    const result = await api.get('/endpoint')
    expect(result.data.id).toBe('123')
  })
})
```

### Testando Componentes

```typescript
import { render, screen } from '@testing-library/react-native'
import MyComponent from '../MyComponent'

describe('MyComponent', () => {
  it('deve renderizar corretamente', () => {
    render(<MyComponent />)
    expect(screen.getByText('Texto esperado')).toBeTruthy()
  })
})
```

---

## 🔧 Configuração

### jest.config.js

O arquivo `jest.config.js` está configurado com:
- **Preset**: `jest-expo` (configuração específica para Expo)
- **Setup Files**: `src/test/setup.ts`
- **Coverage**: Thresholds definidos
- **Module Mapper**: Suporte para alias `@/`

### src/test/setup.ts

O arquivo de setup inclui:
- Extensão do Jest Native matchers
- Mock do AsyncStorage
- Mock do expo-constants
- Mock do React Native Platform
- Mock do Toast
- Limpeza automática após cada teste

---

## 📝 Convenções

1. **Nomenclatura**: Arquivos de teste devem terminar com `.test.ts` ou `.test.tsx`
2. **Localização**: Testes devem estar em `__tests__/` próximo ao código testado
3. **Estrutura**: Use `describe` para agrupar testes relacionados
4. **Isolamento**: Cada teste deve ser independente (use `beforeEach` para resetar estado)

---

## 🎯 Próximos Passos

- [ ] Adicionar testes de integração
- [ ] Adicionar testes de componentes
- [ ] Adicionar testes de navegação
- [ ] Aumentar cobertura para 70%+

---

**Última Atualização**: 2024








