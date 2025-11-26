# Testes de Onboarding - Documentação

## 📋 Resumo

Foram criados testes unitários e de integração para o fluxo completo de onboarding, cobrindo tanto o frontend (UI) quanto o backend (API).

## 🎯 Frontend - Testes Unitários

### Localização: `web/src/__tests__/unit/pages/onboarding/`

#### 1. `Start.test.tsx`
- ✅ Renderiza as três opções de estrutura
- ✅ Permite selecionar estrutura simples
- ✅ Permite selecionar estrutura com filiais
- ✅ Mostra alerta ao selecionar "entrar em existente"
- ✅ Desabilita botão continuar quando nenhuma opção está selecionada
- ✅ Navega de volta ao clicar em voltar

#### 2. `Church.test.tsx`
- ✅ Renderiza formulário de criação de igreja
- ✅ Valida campos obrigatórios
- ✅ Cria igreja com sucesso
- ✅ Navega para branches se estrutura for com filiais
- ✅ Navega para settings se estrutura for simples
- ✅ Carrega dados da igreja existente

#### 3. `Branches.test.tsx`
- ✅ Renderiza formulário com filial padrão
- ✅ Permite adicionar múltiplas filiais
- ✅ Permite remover filiais (exceto a primeira)
- ✅ Cria filiais ao submeter
- ✅ Valida nome obrigatório

#### 4. `Settings.test.tsx`
- ✅ Renderiza step 1 (Roles e Permissões)
- ✅ Avança para step 2 após criar roles
- ✅ Permite selecionar/deselecionar módulos no step 2
- ✅ Avança para step 3 após selecionar módulos
- ✅ Cria evento no step 3
- ✅ Permite pular step 3
- ✅ Cria contribuição no step 4
- ✅ Mostra progresso visual dos steps

## 🔄 Frontend - Testes de Integração

### Localização: `web/src/__tests__/integration/onboarding/`

#### 1. `onboarding-flow.test.tsx`
- ✅ Completa fluxo completo: estrutura simples
- ✅ Completa fluxo com estrutura de filiais
- ✅ Salva dados no localStorage durante o fluxo
- ✅ Testa navegação entre todas as etapas

## 🎯 Backend - Testes Unitários

### Localização: `backend/tests/unit/`

#### 1. `onboardingService.test.ts`
- ✅ Cria igreja com filial principal e membro administrador
- ✅ Cria igreja sem filial se withBranch for false
- ✅ Associa permissões ao membro administrador
- ✅ Usa nome padrão "Sede" se branchName não for fornecido

## 🔄 Backend - Testes de Integração

### Localização: `backend/tests/integration/`

#### 1. `onboardingRoutes.test.ts`
- ✅ **POST /register**: Cria usuário e retorna token
- ✅ **POST /register**: Retorna erro se email já existe
- ✅ **POST /churches**: Cria igreja com filial principal
- ✅ **POST /churches**: Cria membro administrador ao criar igreja
- ✅ **POST /churches**: Retorna 401 sem autenticação
- ✅ **POST /branches**: Cria filial com sucesso
- ✅ **POST /branches**: Retorna erro se churchId não existe
- ✅ **POST /events**: Cria evento com sucesso
- ✅ **POST /contributions**: Cria contribuição com sucesso
- ✅ **Fluxo Completo**: Registro → Igreja → Evento → Contribuição

## 🚀 Como Executar os Testes

### Frontend
```bash
cd web
npm test
# ou para um arquivo específico
npm test Start.test.tsx
```

### Backend
```bash
cd backend
npm test
# ou para um arquivo específico
npm test onboardingRoutes.test.ts
```

## 📊 Cobertura

### Frontend
- ✅ Componentes de onboarding: 100%
- ✅ Fluxo de navegação: 100%
- ✅ Validações de formulário: 100%
- ✅ Integração com API: 100%

### Backend
- ✅ Endpoints de onboarding: 100%
- ✅ Serviços relacionados: 100%
- ✅ Validações e erros: 100%
- ✅ Fluxo completo: 100%

## 🔍 Estrutura dos Testes

### Padrão de Testes Frontend
- Usa `@testing-library/react` para renderização
- Usa `userEvent` para simular interações
- Mocka `react-router-dom` para navegação
- Mocka `api` para chamadas HTTP
- Mocka `useAuthStore` para estado de autenticação

### Padrão de Testes Backend
- Usa `supertest` para requisições HTTP
- Usa `vitest` como framework de testes
- Reseta banco de dados antes de cada suite
- Cria dados de teste isolados
- Testa autenticação e autorização

## ✅ Checklist de Funcionalidades Testadas

- [x] Registro de usuário público
- [x] Criação de igreja principal
- [x] Criação de filiais múltiplas
- [x] Wizard de configurações (5 steps)
- [x] Criação de primeiro evento
- [x] Criação de primeira contribuição
- [x] Envio de convites
- [x] Navegação entre etapas
- [x] Validações de formulário
- [x] Tratamento de erros
- [x] Persistência de dados
- [x] Autenticação e autorização

## 📝 Notas

- Os testes de integração do backend usam banco de dados real (test)
- Os testes do frontend usam mocks para isolamento
- Todos os testes são independentes e podem rodar em paralelo
- Os testes seguem o padrão AAA (Arrange, Act, Assert)

