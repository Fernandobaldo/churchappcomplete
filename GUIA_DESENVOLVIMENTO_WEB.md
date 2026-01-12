# 🌐 Guia de Desenvolvimento - Web

Guia completo para desenvolvimento da aplicação Web do ChurchPulse.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Setup Inicial](#setup-inicial)
3. [Estrutura do Projeto](#estrutura-do-projeto)
4. [Configuração](#configuração)
5. [Desenvolvimento](#desenvolvimento)
6. [Roteamento](#roteamento)
7. [Estado Global](#estado-global)
8. [API](#api)
9. [Estilização](#estilização)
10. [Testes](#testes)
11. [Build e Deploy](#build-e-deploy)

---

## 🎯 Visão Geral

A aplicação Web é construída com:
- **React 18.2.0**
- **Vite 5.0.8**
- **TypeScript**
- **React Router DOM 6.20.0**
- **Tailwind CSS 3.3.6**
- **Zustand 5.0.4** para estado global
- **Axios 1.8.4** para requisições HTTP

---

## 🚀 Setup Inicial

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Backend rodando (porta 3333)

### Instalação

```bash
cd web
npm install
```

### Configuração da API

1. Crie arquivo `.env`:
```env
VITE_API_URL=http://localhost:3333
```

2. Para produção, configure a URL do backend:
```env
VITE_API_URL=https://api.seudominio.com
```

**📖 Mais detalhes**: [CONFIGURACAO_AMBIENTE.md](../CONFIGURACAO_AMBIENTE.md)

---

## 📁 Estrutura do Projeto

```
web/
├── src/
│   ├── api/              # Configuração do Axios
│   │   └── api.ts
│   ├── components/        # Componentes reutilizáveis
│   │   ├── Header.tsx
│   │   ├── Layout.tsx
│   │   ├── Sidebar.tsx
│   │   └── ProtectedRoute.tsx
│   ├── pages/            # Páginas da aplicação
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Events/
│   │   ├── Contributions/
│   │   ├── Devotionals/
│   │   ├── Members/
│   │   ├── Finances/
│   │   ├── Notices/
│   │   └── onboarding/
│   ├── stores/           # Stores Zustand
│   │   └── authStore.ts
│   ├── __tests__/        # Testes
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   └── test/             # Setup de testes
│       ├── setup.ts
│       └── mocks/
├── public/               # Arquivos estáticos
├── index.html           # HTML base
├── vite.config.ts       # Configuração do Vite
├── tailwind.config.js   # Configuração do Tailwind
└── package.json
```

---

## ⚙️ Configuração

### Variáveis de Ambiente

Crie arquivo `.env` na raiz do projeto `web/`:

```env
VITE_API_URL=http://localhost:3333
```

**Nota**: No Vite, variáveis devem começar com `VITE_` para serem acessíveis.

### Arquivos de Ambiente

- `.env` - Carregado em todos os ambientes
- `.env.local` - Carregado em todos, ignorado pelo git
- `.env.development` - Apenas em desenvolvimento
- `.env.production` - Apenas em produção

---

## 💻 Desenvolvimento

### Iniciar Servidor de Desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`

### Scripts Disponíveis

```bash
npm run dev              # Servidor de desenvolvimento
npm run build            # Build para produção
npm run preview          # Preview da build
npm run lint             # Executar ESLint
npm test                 # Executar testes
npm run test:watch       # Testes em modo watch
npm run test:coverage    # Testes com cobertura
npm run test:unit        # Apenas testes unitários
npm run test:integration # Apenas testes de integração
npm run test:e2e         # Apenas testes E2E
```

### Hot Module Replacement (HMR)

O Vite oferece HMR rápido. Mudanças no código são refletidas instantaneamente no navegador.

---

## 🧭 Roteamento

### Estrutura de Rotas

O app usa **React Router DOM** com rotas protegidas:

```typescript
// src/App.tsx
<Routes>
  {/* Rotas públicas */}
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  
  {/* Rotas protegidas */}
  <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
    <Route path="dashboard" element={<Dashboard />} />
    <Route path="events" element={<Events />} />
    {/* ... */}
  </Route>
</Routes>
```

### Adicionar Nova Rota

1. Crie a página em `src/pages/`:
```typescript
// src/pages/MinhaPagina.tsx
export default function MinhaPagina() {
  return <div>Minha Página</div>
}
```

2. Adicione a rota em `App.tsx`:
```typescript
import MinhaPagina from './pages/MinhaPagina'

<Route path="/app/minha-pagina" element={<MinhaPagina />} />
```

3. Adicione link no Sidebar (se necessário):
```typescript
// src/components/Sidebar.tsx
{ path: '/app/minha-pagina', icon: Icon, label: 'Minha Página' }
```

### Rotas Protegidas

Use o componente `ProtectedRoute`:

```typescript
<Route
  path="/app/admin"
  element={
    <ProtectedRoute>
      <AdminPage />
    </ProtectedRoute>
  }
/>
```

---

## 🗄️ Estado Global

### Zustand Store

O app usa **Zustand** com persistência no localStorage:

```typescript
// src/stores/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      setUserFromToken: (token) => {
        // Lógica aqui
        set({ token, user: decodedUser })
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
```

### Usar o Store

```typescript
import { useAuthStore } from '../stores/authStore'

function MinhaPagina() {
  const { user, token } = useAuthStore()
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
- Tratamento robusto de erros
- Logs em desenvolvimento
- Transform response

### Fazer Requisições

```typescript
import api from '../api/api'
import toast from 'react-hot-toast'

// GET
const response = await api.get('/events')
const events = response.data

// POST
try {
  const newEvent = await api.post('/events', {
    title: 'Culto de Domingo',
    date: '2024-01-01',
  })
  toast.success('Evento criado!')
} catch (error: any) {
  toast.error(error.response?.data?.message || 'Erro ao criar evento')
}
```

### Tratamento de Erros

O interceptor trata automaticamente:
- Erros 401 (redireciona para login)
- Erros de rede
- Timeouts
- Logs detalhados em desenvolvimento

---

## 🎨 Estilização

### Tailwind CSS

O app usa **Tailwind CSS** para estilização:

```typescript
<div className="card">
  <h1 className="text-3xl font-bold text-gray-900">Título</h1>
  <button className="btn-primary">Clique aqui</button>
</div>
```

### Classes Utilitárias

- **Cards**: `.card`
- **Botões**: `.btn-primary`, `.btn-secondary`
- **Inputs**: `.input`
- **Cores**: `.text-primary`, `.bg-primary`

### Design System

Cores principais definidas em `tailwind.config.js`:
- Primary: `#3B82F6` (azul)
- Success: Verde
- Error: Vermelho
- Warning: Amarelo

---

## 🧪 Testes

### Estrutura

```
src/
├── __tests__/
│   ├── unit/          # Testes unitários
│   ├── integration/   # Testes de integração
│   └── e2e/          # Testes E2E
└── test/
    ├── setup.ts
    └── mocks/
```

### Executar Testes

```bash
npm test                 # Todos os testes
npm run test:unit        # Apenas unitários
npm run test:integration # Apenas integração
npm run test:e2e         # Apenas E2E
npm run test:coverage    # Com cobertura
npm run test:ui          # Interface visual
```

### Escrever Testes

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MinhaPagina from '../MinhaPagina'

describe('MinhaPagina', () => {
  it('deve renderizar corretamente', () => {
    render(<MinhaPagina />)
    expect(screen.getByText('Título')).toBeInTheDocument()
  })
})
```

**📖 Mais detalhes**: [README_TESTES.md](./README_TESTES.md)

---

## 📦 Build e Deploy

### Build para Produção

```bash
npm run build
```

Os arquivos serão gerados na pasta `dist/`

### Preview da Build

```bash
npm run preview
```

### Deploy

#### Vercel

```bash
npm install -g vercel
vercel
```

#### Netlify

1. Conecte o repositório
2. Configure build command: `npm run build`
3. Configure publish directory: `dist`

#### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

---

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. Erro de conexão com API
- Verifique se o backend está rodando
- Confirme `VITE_API_URL` no `.env`
- Verifique CORS no backend

#### 2. Erro de build
```bash
rm -rf node_modules dist
npm install
npm run build
```

#### 3. Problemas com Tailwind
```bash
npm run build
# Verifique se as classes estão sendo geradas
```

---

## 📚 Recursos

- [Documentação Vite](https://vitejs.dev/)
- [React Router](https://reactrouter.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [React Hook Form](https://react-hook-form.com/)

---

**Última Atualização**: 2024

















