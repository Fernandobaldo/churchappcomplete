# Checklist Pré-Deploy

Este documento contém verificações essenciais que devem ser realizadas antes de fazer deploy em produção.

## Verificação de Planos

Antes de fazer deploy em produção, verificar que planos existem:

```sql
SELECT code, name, "maxMembers", "maxBranches" FROM "Plan" WHERE code = 'FREE';
```

**Resultado esperado:** Deve retornar pelo menos uma linha com:
- `code`: 'FREE'
- `name`: 'free' (ou variação)
- `maxMembers`: número (ex: 20)
- `maxBranches`: número (ex: 1)

Se não retornar resultados, executar seed:

```bash
cd backend
npm run seed
```

**Importante:** 
- Em produção, planos sempre existem (DB não é resetado). 
- Este checklist é para garantir antes do primeiro deploy.
- Após o primeiro deploy, planos devem ser gerenciados via interface administrativa ou migrations.

## Outras Verificações

### Variáveis de Ambiente
- [ ] `DATABASE_URL` configurada corretamente
- [ ] `JWT_SECRET` definida e segura
- [ ] `EXPO_PUBLIC_API_URL` configurada no mobile (se aplicável)
- [ ] Outras variáveis específicas do ambiente configuradas

### Banco de Dados
- [ ] Migrations aplicadas (`npx prisma migrate deploy`)
- [ ] Schema do banco está sincronizado com `schema.prisma`
- [ ] Seed executado (se necessário para dados iniciais)

### Testes
- [ ] Testes unitários passando (`npm test`)
- [ ] Testes de integração passando (se aplicável)
- [ ] Testes E2E passando (se aplicável)

### Health Check (Opcional)
Se houver endpoint de health check implementado:
- [ ] Health check retorna status 200
- [ ] Health check valida existência de planos (se implementado)

### Mobile App
- [ ] Variáveis de ambiente configuradas no `app.config.js` ou `.env`
- [ ] Build de produção gerado e testado
- [ ] Navegação e guards funcionando corretamente

### Backend
- [ ] Servidor inicia sem erros
- [ ] Rotas de autenticação funcionando
- [ ] Validação de limites de plano funcionando
- [ ] Interceptors de erro configurados corretamente

---

## Notas

- Este checklist deve ser revisado antes de cada deploy em produção
- Adicione verificações específicas do seu ambiente conforme necessário
- Documente qualquer problema encontrado durante a verificação

