# Ajuste do Mock para Import Dinâmico

## Problema

O mock do `serviceScheduleApi` não está funcionando corretamente quando o código usa `await import('@/api/serviceScheduleApi')` (import dinâmico).

## Solução Atual

Foi implementado usando `vi.hoisted()` para garantir que as funções mockadas sejam criadas antes do hoisting:

```typescript
const mockServiceScheduleApi = vi.hoisted(() => ({
  getByBranch: vi.fn(),
  getRelatedEventsCount: vi.fn(),
  delete: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  setDefault: vi.fn(),
  createEvents: vi.fn(),
}))

vi.mock('@/api/serviceScheduleApi', () => {
  return {
    serviceScheduleApi: mockServiceScheduleApi,
    ServiceSchedule: {} as any,
  }
})
```

## O que ainda precisa ser ajustado

1. **Verificar se o Vitest está aplicando o mock para imports dinâmicos**
   - O Vitest pode precisar de configuração adicional para mocks de imports dinâmicos
   - Verificar a documentação do Vitest sobre `vi.mock` e imports dinâmicos

2. **Possível solução alternativa: usar `vi.spyOn`**
   - Em vez de mockar todo o módulo, pode ser necessário usar `vi.spyOn` no objeto real
   - Isso pode funcionar melhor com imports dinâmicos

3. **Verificar configuração do Vitest**
   - Adicionar configuração no `vitest.config.ts` se necessário
   - Verificar se há alguma opção relacionada a mocks de imports dinâmicos

4. **Testar com `vi.importActual`**
   - Usar `vi.importActual` para importar o módulo real e então aplicar o mock
   - Isso pode garantir que o mock seja aplicado corretamente

## Próximos Passos

1. Verificar a documentação do Vitest sobre mocks de imports dinâmicos
2. Testar usar `vi.spyOn` em vez de `vi.mock`
3. Verificar se há alguma configuração necessária no `vitest.config.ts`
4. Considerar refatorar o código para usar import estático em vez de dinâmico (se possível)







