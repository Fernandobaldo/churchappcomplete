# 🧪 Guia de Testes - ChurchPulse Web

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Estrutura de Testes](#estrutura-de-testes)
3. [Executando Testes](#executando-testes)
4. [Cobertura de Testes](#cobertura-de-testes)
5. [Escrevendo Novos Testes](#escrevendo-novos-testes)

---

## 🎯 Visão Geral

O projeto utiliza **Vitest** como framework de testes e **React Testing Library** para testes de componentes React. Os testes estão organizados em:

- **Testes Unitários**: Testam componentes, stores e utilitários isoladamente
- **Testes de Integração**: Testam fluxos completos e interações entre componentes

---

## 📁 Estrutura de Testes

```
web/
├── src/
│   ├── __tests__/
│   │   ├── unit/
│   │   │   ├── stores/
│   │   │   │   └── authStore.test.ts
│   │   │   ├── components/
│   │   │   │   ├── ProtectedRoute.test.tsx
│   │   │   │   ├── Header.test.tsx
│   │   │   │   ├── Sidebar.test.tsx
│   │   │   │   └── Layout.test.tsx
│   │   │   └── api/
│   │   │       └── api.test.ts
│   │   └── integration/
│   │       ├── auth/
│   │       │   └── login.test.tsx
│   │       ├── events/
│   │       │   └── events-crud.test.tsx
│   │       ├── contributions/
│   │       │   └── contributions-crud.test.tsx
│   │       ├── devotionals/
│   │       │   └── devotionals-crud.test.tsx
│   │       ├── members/
│   │       │   └── members-crud.test.tsx
│   │       └── navigation/
│   │           └── protected-routes.test.tsx
│   └── test/
│       ├── setup.ts
│       ├── utils/
│       │   └── renderWithProviders.tsx
│       └── mocks/
│           ├── mockData.ts
│           ├── handlers.ts
│           └── server.ts
└── vitest.config.ts
```

---

## 🚀 Executando Testes

### Executar todos os testes
```bash
npm test
```

### Executar testes em modo watch
```bash
npm run test:watch
```

### Executar testes com UI interativa
```bash
npm run test:ui
```

### Executar apenas testes unitários
```bash
npm run test:unit
```

### Executar apenas testes de integração
```bash
npm run test:integration
```

### Gerar relatório de cobertura
```bash
npm run test:coverage
```

---

## 📊 Cobertura de Testes

### Testes Unitários Implementados

#### Stores
- ✅ **authStore.test.ts**
  - `setUserFromToken` - decodificação de token
  - `logout` - limpeza de estado
  - `setToken` - definição de token
  - Mapeamento de permissões

#### Componentes
- ✅ **ProtectedRoute.test.tsx**
  - Redirecionamento quando não autenticado
  - Renderização quando autenticado

- ✅ **Header.test.tsx**
  - Renderização do nome da aplicação
  - Exibição do nome do usuário
  - Funcionalidade de logout

- ✅ **Sidebar.test.tsx**
  - Renderização de itens do menu
  - Filtro de permissões
  - Destaque de item ativo

- ✅ **Layout.test.tsx**
  - Renderização de Header e Sidebar
  - Renderização de Outlet

#### API
- ✅ **api.test.ts**
  - Interceptores de request/response
  - Tratamento de erros 401

### Testes de Integração Implementados

#### Autenticação
- ✅ **login.test.tsx**
  - Login com sucesso
  - Tratamento de erros
  - Validação de campos
  - Estado de loading

#### Events
- ✅ **events-crud.test.tsx**
  - Listagem de eventos
  - Criação de eventos
  - Tratamento de erros

#### Contributions
- ✅ **contributions-crud.test.tsx**
  - Listagem de contribuições
  - Formatação de valores

#### Devotionals
- ✅ **devotionals-crud.test.tsx**
  - Listagem de devocionais
  - Exibição de informações do autor

#### Members
- ✅ **members-crud.test.tsx**
  - Listagem de membros
  - Exibição de roles

#### Navegação
- ✅ **protected-routes.test.tsx**
  - Proteção de rotas
  - Redirecionamento quando não autenticado
  - Acesso quando autenticado

---

## ✍️ Escrevendo Novos Testes

### Exemplo: Teste Unitário de Componente

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import MeuComponente from '@/components/MeuComponente'

describe('MeuComponente', () => {
  it('deve renderizar corretamente', () => {
    render(
      <MemoryRouter>
        <MeuComponente />
      </MemoryRouter>
    )

    expect(screen.getByText('Texto esperado')).toBeInTheDocument()
  })
})
```

### Exemplo: Teste de Integração

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import MinhaPagina from '@/pages/MinhaPagina'
import api from '@/api/api'

vi.mock('@/api/api')

describe('MinhaPagina Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve fazer requisição e exibir dados', async () => {
    const mockData = [{ id: '1', name: 'Test' }]
    vi.mocked(api.get).mockResolvedValue({ data: mockData })

    render(
      <MemoryRouter>
        <MinhaPagina />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument()
    })
  })
})
```

### Boas Práticas

1. **Isolamento**: Cada teste deve ser independente
2. **Arrange-Act-Assert**: Organize seus testes nessa estrutura
3. **Nomes descritivos**: Use nomes que descrevam o comportamento testado
4. **Mock apenas o necessário**: Não mocke tudo, apenas o que é externo
5. **Teste comportamentos, não implementação**: Foque no que o usuário vê/faz

---

## 🔧 Configuração

### vitest.config.ts

A configuração do Vitest está em `vitest.config.ts` e inclui:
- Ambiente jsdom para testes de componentes React
- Setup automático de mocks
- Cobertura de código com v8
- Aliases de importação (@/)

### Setup de Testes

O arquivo `src/test/setup.ts` configura:
- Limpeza automática após cada teste
- Mocks globais (localStorage, window.location, toast)
- Configuração do jest-dom

---

## 📈 Próximos Passos

### Testes Pendentes

- [ ] Testes de formulários (validação completa)
- [ ] Testes de edição de recursos (Events, Contributions, etc)
- [ ] Testes de exclusão de recursos
- [ ] Testes de permissões (acesso baseado em role)
- [ ] Testes de navegação completa entre páginas
- [ ] Testes de tratamento de erros de rede
- [ ] Testes de loading states em todas as páginas

### Melhorias

- [ ] Aumentar cobertura de código para >80%
- [ ] Adicionar testes E2E com Playwright/Cypress
- [ ] Configurar CI/CD para rodar testes automaticamente
- [ ] Adicionar testes de acessibilidade

---

## 🐛 Troubleshooting

### Erro: "Cannot find module"
- Verifique se os aliases estão configurados corretamente no `vitest.config.ts`
- Certifique-se de que os imports estão usando o alias `@/`

### Erro: "localStorage is not defined"
- O setup.ts já configura o mock do localStorage
- Verifique se o arquivo está sendo importado corretamente

### Testes lentos
- Use `vi.mock()` para mockar módulos pesados
- Evite renderizar componentes desnecessários
- Use `waitFor` apenas quando necessário

---

## 📚 Recursos

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)


