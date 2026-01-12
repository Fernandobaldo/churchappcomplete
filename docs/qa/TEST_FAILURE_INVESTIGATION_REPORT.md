# Web Unit Test Failure Investigation Report

Date: 2026-01-12
Command: cd web; .\node_modules\.bin\vitest run src\__tests__\unit
Scope: web unit tests only
Result: Test Files 21 failed | 23 passed (44). Tests 165 passed (165).

---

## Summary table (failed files)

| Test file | Test name | Symptom | Classification |
| --- | --- | --- | --- |
| `src/__tests__/unit/components/Header.test.tsx` | File init (module mock hoist) | ReferenceError: Cannot access mockToastSuccess before initialization | STANDARDIZATION |
| `src/__tests__/unit/pages/AddContribution.test.tsx` | File init (module mock hoist) | ReferenceError: Cannot access mockToastSuccess/mockToastError before initialization | STANDARDIZATION |
| `src/__tests__/unit/pages/AddDevotional.test.tsx` | File init (module mock hoist) | ReferenceError: Cannot access mockToastSuccess/mockToastError before initialization | STANDARDIZATION |
| `src/__tests__/unit/pages/AddEvent.test.tsx` | File init (module mock hoist) | ReferenceError: Cannot access mockToastSuccess/mockToastError before initialization | STANDARDIZATION |
| `src/__tests__/unit/pages/AddMember.test.tsx` | File init (module mock hoist) | ReferenceError: Cannot access mockToastSuccess/mockToastError before initialization | STANDARDIZATION |
| `src/__tests__/unit/pages/AddTransaction.test.tsx` | File init (module mock hoist) | ReferenceError: Cannot access mockToastSuccess/mockToastError before initialization | STANDARDIZATION |
| `src/__tests__/unit/pages/ChurchSettings/ServiceScheduleList.test.tsx` | File init (module mock hoist) | ReferenceError: Cannot access mockToastSuccess before initialization | STANDARDIZATION |
| `src/__tests__/unit/pages/Contributions.test.tsx` | File init (module mock hoist) | ReferenceError: Cannot access mockToastError before initialization | STANDARDIZATION |
| `src/__tests__/unit/pages/DevotionalDetails.test.tsx` | File init (module mock hoist) | ReferenceError: Cannot access mockToastError before initialization | STANDARDIZATION |
| `src/__tests__/unit/pages/Devotionals.test.tsx` | File init (module mock hoist) | ReferenceError: Cannot access mockToastError before initialization | STANDARDIZATION |
| `src/__tests__/unit/pages/EditEvent.test.tsx` | File init (module mock hoist) | ReferenceError: Cannot access mockToastSuccess before initialization | STANDARDIZATION |
| `src/__tests__/unit/pages/EditTransaction.test.tsx` | File init (module mock hoist) | ReferenceError: Cannot access mockToastSuccess before initialization | STANDARDIZATION |
| `src/__tests__/unit/pages/EventDetails.test.tsx` | File init (module mock hoist) | ReferenceError: Cannot access mockToastSuccess before initialization | STANDARDIZATION |
| `src/__tests__/unit/pages/Events.test.tsx` | File init (module mock hoist) | ReferenceError: Cannot access mockToastSuccess before initialization | STANDARDIZATION |
| `src/__tests__/unit/pages/Finances.test.tsx` | File init (module mock hoist) | ReferenceError: Cannot access mockToastError before initialization | STANDARDIZATION |
| `src/__tests__/unit/pages/MemberDetails.test.tsx` | File init (module mock hoist) | ReferenceError: Cannot access mockToastSuccess before initialization | STANDARDIZATION |
| `src/__tests__/unit/pages/Members.test.tsx` | File init (module mock hoist) | ReferenceError: Cannot access mockToastError before initialization | STANDARDIZATION |
| `src/__tests__/unit/pages/Positions.test.tsx` | File init (module mock hoist) | ReferenceError: Cannot access mockToastSuccess before initialization | STANDARDIZATION |
| `src/__tests__/unit/pages/Register.test.tsx` | File init (module mock hoist) | ReferenceError: Cannot access mockToastSuccess before initialization | STANDARDIZATION |
| `src/__tests__/unit/pages/TransactionDetails.test.tsx` | File init (module mock hoist) | ReferenceError: Cannot access mockToastError before initialization | STANDARDIZATION |
| `src/__tests__/unit/pages/onboarding/Branches.test.tsx` | File parse error | Unexpected "}" at line 201 | STANDARDIZATION |

---

## Root cause details (per failing test file)

### 1) react-hot-toast mock hoist errors (20 files)

**Failing files:**
- `src/__tests__/unit/components/Header.test.tsx`
- `src/__tests__/unit/pages/AddContribution.test.tsx`
- `src/__tests__/unit/pages/AddDevotional.test.tsx`
- `src/__tests__/unit/pages/AddEvent.test.tsx`
- `src/__tests__/unit/pages/AddMember.test.tsx`
- `src/__tests__/unit/pages/AddTransaction.test.tsx`
- `src/__tests__/unit/pages/ChurchSettings/ServiceScheduleList.test.tsx`
- `src/__tests__/unit/pages/Contributions.test.tsx`
- `src/__tests__/unit/pages/DevotionalDetails.test.tsx`
- `src/__tests__/unit/pages/Devotionals.test.tsx`
- `src/__tests__/unit/pages/EditEvent.test.tsx`
- `src/__tests__/unit/pages/EditTransaction.test.tsx`
- `src/__tests__/unit/pages/EventDetails.test.tsx`
- `src/__tests__/unit/pages/Events.test.tsx`
- `src/__tests__/unit/pages/Finances.test.tsx`
- `src/__tests__/unit/pages/MemberDetails.test.tsx`
- `src/__tests__/unit/pages/Members.test.tsx`
- `src/__tests__/unit/pages/Positions.test.tsx`
- `src/__tests__/unit/pages/Register.test.tsx`
- `src/__tests__/unit/pages/TransactionDetails.test.tsx`

**Test name:** File init (module mock hoist) - tests do not execute.

**Symptom:**
- `Error: [vitest] There was an error when mocking a module...`
- `Caused by: ReferenceError: Cannot access 'mockToastSuccess' before initialization` (or `mockToastError`).

**Evidence:**
- Example: `src/__tests__/unit/pages/Devotionals.test.tsx` uses
  `const mockToastError = vi.fn()` and then `vi.mock('react-hot-toast', () => ({ default: { error: mockToastError } }))`.
  The factory is hoisted above the const declaration, so the variable is in TDZ.
- Error stack points to the test file line where the mock variable is referenced.

**Probable root cause:**
- Vitest hoists `vi.mock` factories. Any top-level const used inside the factory is referenced before initialization.
- This is a test standardization issue in the test files, not application code.

**Classification:** STANDARDIZATION
**Confidence:** High
**Minimal reproduction:**
- `cd web; .\node_modules\.bin\vitest run src\__tests__\unit\pages\Devotionals.test.tsx`
  (replace with any file listed above).

**Helper/mock involved:**
- Local `vi.mock('react-hot-toast', () => ...)` factories in each file.
- The mocks reference `mockToastSuccess`/`mockToastError` that are not hoisted.

**Incorrect assumption:**
- Assuming `const mockToastSuccess = vi.fn()` is available in a hoisted `vi.mock` factory.

---

### 2) Branches test file parse error

**Failing file:** `src/__tests__/unit/pages/onboarding/Branches.test.tsx`

**Test name:** File parse error (syntax)

**Symptom:**
- `Transform failed: Unexpected "}"` at line 201.

**Evidence:**
- The file contains a duplicated block after the closing `})` for the test and `})` for the describe, leaving extra braces and duplicated test logic at the end of the file.

**Probable root cause:**
- Accidental duplicate paste of the last test block after the suite was closed.

**Classification:** STANDARDIZATION
**Confidence:** High
**Minimal reproduction:**
- `cd web; .\node_modules\.bin\vitest run src\__tests__\unit\pages\onboarding\Branches.test.tsx`

**Helper/mock involved:**
- None (syntax error in test file).

**Incorrect assumption:**
- Test file edits were assumed to be syntactically valid; the duplicated block is not.

---

## Follow-up run (post-fix: mock hoist + syntax)

Date: 2026-01-12  
Command: `cd web; .\node_modules\.bin\vitest run src\__tests__\unit\pages\Devotionals.test.tsx src\__tests__\unit\pages\onboarding\Branches.test.tsx`  
Result: Test Files 2 failed (2). Tests 7 failed | 4 passed (11).

### Summary table (remaining failures)

| Test file | Test name | Symptom | Classification |
| --- | --- | --- | --- |
| `src/__tests__/unit/pages/Devotionals.test.tsx` | Multiple tests (list, empty, navigation, error) | UI stuck in "Carregando devocionais..." or toast not called | STANDARDIZATION |
| `src/__tests__/unit/pages/onboarding/Branches.test.tsx` | Submit flows (2 tests) | navigate called with `/onboarding/church` (churchId null) | STANDARDIZATION |

### 3) Devotionals list/empty/navigation/error tests stuck in loading

**Failing file:** `src/__tests__/unit/pages/Devotionals.test.tsx`  
**Symptom:** Assertions fail because the page remains in loading state; error toast never fires.  
**Evidence:**
- Test output shows DOM contains only `Carregando devocionais...` even after `waitFor`.
- `mockToastError` not called when `mockApiError` is used.
**Probable root cause:**
- Mocking is applied to a different module instance than the one the component uses.  
  `mockApiResponse`/`mockApiError` import `../api/api`, while test files and components import `@/api/api`.  
  Combined with `vi.mock('../api/api')` inside `web/src/test/helpers.tsx`, this creates multiple mock instances.  
  Result: the mock responses registered by `mockApiResponse` are not used by the component, so `api.get('/devotionals')` never resolves with the expected data.
**Classification:** STANDARDIZATION  
**Confidence:** Medium  
**Minimal reproduction:**  
- `cd web; .\node_modules\.bin\vitest run src\__tests__\unit\pages\Devotionals.test.tsx`

**Helper/mock involved:**
- `web/src/test/mockApi.ts` (imports `../api/api`)
- `web/src/test/helpers.tsx` (mocking `../api/api` at module scope)

**Incorrect assumption:**
- Assuming alias `@/api/api` and relative `../api/api` resolve to the same mock instance.

### 4) Branches submit flow navigates to /onboarding/church

**Failing file:** `src/__tests__/unit/pages/onboarding/Branches.test.tsx`  
**Symptom:** `mockNavigate` called with `/onboarding/church` instead of `/onboarding/settings`.  
**Evidence:**
- Test output shows actual navigation `/onboarding/church`.
- Console error: `TypeError: Cannot read properties of undefined (reading 'data')` in `loadChurch` at `web/src/pages/onboarding/Branches.tsx:32`.
**Probable root cause:**
- `api.get('/churches')` returns `undefined` because the mock response is not applied to the module instance used by the component.
- `churchId` stays `null`, triggering the guard path that navigates to `/onboarding/church`.
**Classification:** STANDARDIZATION  
**Confidence:** Medium  
**Minimal reproduction:**  
- `cd web; .\node_modules\.bin\vitest run src\__tests__\unit\pages\onboarding\Branches.test.tsx`

**Helper/mock involved:**
- Same module mismatch as Devotionals (`mockApiResponse` vs alias usage).

**Incorrect assumption:**
- Assuming `mockApiResponse` is wired to the same mocked `api` instance used by components.

### Recommendations (no code yet)

- Standardize `api` mocking to a single module ID. Prefer using `@/api/api` consistently in tests and helpers, and ensure only one `vi.mock` definition applies.
- Use `resetApiMocks()` in `beforeEach` for unit tests that rely on `mockApiResponse`, to re-install the registry-backed mock implementation.

---

## Recommendations (no code changes yet)

1) For toast mocks, use `vi.hoisted` or define the mocks inside the `vi.mock` factory so they are available when hoisted.
2) Consider centralizing `react-hot-toast` mocking in `web/src/test/setup.ts` to avoid per-file hoist pitfalls.
3) Fix `Branches.test.tsx` by removing the duplicated block after the closing braces and re-run the file.

---

## Learning / Preventive rules

- Lesson: "vi.mock factories are hoisted; local const mocks are not."  
  Prevention: "Use vi.hoisted for mock functions referenced inside vi.mock, or define vi.fn inline in the factory."

- Lesson: "Large test file edits can leave duplicate blocks and mismatched braces."  
  Prevention: "Run lint or a quick single-file vitest run after manual edits to catch syntax errors early."

---

End of report
