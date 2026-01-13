You are working inside this repository.

Task type: APPLY FIXES BASED ON INVESTIGATION REPORT

Input:
Use docs/qa/TEST_FAILURE_INVESTIGATION_REPORT.md as the source of truth.

Goal:
Fix all failing tests with the minimum correct changes, while preserving the testing standard.

Fixing rules:
1) If the failure is STANDARDIZATION:
   - Fix helpers/mocks/factories/setup/scripts to match real app behavior.
   - Do not change business logic unless the report proves a real bug.
2) If the failure is PROJECT_CODE:
   - Fix the application code (service/controller/screen) according to invariants/docs.
   - Then adjust tests only if expected behavior changes as a result.
3) If the failure is ENVIRONMENT:
   - Fix configuration (test env vars, DB reset strategy, timezone, random seeds, ports).
4) Never “silence” failures:
   - No loosening assertions unless justified.
   - No removing tests to make CI green.
5) Keep changes small and isolated:
   - One commit logical group per root cause (even if you can’t commit, keep changes grouped).

Mandatory deliverables:
A) Implement the fixes
B) After each root cause fix, ensure the previously failing tests pass
C) Update the testing standard docs if needed:
   - docs/qa/TESTING_STANDARD.md (only if the standard itself must change)
D) Add a “Preventive checklist” section into:
   - docs/qa/TESTING_MAINTENANCE_RULES.md
   using the lessons learned from the report.

Output:
1) A concise summary:
   - what was fixed
   - which files changed
   - why the fix is correct
2) A “Regression prevention” checklist:
   - rules we will apply for the next standardization checkpoints

Constraints:
- Do not refactor unrelated code.
- Do not introduce new dependencies unless strictly required.
- Prefer deterministic tests: freeze time, stable factories, controlled network mocks.
