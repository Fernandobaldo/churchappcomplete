# 🏛️ ChurchPulse - Sistema de Gestão de Igrejas

Sistema completo de gestão para igrejas com aplicativos Mobile (React Native/Expo) e Web (React/Vite).

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Executando o Projeto](#executando-o-projeto)
- [Documentação](#documentação)
- [Testes](#testes)
- [Contribuindo](#contribuindo)

---

## 🎯 Visão Geral

O ChurchPulse é um sistema SaaS white-label para gestão completa de igrejas, incluindo:

- 👥 **Gestão de Membros** - Cadastro, permissões e hierarquia
- 📅 **Eventos** - Criação e gerenciamento de eventos e cultos
- ⏰ **Horários de Culto** - Configuração de horários padrão e criação automática de eventos
- 💰 **Finanças** - Controle financeiro com entradas e saídas
- ❤️ **Contribuições** - Gestão de ofertas, dízimos e contribuições
- 📖 **Devocionais** - Publicação e compartilhamento de estudos bíblicos
- 📢 **Avisos** - Sistema de comunicados e notícias
- 🔐 **Permissões** - Sistema granular de permissões por módulo
- ⚙️ **Configurações da Igreja** - Edição de informações e horários de culto

---

## 📁 Estrutura do Projeto

```
churchappcomplete/
├── backend/          # API Backend (Node.js + Fastify + Prisma)
├── mobile/           # App Mobile (React Native + Expo)
├── web/              # App Web (React + Vite)
└── README.md         # Este arquivo
```

### Backend
API RESTful construída com:
- **Fastify** - Framework web rápido
- **Prisma** - ORM para PostgreSQL
- **TypeScript** - Tipagem estática
- **JWT** - Autenticação

### Mobile
Aplicativo React Native com:
- **Expo** - Framework para desenvolvimento mobile
- **React Navigation** - Navegação
- **Zustand** - Gerenciamento de estado
- **TypeScript** - Tipagem estática

### Web
Aplicação web com:
- **React 18** - Biblioteca UI
- **Vite** - Build tool
- **Tailwind CSS** - Estilização
- **React Router** - Roteamento
- **Zustand** - Gerenciamento de estado

---

## 🛠️ Tecnologias

### Backend
- Node.js 18+
- Fastify
- Prisma ORM
- PostgreSQL
- TypeScript
- JWT

### Mobile
- React Native 0.81.5
- Expo ~54.0.0
- React Navigation
- Zustand 5.0.4
- TypeScript

### Web
- React 18.2.0
- Vite 5.0.8
- Tailwind CSS 3.3.6
- React Router DOM 6.20.0
- Zustand 5.0.4
- TypeScript

---

## 📋 Pré-requisitos

- **Node.js** 18+ e npm
- **PostgreSQL** 14+ (para backend)
- **Git**
- **Expo CLI** (para desenvolvimento mobile - opcional)

---

## 🚀 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/Fernandobaldo/churchappcomplete.git
cd churchappcomplete
```

### 2. Instale as dependências

```bash
# Backend
cd backend
npm install

# Mobile
cd ../mobile
npm install

# Web
cd ../web
npm install
```

### 3. Configure o Backend

```bash
cd backend

# Copie o arquivo .env.example para .env
cp .env.example .env

# Edite o .env com suas configurações
# Configure DATABASE_URL, JWT_SECRET, etc.
```

### 4. Configure o Banco de Dados

```bash
cd backend

# Execute as migrações
npx prisma migrate deploy

# (Opcional) Execute o seed para dados iniciais
npm run seed
```

### 5. Configure Mobile e Web

Veja a documentação detalhada em:
- [Configuração de Ambiente](./CONFIGURACAO_AMBIENTE.md)

---

## ⚙️ Configuração

### Variáveis de Ambiente

#### Backend (`backend/.env`)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/churchapp"
JWT_SECRET="seu-secret-key-aqui"
PORT=3333
```

#### Mobile (`mobile/.env` ou `app.config.js`)
```env
EXPO_PUBLIC_API_URL=http://192.168.1.23:3333
```

#### Web (`web/.env`)
```env
VITE_API_URL=http://localhost:3333
```

**📖 Documentação completa**: [CONFIGURACAO_AMBIENTE.md](./CONFIGURACAO_AMBIENTE.md)

---

## 🏃 Executando o Projeto

### Backend

```bash
cd backend

# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

Backend estará disponível em `http://localhost:3333`

### Mobile

```bash
cd mobile

# Iniciar Expo
npm start

# Ou usar scripts específicos
npm run start:lan      # Rede local
npm run start:fix      # Com correções
npm run android        # Android
npm run ios            # iOS
```

### Web

```bash
cd web

# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

Web estará disponível em `http://localhost:3000`

---

## 📚 Documentação

### Documentação Principal

- [Análise Comparativa Mobile/Web](./ANALISE_COMPARATIVA_MOBILE_WEB.md)
- [Plano de Sincronização](./PLANO_SINCRONIZACAO_MOBILE_WEB.md)
- [Configuração de Ambiente](./CONFIGURACAO_AMBIENTE.md)
- [Progresso da Implementação](./PROGRESSO_IMPLEMENTACAO.md)

### Documentação por Projeto

#### Backend
- [Como Criar Banco de Desenvolvimento](./backend/COMO_CRIAR_BANCO_DESENVOLVIMENTO.md)
- [Como Criar Banco de Teste](./backend/COMO_CRIAR_BANCO_TESTE.md)
- [Horários de Culto](./backend/HORARIOS_DE_CULTO.md) - Gerenciamento de horários de culto
- [Documentação de Autenticação](./DOCUMENTACAO_AUTENTICACAO_AUTORIZACAO.md)

#### Mobile
- [Guia de Testes](./mobile/README_TESTES.md)
- [Configuração da API](./mobile/README_API_CONFIG.md)
- [Como Usar Start Expo Fix](./mobile/COMO_USAR_START_EXPO_FIX.md)

#### Web
- [Guia de Testes](./web/README_TESTES.md)
- [Como Rodar Testes E2E](./web/COMO_RODAR_TESTES_E2E.md)

---

## 🧪 Testes

### Backend

```bash
cd backend
npm test              # Todos os testes
npm run test:unit     # Testes unitários
npm run test:integration  # Testes de integração
npm run test:e2e      # Testes E2E
```

### Mobile

```bash
cd mobile
npm test              # Todos os testes
npm run test:watch    # Modo watch
npm run test:coverage # Com cobertura
```

### Web

```bash
cd web
npm test              # Todos os testes
npm run test:unit     # Testes unitários
npm run test:integration  # Testes de integração
npm run test:e2e      # Testes E2E
npm run test:coverage # Com cobertura
```

---

## 📊 Status do Projeto

### Funcionalidades Implementadas

✅ **Backend**
- API RESTful completa
- Autenticação JWT
- Sistema de permissões
- Auditoria de ações
- Limites de plano

✅ **Mobile**
- Login e Registro
- Onboarding completo
- Dashboard
- Gestão de Eventos
- Gestão de Contribuições
- Gestão de Devocionais
- Gestão de Membros
- Gestão de Finanças
- Sistema de Avisos
- Perfil do usuário

✅ **Web**
- Login e Registro
- Onboarding completo
- Dashboard
- Gestão de Eventos
- Gestão de Contribuições
- Gestão de Devocionais
- Gestão de Membros
- Gestão de Finanças
- Sistema de Avisos
- Sistema de Permissões
- Perfil do usuário

### Paridade de Funcionalidades

- **Mobile ↔ Web**: ~95% de paridade
- **Testes**: Web completo, Mobile básico
- **Documentação**: Completa

---

## 🔄 Sincronização Mobile/Web

O projeto mantém sincronização entre Mobile e Web através de:

- ✅ API padronizada
- ✅ AuthStore padronizado
- ✅ Dependências alinhadas
- ✅ Funcionalidades core sincronizadas

**📖 Veja mais**: [PLANO_SINCRONIZACAO_MOBILE_WEB.md](./PLANO_SINCRONIZACAO_MOBILE_WEB.md)

---

## 🤝 Contribuindo

1. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
2. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
3. Push para a branch (`git push origin feature/nova-feature`)
4. Abra um Pull Request

### Padrões de Código

- Use TypeScript
- Siga os padrões de lint existentes
- Escreva testes para novas funcionalidades
- Documente mudanças significativas

---

## 📝 Licença

Este projeto é privado e proprietário.

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte a documentação específica do projeto
2. Verifique os arquivos de configuração
3. Abra uma issue no repositório

---

## 🎯 Roadmap

- [ ] Melhorar cobertura de testes no Mobile
- [ ] Adicionar testes E2E no Mobile
- [ ] Implementar notificações push
- [ ] Adicionar relatórios avançados
- [ ] Melhorar design system

---

**Última Atualização**: 2024
**Versão**: 1.0.0

