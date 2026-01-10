You are working inside this repository.

Task type: TEST FAILURE INVESTIGATION (NO FIXES YET)

Context:
We are currently standardizing tests (unit/integration/e2e) across backend + UI.
After running tests, some suites are failing.
We need to determine whether failures are caused by:
A) the standardization changes (test infra/helpers/mocks/factories/scripts),
B) the project code itself (real bug),
C) environment/config issues (DB, timezones, ports, secrets, CI differences),
or a combination.

Instructions:
1) DO NOT modify any code yet.
2) Collect evidence from:
   - failing test logs (stack traces, assertion diffs)
   - test setup files (global setup, mocks, factories)
   - recent changes related to standardization (helpers, templates, infra)
   - the feature code under test (service/controller/screen)
3) For EACH failing test, produce a record with:
   - Test file + test name
   - Failure symptom (what failed)
   - Probable root cause (why it failed)
   - Classification: STANDARDIZATION | PROJECT_CODE | ENVIRONMENT | MIXED
   - Confidence level: High/Medium/Low
   - Minimal reproduction steps (command)
4) If classification is STANDARDIZATION or ENVIRONMENT:
   - identify the exact helper/mock/factory responsible
   - explain how the standardization assumption is incorrect
5) If classification is PROJECT_CODE:
   - explain the bug and where it is in the code (file/function)
   - confirm whether behavior contradicts current docs/invariants
6) Create a “Learning section” at the end:
   - List the mistaken assumptions that led to failures
   - Convert each into a rule/checklist item for future migrations
   - Example format:
     - Lesson: "Factories must always set branchId for member in COMPLETE flows"
       Prevention: "Update MemberFactory default + add assertion in createCompleteUser() helper"

Output:
Write a report to:
docs/qa/TEST_FAILURE_INVESTIGATION_REPORT.md

The report must include:
- Summary table of failing tests + classification
- Root cause details per failing test
- Recommendations (no code yet)
- Learning / Preventive rules for future standardization steps

Constraints:
- No code changes in this step.
- Treat the current code as truth; do not “fix tests by weakening expectations”.
- If a test is flaky, prove it (rerun guidance + suspected nondeterminism source).
