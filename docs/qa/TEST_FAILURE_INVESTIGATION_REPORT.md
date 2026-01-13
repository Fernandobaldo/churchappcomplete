# Web Unit Test Failure Investigation Report

Date: 2026-01-12
Command: cd web; .\node_modules\.bin\vitest run src\__tests__\unit --reporter verbose --no-color
Scope: web unit tests only
Result: Test Files 11 failed | 33 passed (44). Tests 26 failed | 244 passed (270). Errors 4.

---

## Summary table (failed tests)

| Test file | Test name | Symptom | Classification |
| --- | --- | --- | --- |
| `src/__tests__/unit/pages/Contributions.test.tsx` | File parse error | Transform failed: Unexpected "}" (line 220) | STANDARDIZATION |
| `src/__tests__/unit/pages/AddContribution.test.tsx` | deve criar campanha com sucesso | Toast text mismatch | STANDARDIZATION |
| `src/__tests__/unit/pages/AddDevotional.test.tsx` | deve exibir loading durante criacao | Submit button not disabled | STANDARDIZATION |
| `src/__tests__/unit/pages/ChurchSettings.test.tsx` | deve renderizar o formulario de edicao da igreja | Page shows "Igreja nao encontrada"; label not found | STANDARDIZATION |
| `src/__tests__/unit/pages/ChurchSettings.test.tsx` | deve carregar e exibir os dados da igreja | Label not found; church data undefined | STANDARDIZATION |
| `src/__tests__/unit/pages/ChurchSettings.test.tsx` | deve exibir botao para adicionar horario | Button not found (church data missing) | STANDARDIZATION |
| `src/__tests__/unit/pages/DevotionalDetails.test.tsx` | deve curtir devocional com sucesso | Unhandled error: devotional.author.name undefined | STANDARDIZATION |
| `src/__tests__/unit/pages/DevotionalDetails.test.tsx` | deve navegar para lista ao clicar em Voltar | Unhandled error: devotional.author.name undefined | STANDARDIZATION |
| `src/__tests__/unit/pages/EditTransaction.test.tsx` | deve carregar dados da transacao existente | document.getElementById('title') is null | STANDARDIZATION |
| `src/__tests__/unit/pages/EditTransaction.test.tsx` | deve preencher campos de transacao de saida com exitType | Reading value of null element | STANDARDIZATION |
| `src/__tests__/unit/pages/EditTransaction.test.tsx` | deve atualizar transacao com sucesso | document.getElementById('title') is null | STANDARDIZATION |
| `src/__tests__/unit/pages/EditTransaction.test.tsx` | deve exibir erro quando falha ao atualizar | document.getElementById('title') is null | STANDARDIZATION |
| `src/__tests__/unit/pages/EditTransaction.test.tsx` | deve preencher campos de transacao com tipo CONTRIBUICAO | Reading value of null element | STANDARDIZATION |
| `src/__tests__/unit/pages/MemberDetails.test.tsx` | deve renderizar detalhes do membro | Unhandled error: positions.map on null | STANDARDIZATION |
| `src/__tests__/unit/pages/Profile.test.tsx` | deve carregar cargos disponiveis | positions load fails; text not found | STANDARDIZATION |
| `src/__tests__/unit/pages/Profile.test.tsx` | deve atualizar perfil com sucesso | mockUpdateUser not called | STANDARDIZATION |
| `src/__tests__/unit/pages/Profile.test.tsx` | deve permitir fazer upload de avatar | api.post not called | STANDARDIZATION |
| `src/__tests__/unit/pages/Register.test.tsx` | deve renderizar o formulario de registro | Label /nome completo/i not found | STANDARDIZATION |
| `src/__tests__/unit/pages/Register.test.tsx` | deve fazer upload de avatar apos criar conta | Label /nome completo/i not found | STANDARDIZATION |
| `src/__tests__/unit/pages/Register.test.tsx` | deve exibir erro quando falha ao criar conta | Label /nome completo/i not found | STANDARDIZATION |
| `src/__tests__/unit/pages/TransactionDetails.test.tsx` | deve carregar e exibir detalhes da transacao | data-testid="transaction-title" not found | STANDARDIZATION |
| `src/__tests__/unit/pages/TransactionDetails.test.tsx` | deve exibir transacao de saida com exitType | data-testid="transaction-title" not found | STANDARDIZATION |
| `src/__tests__/unit/pages/ChurchSettings/ServiceScheduleList.test.tsx` | deve renderizar lista de horarios | render is not defined | STANDARDIZATION |
| `src/__tests__/unit/pages/ChurchSettings/ServiceScheduleList.test.tsx` | deve mostrar mensagem vazia quando nao ha horarios | render is not defined | STANDARDIZATION |
| `src/__tests__/unit/pages/ChurchSettings/ServiceScheduleList.test.tsx` | deve chamar onEdit quando clicar no botao de editar | render is not defined | STANDARDIZATION |
| `src/__tests__/unit/pages/ChurchSettings/ServiceScheduleList.test.tsx` | deve deletar horario quando confirmado | render is not defined | STANDARDIZATION |
| `src/__tests__/unit/pages/ChurchSettings/ServiceScheduleList.test.tsx` | deve mostrar erro quando falha ao contar eventos | render is not defined | STANDARDIZATION |

---

## Root cause details (per failing test file)

### 1) `src/__tests__/unit/pages/Contributions.test.tsx`

- Failure symptom: Transform failed with "Unexpected }" at line 220.
- Probable root cause: duplicated test block after the describe() is closed; extra closing braces remain.
- Classification: STANDARDIZATION
- Confidence: High
- Minimal reproduction: `cd web; .\node_modules\.bin\vitest run src\__tests__\unit\pages\Contributions.test.tsx --reporter verbose --no-color`

### 2) `src/__tests__/unit/pages/ChurchSettings/ServiceScheduleList.test.tsx`

- Failure symptom: `render is not defined` for all tests.
- Probable root cause: missing import of `render` from `@testing-library/react`.
- Classification: STANDARDIZATION
- Confidence: High
- Minimal reproduction: `cd web; .\node_modules\.bin\vitest run src\__tests__\unit\pages\ChurchSettings\ServiceScheduleList.test.tsx --reporter verbose --no-color`
- Helper/mock involved: none (missing import).
- Incorrect assumption: render is available via other helpers without importing it.

### 3) `src/__tests__/unit/pages/Register.test.tsx`

Failing tests:
- `deve renderizar o formulario de registro`
- `deve fazer upload de avatar apos criar conta`
- `deve exibir erro quando falha ao criar conta`

- Failure symptom: `Unable to find a label with the text of: /nome completo/i` (and related fields).
- Probable root cause: the Register UI no longer has a single "nome completo" field (it uses `firstName` and `lastName`), and there is no "nome da igreja" field. Tests still target old labels.
- Classification: STANDARDIZATION
- Confidence: High
- Minimal reproduction: `cd web; .\node_modules\.bin\vitest run src\__tests__\unit\pages\Register.test.tsx --reporter verbose --no-color`
- Feature code: `web/src/pages/Register.tsx` uses labels "Primeiro nome" and "Sobrenome".
- Incorrect assumption: tests assumed the legacy form layout and labels.

### 4) `src/__tests__/unit/pages/AddContribution.test.tsx`

- Failure symptom: toast called with different message.
- Probable root cause: test expects "Campanha criada com sucesso!" but the component uses "Campanha de contribuicao criada com sucesso!".
- Classification: STANDARDIZATION
- Confidence: High
- Minimal reproduction: `cd web; .\node_modules\.bin\vitest run src\__tests__\unit\pages\AddContribution.test.tsx --reporter verbose --no-color`
- Feature code: `web/src/pages/Contributions/AddContribution.tsx` (success toast text).
- Incorrect assumption: toast message unchanged after UI update.

### 5) `src/__tests__/unit/pages/AddDevotional.test.tsx`

- Failure symptom: expected submit button to be disabled during loading, but it is enabled.
- Probable root cause: component does not implement a loading state or disable the submit button.
- Classification: STANDARDIZATION
- Confidence: High
- Minimal reproduction: `cd web; .\node_modules\.bin\vitest run src\__tests__\unit\pages\AddDevotional.test.tsx --reporter verbose --no-color`
- Feature code: `web/src/pages/Devotionals/AddDevotional.tsx` (no loading state).
- Incorrect assumption: tests expect loading UX that is not implemented.

### 6) `src/__tests__/unit/pages/ChurchSettings.test.tsx`

Failing tests:
- `deve renderizar o formulario de edicao da igreja`
- `deve carregar e exibir os dados da igreja`
- `deve exibir botao para adicionar horario`

- Failure symptom: component renders "Igreja nao encontrada" and fetch errors (`churchesResponse` undefined).
- Probable root cause: API mocks are inconsistent. The file defines `vi.mock('@/api/api', ...)` with a local mock object, but also calls `resetApiMocks()` and `mockApiResponse()` from `web/src/test/mockApi.ts`, which operate on `apiMock`. These are different instances, so `mockApiResponse` does not affect the component. Additionally, the component imports `../../api/api` and `../../api/serviceScheduleApi` (relative), while tests mock alias modules.
- Classification: STANDARDIZATION
- Confidence: High
- Minimal reproduction: `cd web; .\node_modules\.bin\vitest run src\__tests__\unit\pages\ChurchSettings.test.tsx --reporter verbose --no-color`
- Helper/mock involved: `web/src/test/mockApi.ts` + inline `vi.mock('@/api/api')` in `web/src/__tests__/unit/pages/ChurchSettings.test.tsx`.
- Incorrect assumption: `mockApiResponse` works even when `@/api/api` is mocked with a separate object and when components import the module via a different path.

### 7) `src/__tests__/unit/pages/DevotionalDetails.test.tsx`

Failing tests:
- `deve curtir devocional com sucesso`
- `deve navegar para lista ao clicar em Voltar`

- Failure symptom: unhandled error `Cannot read properties of undefined (reading 'name')` at `devotional.author.name`.
- Probable root cause: `fixtures.devotional()` does not include required fields (`author`, `passage`, `likes`, `liked`). Tests 3 and 5 override only `id` and `title`, leaving `author` undefined.
- Classification: STANDARDIZATION
- Confidence: High
- Minimal reproduction: `cd web; .\node_modules\.bin\vitest run src\__tests__\unit\pages\DevotionalDetails.test.tsx --reporter verbose --no-color`
- Helper/mock involved: `web/src/test/fixtures/index.ts` devotional fixture.
- Incorrect assumption: fixture provides all fields required by the component.

### 8) `src/__tests__/unit/pages/MemberDetails.test.tsx`

- Failure symptom: unhandled error `positions.map` on null, then UI is empty and test cannot find member text.
- Probable root cause: test `deve renderizar detalhes do membro` mocks `/members/:id` but does not mock `/positions`. `mockApiResponse` returns `{ data: null }` for unmatched URLs, so `setPositions(null)` occurs and `positions.map` throws.
- Classification: STANDARDIZATION
- Confidence: High
- Minimal reproduction: `cd web; .\node_modules\.bin\vitest run src\__tests__\unit\pages\MemberDetails.test.tsx --reporter verbose --no-color`
- Helper/mock involved: `web/src/test/mockApi.ts` (registry returns null for unmatched URLs).
- Incorrect assumption: missing endpoint mocks default to empty arrays.

### 9) `src/__tests__/unit/pages/EditTransaction.test.tsx`

Failing tests:
- `deve carregar dados da transacao existente`
- `deve preencher campos de transacao de saida com exitType`
- `deve atualizar transacao com sucesso`
- `deve exibir erro quando falha ao atualizar`
- `deve preencher campos de transacao com tipo CONTRIBUICAO`

- Failure symptom: `document.getElementById('title')` returns null, and later `.value` access throws.
- Probable root cause: tests still target legacy input IDs (`title`, `category`, etc.) while the component now uses `type`, `entryType`, `exitType`, `amount`, and `date` fields.
- Classification: STANDARDIZATION
- Confidence: High
- Minimal reproduction: `cd web; .\node_modules\.bin\vitest run src\__tests__\unit\pages\EditTransaction.test.tsx --reporter verbose --no-color`
- Feature code: `web/src/pages/Finances/EditTransaction.tsx`.
- Incorrect assumption: form field IDs unchanged.

### 10) `src/__tests__/unit/pages/TransactionDetails.test.tsx`

Failing tests:
- `deve carregar e exibir detalhes da transacao`
- `deve exibir transacao de saida com exitType`

- Failure symptom: `data-testid="transaction-title"` not found.
- Probable root cause: component no longer renders `transaction-title` test id; only `transaction-amount`, `transaction-type`, etc. exist.
- Classification: STANDARDIZATION
- Confidence: High
- Minimal reproduction: `cd web; .\node_modules\.bin\vitest run src\__tests__\unit\pages\TransactionDetails.test.tsx --reporter verbose --no-color`
- Feature code: `web/src/pages/Finances/TransactionDetails.tsx`.
- Incorrect assumption: title test id still exists in UI.

### 11) `src/__tests__/unit/pages/Profile.test.tsx`

Failing tests:
- `deve carregar cargos disponiveis`
- `deve atualizar perfil com sucesso`
- `deve permitir fazer upload de avatar`

- Failure symptom: `loadPositions` reads `positionsResponse.data` on undefined, and later `api.post` / `mockUpdateUser` not called.
- Probable root cause: API mocks are inconsistent. The test defines `vi.mock('@/api/api')` inline, but uses `resetApiMocks()` and `mockApiResponse()` which operate on `apiMock` from `web/src/test/mockApi.ts`. The inline mock is not wired to that registry, so `/positions`, `/upload/avatar`, and `/members/me` responses never resolve as expected.
- Classification: STANDARDIZATION
- Confidence: High
- Minimal reproduction: `cd web; .\node_modules\.bin\vitest run src\__tests__\unit\pages\Profile.test.tsx --reporter verbose --no-color`
- Helper/mock involved: `web/src/test/mockApi.ts` + inline `vi.mock('@/api/api')` in `web/src/__tests__/unit/pages/Profile.test.tsx`.
- Incorrect assumption: `mockApiResponse` works with any local mock, even when `apiMock` is not used.

---

## Recommendations (no code changes yet)

1) Standardize API mocking to one shared instance. Avoid mixing inline `vi.mock('@/api/api')` objects with `mockApiResponse/resetApiMocks` from `web/src/test/mockApi.ts`.
2) Align fixtures with component contracts. Extend `fixtures.devotional()` to include `author`, `passage`, `likes`, and `liked` defaults required by `DevotionalDetails`.
3) Keep tests synced with UI labels and field IDs (Register and EditTransaction). Update test selectors to match current inputs.
4) For tests expecting loading states, either add explicit loading logic to the component or update tests to match actual behavior.
5) Add a quick syntax check (single-file vitest run) after large manual edits to avoid duplicate blocks or stray braces.

---

## Learning / Preventive rules

- Lesson: Mocking the same module in different ways creates disconnected mock instances.
  Prevention: Use a single API mock path and centralize `mockApiResponse/resetApiMocks` usage; do not define inline API mocks in test files.

- Lesson: Fixtures must satisfy all required component fields.
  Prevention: Add required defaults to fixtures (e.g., devotional.author, passage, likes, liked) and assert in tests when overriding.

- Lesson: Tests often fail after UI label/field changes.
  Prevention: Add a checklist step to update test selectors whenever a form changes labels or IDs.

- Lesson: Loading states should be tested only when implemented.
  Prevention: Require a code comment or component prop indicating loading UX before adding loading assertions.

- Lesson: Manual edits can introduce syntax errors.
  Prevention: Run a single-file vitest/lint check immediately after manual edits to test files.

---

End of report
