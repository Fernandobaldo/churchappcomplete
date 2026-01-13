# Guia de Testes - Mobile

Este documento descreve como executar e escrever testes para o aplicativo mobile.

## Estrutura de Testes

Os testes estão organizados na seguinte estrutura:

```
mobile/src/__tests__/
├── unit/
│   ├── api/
│   │   └── api.test.ts
│   ├── components/
│   │   └── FormsComponent.test.tsx
│   ├── screens/
│   │   ├── AddEventScreen.test.tsx
│   │   ├── ChurchSettingsScreen.test.tsx
│   │   └── MemberRegistrationScreen.test.tsx
│   └── stores/
│       └── authStore.test.ts
```

## Executando Testes

### Executar todos os testes
```bash
npm test
```

### Executar testes em modo watch
```bash
npm run test:watch
```

### Executar testes com coverage
```bash
npm run test:coverage
```

## Configuração

Os testes usam:
- **Jest** como framework de testes
- **@testing-library/react-native** para testes de componentes
- **@testing-library/jest-native** para matchers adicionais

## Escrevendo Testes

### Exemplo: Teste de Componente

```typescript
import { render, screen } from '@testing-library/react-native'
import MyComponent from '../components/MyComponent'

describe('MyComponent', () => {
  it('deve renderizar corretamente', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeTruthy()
  })
})
```

### Exemplo: Teste de API

```typescript
import api from '../api/api'

describe('API', () => {
  it('deve fazer requisição GET', async () => {
    const response = await api.get('/endpoint')
    expect(response.status).toBe(200)
  })
})
```

## Mocking

Para mockar módulos, use `jest.mock()`:

```typescript
jest.mock('../api/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
}))
```

## Boas Práticas

1. **Isolamento**: Cada teste deve ser independente
2. **Nomenclatura**: Use nomes descritivos para os testes
3. **Arrange-Act-Assert**: Organize os testes em três fases
4. **Cobertura**: Procure manter cobertura acima de 60%

## Próximos Passos

- [ ] Adicionar testes de integração
- [ ] Adicionar testes E2E
- [ ] Configurar MSW (Mock Service Worker) para mockar APIs
- [ ] Adicionar testes de navegação


