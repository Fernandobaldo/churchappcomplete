# Testes de integração — ChurchPulse Mobile

Este diretório é o **local oficial** para testes de integração (screen + componentes + store + navegação simulada + API mockada).

## O que é “integração” neste projeto

- Exercita o comportamento do usuário (digitar, clicar, navegar)
- Mocka bordas (API, storage, permissões) para manter o teste previsível
- Valida renderizações, validações e side-effects (ex.: chamadas para `api.post` e mensagens via Toast)

## Convenções

- Arquivos: `*.test.tsx`
- Organização por feature ou por screen:
  - `auth/LoginFlow.test.tsx`
  - `events/CreateEventFlow.test.tsx`
  - `members/RegisterMemberFlow.test.tsx`

## Checklist de um bom teste de integração

- [ ] Setup claro: mocks do `api`, `useNavigation`, `useRoute` quando necessário
- [ ] Interações reais: `fireEvent.changeText`, `fireEvent.press`
- [ ] Assíncrono correto: `await waitFor(...)` para atualizar UI e promessas
- [ ] Assert útil: UI + chamada de API + mensagens de erro/sucesso
- [ ] Sem dependência de ordem entre testes (reset em `beforeEach`)

## Padrão de mocking recomendado

- API: `jest.mock('@/api/api')` e controle com `mockResolvedValue`/`mockRejectedValue`
- Navegação:
  - `useNavigation`: retornar `{ navigate: jest.fn(), goBack: jest.fn() }`
  - `useRoute`: retornar `{ params: {...} }` quando necessário
- Toast: `jest.mock('react-native-toast-message', () => ({ show: jest.fn() }))`

