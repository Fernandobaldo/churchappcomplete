# 🚀 Resumo Rápido: Autenticação e Autorização - ChurchPulse

## 📋 Estrutura Organizacional

```
Igreja (Church)
  └── Filial (Branch) - Sede
      └── Membro (Member)
```

## 👥 Hierarquia de Roles

| Role | Nível | Pode Criar Membros | Pode Criar Filiais | Permissões |
|------|-------|-------------------|-------------------|------------|
| **ADMINGERAL** | 4/4 | ✅ Qualquer filial | ✅ Sim | Todas automáticas |
| **ADMINFILIAL** | 3/4 | ✅ Apenas sua filial | ❌ Não | Todas automáticas |
| **COORDINATOR** | 2/4 | ⚠️ Se tiver `members_manage` | ❌ Não | Conforme atribuídas |
| **MEMBER** | 1/4 | ❌ Não | ❌ Não | Conforme atribuídas |

## 🔐 Permissões Disponíveis

- `devotional_manage` - Gerenciar devocionais
- `members_view` - Visualizar membros
- `events_manage` - Gerenciar eventos
- `contributions_manage` - Gerenciar contribuições
- `finances_manage` - Gerenciar finanças

## 🔄 Fluxos de Criação

### 1. Registro Público (Landing Page)
```
POST /public/register
→ Cria User + Subscription (Free)
→ Retorna JWT
```

### 2. Criação de Igreja
```
POST /churches (User logado)
→ Cria Church + Branch (Sede) + Member (ADMINGERAL)
→ Vincula Member ao User
```

### 3. Criação de Membro Interno
```
POST /register (Admin logado)
→ Valida permissões
→ Cria Member na Branch especificada
→ Atribui role e permissões
```

## 🛡️ Regras de Segurança

### Quem Pode Criar Membros

| Criador | Pode Criar Role | Pode Criar em Branch |
|---------|----------------|---------------------|
| ADMINGERAL | MEMBER, COORDINATOR, ADMINFILIAL | Qualquer branch da igreja |
| ADMINFILIAL | MEMBER, COORDINATOR | Apenas sua branch |
| COORDINATOR | MEMBER (se tiver `members_manage`) | Apenas sua branch |
| MEMBER | ❌ Nenhum | ❌ Nenhum |

### Regras Importantes

1. ❌ **ADMINGERAL não pode criar outro ADMINGERAL** (apenas sistema)
2. ❌ **ADMINFILIAL não pode criar ADMINGERAL**
3. ❌ **MEMBER não pode atribuir roles**
4. ✅ **ADMINGERAL pode editar qualquer membro da igreja**
5. ✅ **ADMINFILIAL pode editar apenas membros da sua filial**

## 📊 Limites de Plano

### Plano Free (Padrão)
- **maxBranches**: 1
- **maxMembers**: 20

### Validação
⚠️ **NÃO IMPLEMENTADO AINDA** - Verificar antes de criar:
- Membros: `count(members)` < `plan.maxMembers`
- Branches: `count(branches)` < `plan.maxBranches`

## 🔑 JWT Token

### Payload
```json
{
  "sub": "user_id",
  "userId": "user_id",
  "email": "user@example.com",
  "memberId": "member_id",
  "role": "ADMINGERAL",
  "branchId": "branch_id",
  "permissions": ["events_manage", ...]
}
```

## 📁 Arquivos Principais

### Backend
- `backend/prisma/schema.prisma` - Modelos
- `backend/src/services/auth/registerService.ts` - Criação de membros
- `backend/src/services/churchService.ts` - Criação de igreja
- `backend/src/middlewares/authenticate.ts` - Autenticação
- `backend/src/constants/permissions.ts` - Permissões

### Frontend
- `web/src/stores/authStore.ts` - Estado de autenticação
- `web/src/pages/Members/AddMember.tsx` - Formulário

## ⚠️ Validações Pendentes

- [ ] Verificar se `branchId` pertence à igreja do admin
- [ ] Verificar se admin pode atribuir o `role` especificado
- [ ] Verificar limite de plano (`maxMembers`, `maxBranches`)
- [ ] Verificar hierarquia (ADMINFILIAL não pode criar ADMINGERAL)
- [ ] Verificar permissão `members_manage` para COORDINATOR
- [ ] Associação automática de `churchId` ao criar membro
- [ ] Filtro de membros por filial (ADMINFILIAL só vê sua filial)

## 📚 Documentação Completa

Para mais detalhes, consulte: `DOCUMENTACAO_AUTENTICACAO_AUTORIZACAO.md`

