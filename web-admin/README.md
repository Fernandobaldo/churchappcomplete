# Portal Admin - ChurchApp SaaS

Portal administrativo para gestão interna do SaaS ChurchApp.

## Instalação

```bash
npm install
```

## Desenvolvimento

```bash
npm run dev
```

O portal será aberto em `http://localhost:3001`

## Build

```bash
npm run build
```

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```
VITE_API_URL=http://localhost:3333
```

## Estrutura

- `src/api/` - Clientes API
- `src/components/` - Componentes reutilizáveis
- `src/pages/` - Páginas do portal
- `src/stores/` - Estado global (Zustand)
- `src/utils/` - Utilitários
- `src/types/` - TypeScript types

## Autenticação

O portal usa autenticação JWT. O token é armazenado no localStorage e enviado em todas as requisições.

## Permissões

O portal possui três níveis de permissão:

- **SUPERADMIN**: Acesso completo
- **SUPPORT**: Acesso a usuários, igrejas, membros
- **FINANCE**: Acesso a assinaturas e planos

