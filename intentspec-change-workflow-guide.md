# IntentSpec Framework: Change Management & Feature Evolution Guide

## 1. Overview & Core Philosophy
In AI-native software engineering, software features are rarely static. When application requirements evolve—such as tightening security parameters, adding business validation rules, or integrating new services—developers frequently fall into the trap of ad-hoc prompt tweaking or unguided manual code editing. Over time, this leads to severe architectural drift, context rot, and unmaintained documentation.

The **IntentSpec Change Management Framework** establishes a **Spec-Anchored Refactoring Loop**. Every modification to application behavior flows through a single, traceable chain of accountability: **Spec Contract ➔ Test Suite ➔ Context Rules ➔ AI Refactoring ➔ Verification & Audit**.

---

## 2. End-to-End Lifecycle Flowcharts

### A. Initial Build Flow vs. Change Management Flow



---

### B. Interactive Collaboration Sequence Diagram

| Step | Initiator | Role / Action | System State | Gate / Artifact |
| :--- | :--- | :--- | :--- | :--- |
| **01. Trigger** | Product / Security | Defines new requirements or security policy change. | Existing "Green" build. | Change Request Ticket |
| **02. Contract Update** | Human Developer | Updates `.spec/SPEC-AUTH-001.md` with new scenarios & limits. | Spec modified. | Living Spec Contract |
| **03. Test Expansion** | Human Developer | Adds new assertions & scenarios to `tests/unit/*.test.ts`. | **RED State** (Tests Fail). | Failing Test Suite |
| **04. Context Tuning** | Human Developer | Updates `.cursorrules` / Spec directives for new service signatures. | Memory Curated. | Context Ruleset |
| **05. AI Refactoring** | AI Coding Agent | Reads Spec + Ruleset + Tests, refactors implementation code in `src/`. | Code Transformed. | Codebase Diff |
| **06. Verification** | Test Runner | Runs `npm test` against complete regression suite. | **GREEN State** (All Pass). | Test Execution Report |
| **07. Diff Audit** | Human Developer | Reviews Git diff to verify zero scope creep or unrequested changes. | Approved for PR. | Production Git Commit |

---

## 3. Detailed 5-Step Refactoring Workflow

### Step 1: Update the Spec Contract First (`.spec.md`)
Specifications must never lag behind code. When a feature requirement shifts:
- Update Section 2 (`In-Scope` / `Out-of-Scope`).
- Append new behavioral scenarios to Section 3 (`BDD Acceptance Criteria`).
- Update architectural guardrails or constants in Section 4.

### Step 2: Lock in the Test Suite Expansion (`.test.ts`)
Modify or append test cases in the corresponding test suite before editing application logic:
- Add test assertions for the new behavior.
- Execute the test suite (`npm test`) to confirm that the runner captures the failure (**Red State**). This provides mathematical proof of what needs to be built.

### Step 3: Update Context Directives (`.cursorrules`)
If the change introduces new domain models, interfaces, or third-party SDKs:
- Add explicit `Must-Load` file paths to `.cursorrules` or the spec's context block.
- Enforce **Skeleton Trimming** (loading only interface declarations, stripping internal function bodies) to conserve token budget.

### Step 4: Execute the AI Refactoring Prompt
Provide the AI coding agent with a constrained, target-driven prompt:
> *"Read the updated `.spec/SPEC-AUTH-001-password-reset.md` and `.cursorrules`. Refactor `src/services/PasswordResetService.ts` to implement the new acceptance criteria. Ensure all tests in `tests/unit/password-reset-request.test.ts` pass cleanly without altering existing test assertions."*

### Step 5: Verification & Diff Review
Run `npm test` to confirm all test cases pass (**Green State**). Inspect the `git diff` to ensure:
- The new logic strictly matches the updated specification.
- No regression or unwanted refactoring occurred in existing code paths.

---

## 4. Concrete Walkthrough: Password Reset Change Request

### Context & Requirements Change
1. **Reduce Token TTL**: Decrease password reset token expiration from **30 minutes to 15 minutes**.
2. **IP Security Blocklist**: Intercept and reject requests coming from blacklisted IP addresses with an HTTP `403 Forbidden` status.

### Concrete Spec Diff (`SPEC-AUTH-001.md`)
```markdown
## 2. In-Scope
 3. Generating a cryptographically secure reset token with a strict **15-minute TTL** (updated from 30 minutes).
 8. **Validating incoming client IP addresses against `IPSecurityService` and blocking blacklisted IPs.** (New)

## 3. Behavioral Acceptance Criteria
### Scenario 4: Blacklisted IP Request
- **GIVEN** an incoming POST request originates from a blacklisted IP address (`"192.168.1.99"`),
- **WHEN** submitted to `/api/v1/auth/password-reset-request`,
- **THEN** the server returns HTTP `403 Forbidden` with body `{"error": "FORBIDDEN", "message": "Access denied"}`.
```

### Concrete Test Diff (`password-reset-request.test.ts`)
```typescript
it('should reject requests coming from a blacklisted IP address with 403 Forbidden', async () => {
  const response = await request(app)
    .post('/api/v1/auth/password-reset-request')
    .set('X-Forwarded-For', '192.168.1.99')
    .send({ email: 'user@example.com' });

  expect(response.status).toBe(403);
  expect(response.body).toEqual({
    error: 'FORBIDDEN',
    message: 'Access denied',
  });
});
```

---

## 5. Architectural Comparison: Vibe-Coding vs. IntentSpec

| Feature Dimension | Traditional "Vibe-Coding" | IntentSpec Refactoring Workflow |
| :--- | :--- | :--- |
| **Source of Truth** | Ephemeral chat history or developer memory | Permanent `.spec.md` contract in git |
| **Change Initiation** | Ad-hoc prompt tweaking directly against `src/` | Spec update ➔ Failing test ➔ Targeted prompt |
| **Context Management** | Flooding entire codebase into AI prompt window | Selective skeleton trimming & file scoping |
| **Regression Safety** | Manual spot-checking or trial-and-error | Automated test suite execution (`npm test`) |
| **Long-Term Maintainability** | Codebase slowly drifts into technical debt | Zero specification rot; living codebase contract |
