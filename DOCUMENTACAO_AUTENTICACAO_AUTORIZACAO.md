# 📚 Documentação Completa: Autenticação, Autorização e Controle de Acesso - ChurchPulse

## 📋 Índice

1. [Visão Geral do Sistema](#visão-geral-do-sistema)
2. [Estrutura Organizacional](#estrutura-organizacional)
3. [Modelos de Dados](#modelos-de-dados)
4. [Hierarquia de Roles](#hierarquia-de-roles)
5. [Sistema de Permissões](#sistema-de-permissões)
6. [Fluxos de Criação de Usuários](#fluxos-de-criação-de-usuários)
7. [Regras de Segurança e Hierarquia](#regras-de-segurança-e-hierarquia)
8. [JWT e Autorização](#jwt-e-autorização)
9. [Limites de Plano](#limites-de-plano)
10. [Implementação Técnica](#implementação-técnica)

---

## 🎯 Visão Geral do Sistema

O **ChurchPulse** é um sistema white-label para gestão de igrejas que implementa uma arquitetura multi-tenant onde:

- Cada **Igreja (Church)** é uma organização independente
- Cada igreja pode ter múltiplas **Filiais (Branches)**
- Cada **Membro (Member)** pertence a exatamente uma filial
- O sistema controla acesso através de **Roles** e **Permissões Granulares**

---

## 🏗️ Estrutura Organizacional

### Hierarquia

```
Igreja (Church)
  └── Filial 1 (Branch) - Sede
      ├── Membro 1 (Member)
      ├── Membro 2 (Member)
      └── ...
  └── Filial 2 (Branch)
      ├── Membro 3 (Member)
      └── ...
```

### Regras Fundamentais

1. **Igreja → Filiais**: Uma igreja pode ter 1 ou mais filiais
2. **Filial → Membros**: Cada membro pertence a exatamente 1 filial
3. **Filial → Igreja**: Cada filial pertence a exatamente 1 igreja
4. **Isolamento**: Todas as operações e permissões dependem dessa estrutura

---

## 📊 Modelos de Dados

### 1. Church (Igreja)

**Localização**: `backend/prisma/schema.prisma`

```prisma
model Church {
  id       String   @id @default(cuid())
  name     String
  logoUrl  String?
  branches Branch[]
}
```

**Campos Relevantes**:
- `id`: Identificador único
- `name`: Nome da igreja
- `logoUrl`: URL do logo (opcional)
- `branches`: Relação com filiais (1:N)

**Observação**: O modelo `Church` no schema atual não possui campos `plan`, `maxMembers` ou `maxBranches` diretamente. Esses limites são gerenciados através do modelo `Plan` e `Subscription`.

### 2. Branch (Filial)

**Localização**: `backend/prisma/schema.prisma`

```prisma
model Branch {
  id           String         @id @default(cuid())
  name         String
  pastorName   String
  churchId     String
  isMainBranch Boolean        @default(false)
  church       Church         @relation(fields: [churchId], references: [id], onDelete: Cascade)
  members      Member[]
  // ... outras relações
}
```

**Campos Relevantes**:
- `id`: Identificador único
- `name`: Nome da filial
- `pastorName`: Nome do pastor responsável
- `churchId`: ID da igreja à qual pertence
- `isMainBranch`: Indica se é a filial principal (Sede)
- `members`: Relação com membros (1:N)

### 3. Member (Membro/Usuário)

**Localização**: `backend/prisma/schema.prisma`

```prisma
model Member {
  id             String           @id @default(cuid())
  name           String
  email          String           @unique
  password       String
  birthDate      DateTime?
  phone          String?
  address        String?
  avatarUrl      String?
  role           Role             @default(MEMBER)
  branchId       String
  branch         Branch           @relation(fields: [branchId], references: [id])
  permissions    Permission[]
  userId         String?          @unique
  user           User?            @relation("UserMember", fields: [userId], references: [id])
  // ... outras relações
}
```

**Campos Relevantes**:
- `id`: Identificador único
- `name`: Nome completo
- `email`: Email único (usado para login)
- `password`: Senha criptografada (bcrypt)
- `role`: Role do membro (enum: MEMBER, COORDINATOR, ADMINFILIAL, ADMINGERAL)
- `branchId`: ID da filial à qual pertence (obrigatório)
- `permissions`: Permissões granulares (relação N:N)
- `userId`: ID do User associado (opcional, usado para registro público)

### 4. User (Usuário do Sistema)

**Localização**: `backend/prisma/schema.prisma`

```prisma
model User {
  id            String         @id @default(cuid())
  name          String
  email         String         @unique
  password      String
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  subscriptions Subscription[]
  member        Member?        @relation("UserMember")
}
```

**Propósito**: 
- Representa usuários que se registram pela landing page
- Pode estar associado a um `Member` quando cria uma igreja
- Gerencia assinaturas de planos

### 5. Permission (Permissão)

**Localização**: `backend/prisma/schema.prisma`

```prisma
model Permission {
  id       String @id @default(cuid())
  type     String
  memberId String
  member   Member @relation(fields: [memberId], references: [id])

  @@unique([type, memberId])
}
```

**Tipos de Permissões Disponíveis**:

**Localização**: `backend/src/constants/permissions.ts`

```typescript
export const ALL_PERMISSION_TYPES = [
  'devotional_manage',      // Gerenciar devocionais
  'members_view',           // Visualizar membros
  'events_manage',          // Gerenciar eventos
  'contributions_manage',   // Gerenciar contribuições
  'finances_manage'         // Gerenciar finanças
];
```

### 6. Plan (Plano)

**Localização**: `backend/prisma/schema.prisma`

```prisma
model Plan {
  id            String         @id @default(cuid())
  name          String         @unique
  price         Float
  features      String[]
  maxMembers    Int?           // Limite de membros (null = ilimitado)
  maxBranches   Int?           // Limite de branches (null = ilimitado)
  subscriptions Subscription[]
}
```

**Plano Free (Padrão)**:

**Localização**: `backend/prisma/seed.ts`

```typescript
{
  name: 'free',
  price: 0,
  features: [
    'Até 1 igreja',
    'Até 1 filial',
    'Até 20 membros',
    'Painel de controle limitado',
  ],
  maxBranches: 1,
  maxMembers: 20,
}
```

---

## 👥 Hierarquia de Roles

### Enum de Roles

**Localização**: `backend/prisma/schema.prisma`

```prisma
enum Role {
  MEMBER
  COORDINATOR
  ADMINFILIAL
  ADMINGERAL
}
```

### 1. ADMINGERAL (Administrador Geral)

**Nível**: Máximo (4/4)

**Pode**:
- ✅ Criar membros em qualquer filial da igreja
- ✅ Criar novas filiais
- ✅ Editar qualquer dado da igreja
- ✅ Gerenciar plano da igreja
- ✅ Ver tudo de todas as filiais
- ✅ Atribuir qualquer role (exceto ADMINGERAL para outros)
- ✅ Gerenciar permissões de qualquer membro

**Não Pode**:
- ❌ Criar membros para outras igrejas
- ❌ Atribuir role ADMINGERAL para outros (apenas o sistema pode)

**Permissões Automáticas**: Recebe todas as permissões automaticamente

**Implementação**: 
- Criado automaticamente quando uma igreja é criada
- Vinculado ao `User` que criou a igreja

### 2. ADMINFILIAL (Administrador de Filial)

**Nível**: Alto (3/4)

**Pode**:
- ✅ Criar membros dentro da própria filial
- ✅ Editar eventos da própria filial
- ✅ Gerenciar finanças da filial
- ✅ Visualizar membros da própria filial
- ✅ Atribuir roles MEMBER e COORDINATOR

**Não Pode**:
- ❌ Criar outras filiais
- ❌ Administrar membros de outras filiais
- ❌ Atribuir roles ADMINFILIAL ou ADMINGERAL
- ❌ Gerenciar plano da igreja

**Permissões Automáticas**: Recebe todas as permissões automaticamente

### 3. COORDINATOR (Coordenador)

**Nível**: Médio (2/4)

**Pode**:
- ✅ Gerenciar eventos (se tiver permissão `events_manage`)
- ✅ Publicar devocionais (se tiver permissão `devotionals_manage`)
- ✅ Visualizar membros (se tiver permissão `members_view`)
- ✅ Outras ações conforme permissões específicas

**Não Pode**:
- ❌ Criar membros (a menos que tenha permissão `members_manage`)
- ❌ Atribuir roles
- ❌ Gerenciar finanças (a menos que tenha permissão `finances_manage`)

**Permissões**: Dependem de permissões granulares atribuídas

### 4. MEMBER (Membro)

**Nível**: Básico (1/4)

**Pode**:
- ✅ Visualizar conteúdos permitidos
- ✅ Ações específicas conforme permissões granulares

**Não Pode**:
- ❌ Criar membros
- ❌ Atribuir roles
- ❌ Gerenciar eventos (a menos que tenha permissão `events_manage`)
- ❌ Acessar funcionalidades administrativas

**Permissões**: Dependem de permissões granulares atribuídas

---

## 🔐 Sistema de Permissões

### Diferença entre Role e Permissão

| Aspecto | Role | Permissão |
|---------|------|-----------|
| **Tipo** | Nível hierárquico | Acesso granular |
| **Exemplos** | ADMINGERAL, ADMINFILIAL | `events_manage`, `devotionals_manage` |
| **Atribuição** | Automática ou manual | Manual |
| **Escopo** | Define "cargo" | Define "o que pode fazer" |

### Matriz de Permissões

| Usuário | Role | Permissões | Pode Fazer |
|---------|------|------------|------------|
| Maria | MEMBER | `events_manage` | ✅ Criar eventos |
| João | ADMINFILIAL | (todas automáticas) | ✅ Criar/editar membros da própria filial |
| Pedro | MEMBER | (nenhuma) | ❌ Apenas visualizar |
| Ana | COORDINATOR | `devotionals_manage` | ✅ Publicar devocionais |

### Lógica de Atribuição de Permissões

**Localização**: `backend/src/services/auth/registerService.ts`

```typescript
// Se for ADMINGERAL ou ADMINFILIAL → recebe todas as permissões
const typesToAssign =
  finalRole === Role.ADMINGERAL || finalRole === Role.ADMINFILIAL
    ? ALL_PERMISSION_TYPES
    : permissions ?? []
```

---

## 🔄 Fluxos de Criação de Usuários

### A. Registro Público (Landing Page - Plano Free)

**Rota**: `POST /public/register`

**Localização**: 
- Controller: `backend/src/controllers/public/publicRegisterController.ts`
- Service: `backend/src/services/public/publicRegisterService.ts`

**Fluxo**:

1. **Usuário acessa** `/register` na landing page
2. **Informa**:
   - Nome do responsável
   - Email
   - Senha
3. **Sistema cria**:
   - ✅ `User` no banco
   - ✅ `Subscription` com plano "Free"
   - ✅ Retorna token JWT
4. **Usuário já entra** no sistema

**Código**:

```typescript
// backend/src/services/public/publicRegisterService.ts
export async function publicRegisterUserService(data: {
  name: string
  email: string
  password: string
}) {
  // 1. Verifica email único
  const emailAlreadyUsed = await prisma.user.findUnique({ where: { email } })
  if (emailAlreadyUsed) {
    throw new Error('Email já está em uso.')
  }

  // 2. Criptografa senha
  const hashedPassword = await bcrypt.hash(password, 10)

  // 3. Busca plano Free
  const freePlan = await prisma.plan.findFirst({ where: { name: 'free' } })
  if (!freePlan) {
    throw new Error('Plano gratuito não encontrado.')
  }

  // 4. Cria User e Subscription
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      subscriptions: {
        create: {
          planId: freePlan.id,
          status: 'active',
        },
      },
    },
  })

  // 5. Gera token JWT
  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  )

  return { user, token }
}
```

**Observação**: Neste fluxo, **NÃO** é criada uma igreja automaticamente. O usuário precisa criar a igreja posteriormente através de outra rota.

### B. Criação de Igreja com Admin Geral

**Rota**: `POST /churches`

**Localização**:
- Controller: `backend/src/controllers/churchController.ts`
- Service: `backend/src/services/churchService.ts`

**Fluxo**:

1. **Usuário logado** (com User criado) acessa criação de igreja
2. **Informa**:
   - Nome da igreja
   - Nome da filial (opcional, padrão: "Sede")
   - Nome do pastor (opcional)
3. **Sistema cria em transação**:
   - ✅ `Church`
   - ✅ `Branch` (com `isMainBranch: true`)
   - ✅ `Member` com:
     - `role: ADMINGERAL`
     - `branchId: branch.id`
     - `userId: user.id` (vincula ao User)
   - ✅ Todas as permissões para o Member

**Código**:

```typescript
// backend/src/services/churchService.ts
async createChurchWithMainBranch(data: CreateChurchData, user: UserData) {
  return await prisma.$transaction(async (tx) => {
    // 1. Cria Church
    const church = await tx.church.create({
      data: {
        name: data.name,
        logoUrl: data.logoUrl,
        isActive: true,
      },
    })

    // 2. Cria Branch (Sede)
    const branch = await tx.branch.create({
      data: {
        name: data.branchName || `${data.name} - Sede`,
        pastorName: data.pastorName || 'Responsável',
        churchId: church.id,
        isMainBranch: true,
      },
    })

    // 3. Cria Member (ADMINGERAL)
    const hashedPassword = await bcrypt.hash(user.password, 10)
    const member = await tx.member.create({
      data: {
        name: user.name,
        email: user.email,
        password: hashedPassword,
        role: Role.ADMINGERAL,
        branchId: branch.id,
        userId: user.id, // Vincula ao User
      },
    })

    // 4. Atribui todas as permissões
    const allPermissions = await tx.permission.findMany({
      where: { type: { in: ALL_PERMISSION_TYPES } },
    })

    await tx.member.update({
      where: { id: member.id },
      data: {
        permissions: {
          connect: allPermissions.map((p) => ({ id: p.id })),
        },
      },
    })

    return { church, branch, member }
  })
}
```

### C. Criação de Membros Internos

**Rota**: `POST /register`

**Localização**:
- Controller: `backend/src/controllers/auth/registerController.ts`
- Service: `backend/src/services/auth/registerService.ts`

**Quem Pode Criar**:
- ✅ **ADMINGERAL**: Cria membros em qualquer filial da igreja
- ✅ **ADMINFILIAL**: Cria membros somente na sua filial
- ✅ **COORDINATOR**: Depende de permissão `members_manage` (não implementado ainda)

**Fluxo**:

1. **Admin preenche formulário**:
   - Nome
   - Email
   - Senha
   - Role (opcional, padrão: MEMBER)
   - Branch (obrigatório)
   - Permissões (opcional)
2. **Backend valida**:
   - Se o usuário tem permissão
   - Se o plano permite criar mais membros (checkPlanLimit - **não implementado ainda**)
   - Se a branch pertence à igreja do admin
3. **Sistema cria**:
   - ✅ `Member` com:
     - `role: MEMBER` (padrão) ou role especificado
     - `branchId: branch.id`
     - Permissões conforme role ou especificadas

**Código**:

```typescript
// backend/src/services/auth/registerService.ts
export async function registerUserService(data: RegisterUserInput) {
  const {
    name,
    email,
    password,
    branchId,
    role,
    permissions,
    // ... outros campos
    fromLandingPage,
  } = data

  const hashedPassword = await bcrypt.hash(password, 10)

  // Se for landing page → cria User (já tratado no fluxo A)
  if (fromLandingPage) {
    // ... código do fluxo A
  }

  // Caso seja criação de membro interno
  let finalRole = role
  if (!finalRole) {
    // Lógica antiga (não recomendada)
    const churchesCount = await prisma.church.count()
    finalRole = churchesCount === 0 ? Role.ADMINGERAL : Role.ADMINFILIAL
  }

  // Cria Member
  const member = await prisma.member.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: finalRole,
      branchId: branchId!,
      // ... outros campos
    },
  })

  // Adiciona permissões
  const typesToAssign =
    finalRole === Role.ADMINGERAL || finalRole === Role.ADMINFILIAL
      ? ALL_PERMISSION_TYPES
      : permissions ?? []

  if (typesToAssign.length > 0) {
    const perms = await prisma.permission.findMany({
      where: { type: { in: typesToAssign } },
    })

    await prisma.member.update({
      where: { id: member.id },
      data: {
        permissions: {
          connect: perms.map((p) => ({ id: p.id })),
        },
      },
    })
  }

  return member
}
```

**⚠️ Problemas Identificados**:

1. **Falta validação de autorização**: Não verifica se o usuário logado tem permissão para criar membros
2. **Falta validação de branch**: Não verifica se a branch pertence à igreja do admin
3. **Falta validação de role**: Não verifica se o admin pode atribuir o role especificado
4. **Falta validação de limite de plano**: Não verifica `maxMembers` do plano

---

## 🛡️ Regras de Segurança e Hierarquia

### Regras de Criação de Membros

| Quem Cria | Pode Criar Role | Pode Criar em Branch |
|-----------|----------------|---------------------|
| ADMINGERAL | MEMBER, COORDINATOR, ADMINFILIAL | Qualquer branch da igreja |
| ADMINFILIAL | MEMBER, COORDINATOR | Apenas sua branch |
| COORDINATOR | MEMBER (se tiver `members_manage`) | Apenas sua branch |
| MEMBER | ❌ Nenhum | ❌ Nenhum |

### Regras de Atribuição de Roles

1. **ADMINGERAL não pode criar outro ADMINGERAL**: Apenas o sistema pode criar ADMINGERAL (durante criação de igreja)
2. **ADMINFILIAL não pode criar ADMINGERAL**: Não pode criar role superior
3. **MEMBER não pode atribuir roles**: Não tem permissão para criar usuários

### Regras de Edição

1. **ADMINGERAL pode editar**:
   - ✅ Qualquer membro de qualquer filial da igreja
   - ✅ Qualquer filial da igreja
   - ✅ Dados da igreja

2. **ADMINFILIAL pode editar**:
   - ✅ Apenas membros da sua filial
   - ✅ Apenas eventos/finanças da sua filial

3. **COORDINATOR pode editar**:
   - ✅ Apenas recursos que tem permissão específica

4. **MEMBER pode editar**:
   - ✅ Apenas seu próprio perfil

### Validações Necessárias (Não Implementadas)

1. ✅ Verificar se `branchId` pertence à igreja do admin
2. ✅ Verificar se o admin pode atribuir o `role` especificado
3. ✅ Verificar se o plano permite criar mais membros (`maxMembers`)
4. ✅ Verificar se o plano permite criar mais branches (`maxBranches`)

---

## 🔑 JWT e Autorização

### Estrutura do Token JWT

**Localização**: `backend/src/services/auth/loginService.ts`

```typescript
const tokenPayload = {
  userId: user.id,           // ID do User
  email: user.email,
  memberId: user.member?.id ?? null,
  role: user.member?.role ?? null,
  branchId: user.member?.branchId ?? null,
  permissions: user.member?.permissions.map(p => p.type) ?? [],
}

const token = app.jwt.sign(tokenPayload, { sub: user.id, expiresIn: '7d' })
```

### Payload do Token

```json
{
  "sub": "user_id",
  "userId": "user_id",
  "email": "user@example.com",
  "memberId": "member_id",
  "role": "ADMINGERAL",
  "branchId": "branch_id",
  "permissions": ["events_manage", "devotionals_manage", ...],
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Middleware de Autenticação

**Localização**: `backend/src/middlewares/authenticate.ts`

```typescript
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ message: 'Token ausente' })
  }

  const token = authHeader.replace('Bearer ', '')

  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      sub: string
      email: string
      permissions: string[]
    }

    request.user = {
      id: payload.sub,
      email: payload.email,
      type: payload.type, // 'user' ou 'member'
      permissions: payload.permissions || [],
    }
  } catch (error) {
    return reply.status(401).send({ message: 'Token inválido' })
  }
}
```

### Middlewares de Autorização

#### 1. checkRole

**Localização**: `backend/src/middlewares/checkRole.ts`

```typescript
export function checkRole(required: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;

    const hasRole = user?.role && required.includes(user.role)
    const hasPermission = user?.permissions && user.permissions.some((p: string) => required.includes(p))

    if (!hasRole && !hasPermission) {
      return reply.code(403).send({ message: 'Acesso negado' })
    }
  }
}
```

#### 2. authorize

**Localização**: `backend/src/middlewares/authorize.ts`

```typescript
export function authorize(allowedRoles: string[]) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    const user = request.user;

    if (!user || !allowedRoles.includes(user.role)) {
      return reply.status(403).send({ error: 'Acesso não autorizado' });
    }
  };
}
```

#### 3. checkPermission

**Localização**: `backend/src/middlewares/checkPermission.ts`

```typescript
export function checkPermission(requiredPermissions: string[]) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        const user = request.user as any;

        if (!user.permissions || !Array.isArray(user.permissions)) {
            return reply.code(403).send({ message: 'Permissões não carregadas.' });
        }

        const hasPermission = requiredPermissions.every(permission =>
            user.permissions.includes(permission)
        );

        if (!hasPermission) {
            return reply.code(403).send({ message: 'Acesso negado: Permissão insuficiente.' });
        }
    };
}
```

---

## 📊 Limites de Plano

### Estrutura

Os limites são definidos no modelo `Plan`:

```prisma
model Plan {
  maxMembers    Int?  // null = ilimitado
  maxBranches   Int?  // null = ilimitado
}
```

### Plano Free (Padrão)

```typescript
{
  name: 'free',
  maxBranches: 1,
  maxMembers: 20,
}
```

### Validação de Limites

**⚠️ NÃO IMPLEMENTADO AINDA**

A validação de limites deve ser feita antes de criar:

1. **Membros**: Verificar se `count(members)` < `plan.maxMembers`
2. **Branches**: Verificar se `count(branches)` < `plan.maxBranches`

**Implementação Sugerida**:

```typescript
async function checkPlanLimit(userId: string, limitType: 'members' | 'branches') {
  // 1. Buscar User e Subscription ativa
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscriptions: {
        where: { status: 'active' },
        include: { plan: true },
      },
      member: {
        include: {
          branch: {
            include: { church: true },
          },
        },
      },
    },
  })

  if (!user?.subscriptions[0]?.plan) {
    throw new Error('Plano não encontrado')
  }

  const plan = user.subscriptions[0].plan
  const churchId = user.member?.branch.churchId

  if (!churchId) {
    throw new Error('Igreja não encontrada')
  }

  // 2. Contar recursos existentes
  if (limitType === 'members') {
    const branches = await prisma.branch.findMany({
      where: { churchId },
      include: { _count: { select: { members: true } } },
    })

    const totalMembers = branches.reduce((sum, b) => sum + b._count.members, 0)

    if (plan.maxMembers && totalMembers >= plan.maxMembers) {
      throw new Error('Limite do plano atingido: máximo de membros excedido')
    }
  } else if (limitType === 'branches') {
    const branchesCount = await prisma.branch.count({
      where: { churchId },
    })

    if (plan.maxBranches && branchesCount >= plan.maxBranches) {
      throw new Error('Limite do plano atingido: máximo de filiais excedido')
    }
  }
}
```

---

## 🔧 Implementação Técnica

### Arquivos Principais

#### Backend

1. **Modelos**:
   - `backend/prisma/schema.prisma` - Schema do banco de dados

2. **Services**:
   - `backend/src/services/auth/registerService.ts` - Criação de membros
   - `backend/src/services/public/publicRegisterService.ts` - Registro público
   - `backend/src/services/churchService.ts` - Criação de igreja
   - `backend/src/services/auth/loginService.ts` - Login e JWT

3. **Controllers**:
   - `backend/src/controllers/auth/registerController.ts` - Controller de registro
   - `backend/src/controllers/public/publicRegisterController.ts` - Controller de registro público
   - `backend/src/controllers/churchController.ts` - Controller de igreja

4. **Middlewares**:
   - `backend/src/middlewares/authenticate.ts` - Autenticação JWT
   - `backend/src/middlewares/authorize.ts` - Autorização por role
   - `backend/src/middlewares/checkRole.ts` - Verificação de role
   - `backend/src/middlewares/checkPermission.ts` - Verificação de permissão

5. **Constants**:
   - `backend/src/constants/permissions.ts` - Tipos de permissões

#### Frontend (Web)

1. **Stores**:
   - `web/src/stores/authStore.ts` - Estado de autenticação

2. **Pages**:
   - `web/src/pages/Members/AddMember.tsx` - Formulário de criação de membro

#### Mobile

1. **Stores**:
   - `mobile/src/stores/authStore.ts` - Estado de autenticação

2. **Utils**:
   - `mobile/src/utils/authUtils.ts` - Utilitários de autorização

---

## ✅ Checklist de Implementação

### Funcionalidades Implementadas

- [x] Modelo de dados (Church, Branch, Member, User, Permission, Plan)
- [x] Enum de Roles (MEMBER, COORDINATOR, ADMINFILIAL, ADMINGERAL)
- [x] Sistema de permissões granulares
- [x] Registro público (criação de User com plano Free)
- [x] Criação de igreja com admin geral
- [x] Criação de membros internos
- [x] Login com JWT
- [x] Middlewares de autenticação e autorização
- [x] Atribuição automática de permissões para ADMINGERAL e ADMINFILIAL

### Funcionalidades Pendentes

- [ ] Validação de autorização na criação de membros
- [ ] Validação de branch (verificar se pertence à igreja)
- [ ] Validação de role (verificar se pode atribuir)
- [ ] Validação de limite de plano (maxMembers, maxBranches)
- [ ] Validação de hierarquia (ADMINFILIAL não pode criar ADMINGERAL)
- [ ] Validação de permissão `members_manage` para COORDINATOR
- [ ] Associação automática de churchId ao criar membro
- [ ] Filtro de membros por filial (ADMINFILIAL só vê sua filial)

---

## 📝 Notas Importantes

1. **Duplicação de Autenticação**: O sistema possui dois modelos (`User` e `Member`) que podem autenticar. O `User` é usado para registro público, e o `Member` é usado para membros da igreja.

2. **Relacionamento User-Member**: Um `User` pode estar associado a um `Member` através do campo `userId` no modelo `Member`. Isso acontece quando um `User` cria uma igreja e se torna `ADMINGERAL`.

3. **Permissões vs Roles**: As permissões são atribuídas automaticamente para `ADMINGERAL` e `ADMINFILIAL`, mas podem ser atribuídas manualmente para `COORDINATOR` e `MEMBER`.

4. **Limites de Plano**: Os limites são definidos no `Plan`, mas a validação ainda não está implementada. É necessário implementar a função `checkPlanLimit` antes de criar membros ou branches.

5. **Segurança**: Muitas validações de segurança ainda não estão implementadas. É importante implementá-las antes de colocar em produção.

---

## 🚀 Próximos Passos

1. Implementar validações de segurança na criação de membros
2. Implementar validação de limites de plano
3. Implementar filtros por filial para ADMINFILIAL
4. Adicionar testes unitários e de integração
5. Documentar APIs com Swagger/OpenAPI
6. Implementar auditoria de ações administrativas

---

**Documentação criada em**: 2025-01-27
**Versão do Sistema**: 1.0.0
**Autor**: IA Especialista em Autenticação e Autorização

