# ChurchPulse Web

Versão web do sistema ChurchPulse - SaaS de gestão de igrejas white-label.

## 🚀 Tecnologias

- **React 18** - Biblioteca JavaScript para construção de interfaces
- **TypeScript** - Superset JavaScript com tipagem estática
- **Vite** - Build tool moderna e rápida
- **React Router** - Roteamento para aplicações React
- **Tailwind CSS** - Framework CSS utility-first
- **Zustand** - Gerenciamento de estado leve
- **React Hook Form** - Biblioteca para formulários
- **Axios** - Cliente HTTP
- **date-fns** - Manipulação de datas
- **Lucide React** - Ícones
- **React Hot Toast** - Notificações toast

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Backend do ChurchPulse rodando (porta 3333)

## 🛠️ Instalação

1. Instale as dependências:

```bash
npm install
```

2. Configure as variáveis de ambiente:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e configure a URL da API:

```
VITE_API_URL=http://localhost:3333
```

## 🏃 Executando

### Desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`

### Build para Produção

```bash
npm run build
```

Os arquivos serão gerados na pasta `dist/`

### Preview da Build

```bash
npm run preview
```

## 📁 Estrutura do Projeto

```
web/
├── src/
│   ├── api/           # Configuração do Axios e chamadas API
│   ├── components/    # Componentes reutilizáveis
│   ├── pages/         # Páginas da aplicação
│   ├── stores/        # Stores Zustand (estado global)
│   ├── App.tsx        # Componente principal
│   ├── main.tsx       # Entry point
│   └── index.css      # Estilos globais
├── public/            # Arquivos estáticos
├── index.html         # HTML base
└── package.json       # Dependências e scripts
```

## 🎨 Design System

### Cores

- **Primary**: `#3366FF` (Azul principal)
- **Primary Light**: `#D6E4FF` (Azul claro)
- **Primary Dark**: `#1e40af` (Azul escuro)

### Componentes

- Botões: `.btn-primary`, `.btn-secondary`
- Inputs: `.input`
- Cards: `.card`

## 🔐 Autenticação

A aplicação usa JWT para autenticação. O token é armazenado no localStorage através do Zustand persist.

## 📱 Funcionalidades

- ✅ Login/Autenticação
- ✅ Dashboard com estatísticas
- ✅ Gerenciamento de Eventos
- ✅ Gerenciamento de Contribuições
- ✅ Gerenciamento de Devocionais
- ✅ Gerenciamento de Membros
- ✅ Sistema de Permissões
- ✅ Perfil do Usuário

## 🔗 Integração com Backend

A aplicação se conecta ao backend através da URL configurada em `VITE_API_URL`. O proxy do Vite está configurado para redirecionar requisições `/api` para o backend durante o desenvolvimento.

## 📝 Licença

Este projeto faz parte do sistema ChurchPulse.

