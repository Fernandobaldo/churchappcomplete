You are working inside this repository.

Task type: BUSINESS LOGIC VALIDATION

Context:
[describe the flow]
Example:
- Account creation and onboarding
- Invite link expiration
- Member/Church relationship

Expected invariant:
[describe what MUST always be true]
Example:
- A user must never have more than one pending church
- A user without memberId must not access Main app

Instructions:
1) Verify whether the current implementation enforces this invariant.
2) If NOT:
   - Identify exactly where the invariant breaks
   - Explain why the system allows this invalid state
3) Classify the issue:
   - Logic bug
   - Missing guard
   - Missing data model constraint
   - UI-only assumption
4) Propose the correct invariant enforcement point:
   - backend (preferred?)
   - frontend
   - both
5) Explain how to enforce it with minimal changes.

Output:
- Clear verdict: ENFORCED / NOT ENFORCED / PARTIALLY ENFORCED
- Explanation grounded in code and flow
- No code changes yet

Constraints:
- Backend rules override frontend assumptions
- Do not propose UI-only fixes for domain invariants
