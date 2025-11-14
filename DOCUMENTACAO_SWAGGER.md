# 📚 Documentação Swagger/OpenAPI - ChurchPulse

## 🎯 Visão Geral

A API do ChurchPulse está totalmente documentada com Swagger/OpenAPI 3.0. A documentação interativa está disponível em `/docs` quando o servidor está rodando.

---

## 🚀 Acessando a Documentação

### URL da Documentação

```
http://localhost:3333/docs
```

ou

```
http://192.168.1.13:3333/docs
```

### Interface Swagger UI

A interface Swagger UI permite:
- ✅ Visualizar todos os endpoints
- ✅ Testar requisições diretamente no navegador
- ✅ Ver exemplos de requisições e respostas
- ✅ Autenticar e usar o token JWT automaticamente
- ✅ Ver validações e regras de negócio

---

## 📋 Endpoints Documentados

### Autenticação

#### `POST /login`
- **Descrição**: Autentica um usuário e retorna token JWT
- **Autenticação**: Não requerida
- **Body**: `{ email, password }`
- **Response**: `{ token, user, type }`

#### `POST /public/register`
- **Descrição**: Registro público para landing page
- **Autenticação**: Não requerida
- **Body**: `{ name, email, password }`
- **Response**: `{ user, token }`

---

### Membros

#### `POST /register`
- **Descrição**: Criar novo membro (requer autenticação)
- **Autenticação**: Requerida (exceto se `fromLandingPage: true`)
- **Validações**:
  - ✅ Verifica permissão do criador
  - ✅ Verifica se branch pertence à igreja
  - ✅ Verifica hierarquia de roles
  - ✅ Verifica limite de membros do plano
- **Body**: `{ name, email, password, branchId, role?, permissions?, ... }`
- **Response**: `{ id, name, email, role, branchId, permissions }`

#### `GET /members`
- **Descrição**: Lista membros (filtrado por role)
- **Autenticação**: Requerida
- **Filtros**:
  - ADMINGERAL: Todos os membros da igreja
  - ADMINFILIAL/COORDINATOR: Apenas sua filial
  - MEMBER: Apenas a si mesmo
- **Response**: `Array<Member>`

#### `GET /members/:id`
- **Descrição**: Obtém membro por ID
- **Autenticação**: Requerida
- **Validações de acesso**: Mesmas regras de filtro
- **Response**: `Member`

#### `GET /members/me`
- **Descrição**: Obtém perfil do usuário autenticado
- **Autenticação**: Requerida
- **Response**: `Member`

#### `PUT /members/:id`
- **Descrição**: Atualiza membro
- **Autenticação**: Requerida
- **Validações**:
  - ADMINGERAL: Pode editar qualquer membro da igreja
  - ADMINFILIAL: Pode editar apenas sua filial
  - Outros: Apenas a si mesmos
- **Body**: `{ name?, email?, birthDate?, phone?, address?, avatarUrl? }`
- **Response**: `Member`

#### `GET /register/types`
- **Descrição**: Lista tipos de roles disponíveis
- **Autenticação**: Não requerida
- **Response**: `Array<{ label, value }>`

---

### Filiais

#### `POST /branches`
- **Descrição**: Criar nova filial
- **Autenticação**: Requerida
- **Validações**:
  - ✅ Apenas ADMINGERAL pode criar
  - ✅ Verifica se igreja pertence ao usuário
  - ✅ Verifica limite de branches do plano
- **Body**: `{ name, pastorName, churchId }`
- **Response**: `Branch`

#### `GET /branches`
- **Descrição**: Lista todas as filiais
- **Autenticação**: Requerida
- **Response**: `Array<Branch>`

#### `DELETE /branches/:id`
- **Descrição**: Deleta filial
- **Autenticação**: Requerida
- **Validação**: Não permite deletar filial principal
- **Response**: `{ message }`

---

## 🔐 Autenticação na Documentação

### Como Autenticar no Swagger UI

1. **Fazer Login**:
   - Acesse `POST /login`
   - Clique em "Try it out"
   - Preencha email e senha
   - Clique em "Execute"
   - Copie o token retornado

2. **Autorizar**:
   - Clique no botão "Authorize" no topo da página
   - Cole o token no campo "Value"
   - Clique em "Authorize"
   - Agora todas as requisições incluirão o token automaticamente

---

## 📊 Schemas Documentados

### Member
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "role": "MEMBER | COORDINATOR | ADMINFILIAL | ADMINGERAL",
  "branchId": "string",
  "birthDate": "string | null",
  "phone": "string | null",
  "address": "string | null",
  "avatarUrl": "string | null",
  "permissions": [
    {
      "type": "string"
    }
  ]
}
```

### Branch
```json
{
  "id": "string",
  "name": "string",
  "pastorName": "string",
  "churchId": "string",
  "isMainBranch": "boolean"
}
```

### Church
```json
{
  "id": "string",
  "name": "string",
  "logoUrl": "string | null",
  "branches": ["Branch"]
}
```

### Plan
```json
{
  "id": "string",
  "name": "string",
  "price": "number",
  "features": ["string"],
  "maxMembers": "number | null",
  "maxBranches": "number | null"
}
```

---

## ⚠️ Códigos de Status HTTP

| Código | Descrição | Quando Ocorre |
|--------|-----------|---------------|
| `200` | OK | Requisição bem-sucedida |
| `201` | Created | Recurso criado com sucesso |
| `400` | Bad Request | Erro de validação de dados |
| `401` | Unauthorized | Não autenticado |
| `403` | Forbidden | Sem permissão ou limite excedido |
| `404` | Not Found | Recurso não encontrado |
| `500` | Internal Server Error | Erro interno do servidor |

---

## 🔍 Validações Documentadas

### Validações de Criação de Membros

- ✅ **Autorização**: Verifica se o usuário tem permissão
- ✅ **Branch**: Verifica se pertence à mesma igreja
- ✅ **Role**: Verifica se pode atribuir o role especificado
- ✅ **Limite**: Verifica limite de membros do plano

### Validações de Criação de Branches

- ✅ **Autorização**: Apenas ADMINGERAL pode criar
- ✅ **Igreja**: Verifica se pertence ao usuário
- ✅ **Limite**: Verifica limite de branches do plano

### Validações de Acesso

- ✅ **Filtros por Role**: Aplicados automaticamente
- ✅ **Edição**: Validações de permissão de edição
- ✅ **Visualização**: Validações de permissão de visualização

---

## 📝 Exemplos de Uso

### Criar Membro (ADMINGERAL)

```bash
POST /register
Authorization: Bearer <token>

{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "password123",
  "branchId": "branch-123",
  "role": "MEMBER"
}
```

### Criar Branch (ADMINGERAL)

```bash
POST /branches
Authorization: Bearer <token>

{
  "name": "Filial Centro",
  "pastorName": "Pr. João Silva",
  "churchId": "church-123"
}
```

### Listar Membros

```bash
GET /members
Authorization: Bearer <token>
```

---

## 🛠️ Configuração

### Arquivo de Configuração

A configuração do Swagger está em `backend/src/server.ts`:

```typescript
app.register(fastifySwagger, {
    openapi: {
        openapi: '3.0.0',
        info: {
            title: 'ChurchPulse API',
            description: '...',
            version: '1.0.0',
        },
        // ...
    },
});
```

### Adicionar Documentação a Novas Rotas

Para adicionar documentação a uma nova rota, inclua o schema:

```typescript
app.post('/endpoint', {
  schema: {
    description: 'Descrição do endpoint',
    tags: ['Tag'],
    summary: 'Resumo',
    security: [{ bearerAuth: [] }],
    body: { /* schema do body */ },
    response: { /* schemas de resposta */ },
  },
}, handler)
```

---

## 📚 Recursos Adicionais

### Tags Organizadas

- **Autenticação**: Login e registro
- **Membros**: Gerenciamento de membros
- **Filiais**: Gerenciamento de branches
- **Igrejas**: Gerenciamento de igrejas
- **Eventos**: Gerenciamento de eventos
- **Devocionais**: Gerenciamento de devocionais
- **Contribuições**: Gerenciamento de contribuições
- **Planos**: Gerenciamento de planos
- **Permissões**: Gerenciamento de permissões
- **Admin**: Endpoints administrativos

### Exportar Especificação OpenAPI

A especificação OpenAPI pode ser exportada em JSON:

```
GET /docs/json
```

---

## ✅ Checklist de Documentação

- [x] Configuração do Swagger/OpenAPI
- [x] Documentação de autenticação
- [x] Documentação de criação de membros
- [x] Documentação de criação de branches
- [x] Documentação de listagem de membros
- [x] Documentação de validações
- [x] Documentação de códigos de status
- [x] Schemas de dados
- [x] Exemplos de uso
- [x] Tags organizadas

---

## 🚀 Próximos Passos

1. **Adicionar mais endpoints**: Documentar eventos, devocionais, etc.
2. **Exemplos mais detalhados**: Adicionar mais exemplos de requisições
3. **Schemas reutilizáveis**: Criar schemas compartilhados
4. **Validações visuais**: Destacar validações importantes na UI

---

**Documentação criada em**: 2025-01-27
**Versão da API**: 1.0.0
**Versão do OpenAPI**: 3.0.0

