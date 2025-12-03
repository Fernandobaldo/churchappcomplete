# ⏰ Gerenciamento de Horários de Culto

Este documento descreve a funcionalidade de gerenciamento de horários de culto no ChurchPulse.

## 📋 Visão Geral

O sistema permite que usuários com permissões adequadas configurem horários padrão de cultos por filial, definam horários padrão e criem eventos automaticamente ou manualmente a partir desses horários.

## 🔐 Permissões

Para gerenciar horários de culto, o usuário precisa ter a permissão `church_manage`:

- **ADMINGERAL** e **ADMINFILIAL**: Têm acesso automático
- **COORDINATOR**: Precisa ter a permissão `church_manage` atribuída

## 📊 Estrutura de Dados

### Modelo ServiceSchedule

```prisma
model ServiceSchedule {
  id                  String    @id @default(cuid())
  branchId            String
  dayOfWeek           Int       // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  time                String    // Formato HH:mm
  title               String
  description         String?
  location            String?
  isDefault           Boolean   @default(false)
  autoCreateEvents    Boolean   @default(false)
  autoCreateDaysAhead Int?      // Quantos dias à frente criar eventos (padrão: 90)
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  Branch              Branch    @relation(fields: [branchId], references: [id], onDelete: Cascade)
}
```

### Campos

- **branchId**: ID da filial à qual o horário pertence
- **dayOfWeek**: Dia da semana (0-6, onde 0 = Domingo)
- **time**: Horário no formato HH:mm (ex: "10:00", "19:30")
- **title**: Título do culto (ex: "Culto Dominical", "Escola Bíblica")
- **description**: Descrição opcional do culto
- **location**: Localização opcional (ex: "Templo Principal", "Online")
- **isDefault**: Indica se é o horário padrão da filial (apenas um por filial)
- **autoCreateEvents**: Se true, eventos são criados automaticamente
- **autoCreateDaysAhead**: Quantos dias à frente criar eventos automaticamente (padrão: 90)

## 🚀 API Endpoints

### Criar Horário de Culto

```http
POST /service-schedules
Authorization: Bearer <token>
Content-Type: application/json

{
  "branchId": "branch-123",
  "dayOfWeek": 0,
  "time": "10:00",
  "title": "Culto Dominical",
  "description": "Culto de domingo",
  "location": "Templo Principal",
  "isDefault": false,
  "autoCreateEvents": true,
  "autoCreateDaysAhead": 90
}
```

**Permissões**: `church_manage` (ADMINGERAL, ADMINFILIAL, COORDINATOR)

### Listar Horários por Filial

```http
GET /service-schedules/branch/:branchId
Authorization: Bearer <token>
```

**Permissões**: Qualquer usuário autenticado

### Obter Horário por ID

```http
GET /service-schedules/:id
Authorization: Bearer <token>
```

**Permissões**: Qualquer usuário autenticado

### Atualizar Horário

```http
PUT /service-schedules/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Culto Dominical Atualizado",
  "time": "11:00"
}
```

**Permissões**: `church_manage` (ADMINGERAL, ADMINFILIAL, COORDINATOR)

### Deletar Horário

```http
DELETE /service-schedules/:id
Authorization: Bearer <token>
```

**Permissões**: `church_manage` (ADMINGERAL, ADMINFILIAL, COORDINATOR)

### Definir como Padrão

```http
PATCH /service-schedules/:id/set-default
Authorization: Bearer <token>
```

**Permissões**: `church_manage` (ADMINGERAL, ADMINFILIAL, COORDINATOR)

**Comportamento**: Remove o padrão anterior da mesma filial e define o novo como padrão.

### Criar Eventos a Partir do Horário

```http
POST /service-schedules/:id/create-events
Authorization: Bearer <token>
Content-Type: application/json

{
  "startDate": "2024-01-01",  // Opcional (ISO ou dd/MM/yyyy)
  "endDate": "2024-03-31",    // Opcional (ISO ou dd/MM/yyyy)
  "daysAhead": 90             // Opcional (usa autoCreateDaysAhead do schedule se não fornecido)
}
```

**Permissões**: `church_manage` e `events_manage` (ADMINGERAL, ADMINFILIAL, COORDINATOR)

**Comportamento**: Cria eventos no calendário para todas as ocorrências do horário no período especificado, evitando duplicatas.

## 💻 Uso no Frontend

### Web

Acesse **Configurações da Igreja** (`/app/church-settings`) para:

1. Editar informações da igreja (nome, logo)
2. Gerenciar horários de culto da filial
3. Adicionar, editar ou deletar horários
4. Definir horário padrão
5. Criar eventos manualmente a partir de horários

### Mobile

Acesse **Mais > Configurações da Igreja** para:

1. Editar informações da igreja
2. Gerenciar horários de culto
3. Adicionar ou editar horários

## 🔄 Criação Automática de Eventos

Quando `autoCreateEvents` está ativado, o sistema pode criar eventos automaticamente:

1. **Manual**: Use o botão "Criar Eventos" na interface para criar eventos imediatamente
2. **Automático** (Futuro): Um job/cron executará diariamente e criará eventos para horários com `autoCreateEvents: true`

### Lógica de Criação

- Calcula todas as datas que correspondem ao `dayOfWeek` entre `startDate` e `endDate`
- Verifica se já existe um evento na mesma data e horário antes de criar
- Cria eventos com o título, descrição e localização do horário

## 📝 Exemplos de Uso

### Exemplo 1: Culto Dominical Padrão

```json
{
  "branchId": "branch-123",
  "dayOfWeek": 0,
  "time": "10:00",
  "title": "Culto Dominical",
  "description": "Culto de domingo pela manhã",
  "location": "Templo Principal",
  "isDefault": true,
  "autoCreateEvents": true,
  "autoCreateDaysAhead": 90
}
```

### Exemplo 2: Escola Bíblica Semanal

```json
{
  "branchId": "branch-123",
  "dayOfWeek": 3,
  "time": "19:30",
  "title": "Escola Bíblica",
  "description": "Estudo bíblico semanal",
  "location": "Salão de Reuniões",
  "isDefault": false,
  "autoCreateEvents": false
}
```

## 🧪 Testes

Execute os testes do backend:

```bash
cd backend
npm test serviceScheduleService
npm test serviceSchedule
```

## 📚 Referências

- [Schema Prisma](../prisma/schema.prisma)
- [ServiceScheduleService](../src/services/serviceScheduleService.ts)
- [ServiceScheduleController](../src/controllers/serviceScheduleController.ts)
- [Rotas](../src/routes/serviceScheduleRoutes.ts)








