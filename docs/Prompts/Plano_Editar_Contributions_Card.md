# 📋 Plano: Mover Botão de Editar do Detail para o Card na Lista de Contributions

## 🔍 Análise da Situação Atual

### Mobile

**Arquivo:** `mobile/src/screens/ContributionsScreen.tsx`
- **Situação:** Cards na lista não têm botão de editar
- **Estrutura atual do card:**
  - Título, descrição, meta, arrecadado
  - Botão "Contribuir" que navega para `ContributionDetail`
  - Não há botão de editar no card

**Arquivo:** `mobile/src/screens/ContributionDetailScreen.tsx`
- **Situação:** Botão de editar está no header (rightButtonIcon)
- **Linhas 127-132:**
```typescript
rightButtonIcon: hasPermissionToEdit && contribution ? (
    <Ionicons name="create-outline" size={24} color="white" />
) : undefined,
onRightButtonPress: hasPermissionToEdit && contribution
    ? () => (navigation as any).navigate('EditContributionScreen', { id: contribution.id })
    : undefined,
```

### Web

**Arquivo:** `web/src/pages/Contributions/index.tsx`
- **Situação:** Lista em formato de tabela, não cards
- **Estrutura atual:**
  - Tabela com colunas: Título, Meta, Arrecadado, Status, Ações
  - Coluna "Ações" tem apenas "Ver Detalhes"
  - Não há botão de editar na lista

**Arquivo:** `web/src/pages/Contributions/ContributionDetails.tsx`
- **Situação:** Botão de editar está na página de detalhes
- **Linhas 102-108:**
```typescript
<PermissionGuard permission="contributions_manage">
  <button
    onClick={() => navigate(`/app/contributions/${id}/edit`)}
    className="px-4 py-2 rounded-lg font-medium bg-primary text-white hover:bg-primary-dark flex items-center gap-2"
  >
    Editar
  </button>
</PermissionGuard>
```

---

## ✅ Objetivo

Mover o botão de editar Contributions:
- **DE:** Página de detalhes (ContributionDetailScreen/ContributionDetails)
- **PARA:** Card/Tabela na página de lista (ContributionsScreen/index.tsx)

---

## 📝 Plano de Implementação

### Mobile (ContributionsScreen.tsx)

#### 1. Adicionar botão de editar no card
- **Onde:** Dentro do `renderItem` do FlatList, no card de cada contribution
- **Posicionamento:** 
  - Opção A: Ao lado do título (dentro do `titleRow`)
  - Opção B: Ao lado do botão "Contribuir" (nova linha de botões)
  - **Recomendação:** Opção A (ícone de editar ao lado do título, similar a outras features)

#### 2. Implementação
- Adicionar ícone de editar (Ionicons `create-outline`) no `titleRow`
- Condicionar a exibição à permissão `canManageContributions`
- Ao pressionar, navegar para `EditContributionScreen` com `{ id: item.id }`
- Usar `TouchableOpacity` para o ícone

#### 3. Remover botão de editar do DetailScreen
- **Arquivo:** `mobile/src/screens/ContributionDetailScreen.tsx`
- **Ação:** Remover `rightButtonIcon` e `onRightButtonPress` do headerProps (linhas 127-132)
- Manter apenas o título no header

### Web (Contributions/index.tsx)

#### 1. Adicionar botão de editar na tabela
- **Onde:** Na coluna "Ações" (já existe)
- **Implementação:**
  - Adicionar botão "Editar" ao lado de "Ver Detalhes"
  - Usar `PermissionGuard` com permissão `contributions_manage`
  - Navegar para `/app/contributions/${contribution.id}/edit`

#### 2. Remover botão de editar do Detail
- **Arquivo:** `web/src/pages/Contributions/ContributionDetails.tsx`
- **Ação:** Remover o botão "Editar" (linhas 102-108)
- Manter apenas o botão "Ativar/Desativar Campanha"

---

## 🔧 Detalhes Técnicos

### Mobile - Mudanças no Card

**Arquivo:** `mobile/src/screens/ContributionsScreen.tsx`

**Localização do código:**
- Linha 179-230: `renderItem` do FlatList

**Mudança necessária:**
```typescript
// Dentro do titleRow, adicionar ícone de editar (se tiver permissão)
<View style={styles.titleRow}>
    <Text style={styles.title}>{item.title}</Text>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {canManageContributions && (
            <TouchableOpacity
                onPress={(e) => {
                    e.stopPropagation()
                    ;(navigation as any).navigate('EditContributionScreen', { id: item.id })
                }}
                activeOpacity={0.7}
                style={styles.editButton}
            >
                <Ionicons name="create-outline" size={20} color={colors.gradients.primary[1]} />
            </TouchableOpacity>
        )}
        <View style={[...statusBadge styles...]}>
            ...
        </View>
    </View>
</View>
```

**Estilo necessário:**
- Adicionar `editButton` aos styles (opcional, pode usar inline)

### Web - Mudanças na Tabela

**Arquivo:** `web/src/pages/Contributions/index.tsx`

**Localização do código:**
- Coluna "Ações" na tabela (linha ~154-161)

**Mudança necessária:**
```typescript
<td className="py-3 px-4">
  <div className="flex gap-2">
    <PermissionGuard permission="contributions_manage">
      <button
        onClick={(e) => {
          e.stopPropagation()
          navigate(`/app/contributions/${contribution.id}/edit`)
        }}
        className="text-primary hover:underline text-sm"
      >
        Editar
      </button>
    </PermissionGuard>
    <button
      onClick={() => navigate(`/app/contributions/${contribution.id}`)}
      className="text-primary hover:underline text-sm"
    >
      Ver Detalhes
    </button>
  </div>
</td>
```

---

## 📊 Comparação com Outras Features

### Events (Referência)

**Mobile (EventsScreen.tsx):**
- Cards na lista NÃO têm botão de editar
- EventDetailsScreen tem botão no header (similar ao atual de Contributions)

**Web (Events/index.tsx):**
- Cards na lista NÃO têm botão de editar
- EventDetails tem botão de editar

**Conclusão:** Contributions está seguindo o padrão de Events atualmente. A mudança solicitada é um ajuste específico para Contributions.

---

## ⚠️ Considerações

1. **Prevenção de propagação:** No mobile, o card inteiro pode ser clicável (se houver `onPress` no GlassCard). O botão de editar deve usar `e.stopPropagation()` para evitar navegar para detalhes.

2. **Permissões:** Manter a verificação de permissão (`canManageContributions` no mobile, `PermissionGuard` no web).

3. **Navegação:** 
   - Mobile: `EditContributionScreen` com `{ id: item.id }`
   - Web: `/app/contributions/${id}/edit`

4. **Mínimo de mudanças:** 
   - Adicionar botão no card/lista
   - Remover botão do detail
   - Não refatorar código existente além do necessário

---

## 📋 Checklist de Implementação

### Mobile
- [ ] Adicionar botão de editar no card (ContributionsScreen.tsx)
- [ ] Adicionar estilo para o botão (se necessário)
- [ ] Remover botão de editar do header (ContributionDetailScreen.tsx)
- [ ] Testar navegação e permissões
- [ ] Ajustar/criar testes

### Web
- [ ] Adicionar botão "Editar" na coluna Ações (index.tsx)
- [ ] Remover botão "Editar" da página de detalhes (ContributionDetails.tsx)
- [ ] Testar navegação e permissões
- [ ] Ajustar/criar testes

---

**Data do Plano:** 2025-01-27  
**Criado por:** AI Assistant  
**Status:** Pronto para implementação

