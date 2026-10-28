# IntentSpec: Executable Spec-TDD Engine for AI Coding Agents

> **IntentSpec** is an open-source, code-first framework that turns natural language specifications into **executable unit tests and context-engineered guardrails** for AI coding agents (Cursor, Windsurf, Claude Code). It bridges the gap between high-level product intent and deterministic AI code execution.

Repository: https://github.com/mHz28/intentspec

---

## 1. Positioning & Core Philosophy

### Where IntentSpec Fits in the SDD Stack

Modern AI software development is dividing into two distinct layers:

1. **Upstream Product Intent (PM Layer - e.g., `intentspec.org`, PRDs, Issue Trackers)**: Captures business goals, user friction, and product requirements.
2. **Downstream Execution Engine (Engineering Layer - IntentSpec)**: Turns requirements into a deterministic, test-driven execution loop (`.spec.md` + `.test.ts` + `.cursorrules`) that guarantees AI agents write minimal, passing production code without "vibe coding" or "documentation bloat."

```text
[ Upstream Product Intent ] ➔ [ BDD Spec Contract (.spec.md) ] ➔ [ Failing Tests (.test.ts) ] ➔ [ Context Rules (.cursorrules) ] ➔ [ AI Code Generation ]
```

### Eliminating the "Markdown Bloat" of Heavy SDD Tools

Heavy Spec-Driven Development tools often generate 5–10 verbose Markdown files per feature, leading to "documentation review fatigue" and causing AI agents to over-engineer solutions with unnecessary abstractions. 

**IntentSpec solves this with Spec-TDD**:
* **Executable Proof of "Done"**: Instead of trusting text tasks alone, IntentSpec establishes a failing automated test baseline (**RED state**) *before* the AI generates application code.
* **Minimal Code Generation**: The test assertions act as a mathematical boundary—forcing the AI agent to write the exact, minimal code required to turn tests **GREEN**.
* **80% Token Savings**: Uses **Skeleton Trimming** in `.cursorrules` to strip function bodies and feed only interface signatures to the model.

---

## 2. Repository Topology

```text
intentspec/
├── .spec/
│   └── SPEC-AUTH-001-password-reset.md   # Living Specification Contract (BDD)
├── tests/
│   └── unit/
│       └── password-reset-request.test.ts # Automated Test Baseline (TDD)
├── .cursorrules                          # Context Engineering Guardrails & Rules
├── flow_images/                          # Process Diagrams
│   ├── greenfield_feature_build_workflow.jpg
│   ├── spec_anchored_change_workflow.jpg
│   └── password_reset_request_flow.jpg
└── src/                                  # Pure Application Implementation Code
```

---

## 3. The 4-Phase Greenfield Workflow

![Greenfield Build Workflow](flow_images/greenfield_feature_build_workflow.jpg)

### Phase 1: Draft the BDD Spec Contract (`.spec/SPEC-AUTH-001-password-reset.md`)
Define explicit BDD scenarios (`Given/When/Then`), security boundaries (e.g., enumeration protection, rate limits), and data formats before writing application code.

### Phase 2: Lock in the Executable Test Baseline (`tests/unit/password-reset-request.test.ts`)
Write failing automated unit tests reflecting the specification criteria. Run `npm test` to confirm the **RED (failing) state**.

### Phase 3: Configure Context Directives (`.cursorrules`)
Enforce **Skeleton Trimming** (loading interface declarations while stripping function bodies) and memory boundaries to optimize the AI agent's token budget.

### Phase 4: Targeted AI Execution
Hand the agent a constrained execution prompt to generate the implementation in `src/` and achieve a verified **GREEN (passing) state**.

---

## 4. The 5-Step Refactoring Workflow (Managing Changes)

![Spec-Anchored Refactoring Workflow](flow_images/spec_anchored_change_workflow.jpg)

When business or security requirements evolve:
1. **Update Spec Contract First**: Modify BDD acceptance criteria in `.spec.md`.
2. **Update Test Suite**: Modify test assertions in `.test.ts` to re-establish the **RED State**.
3. **Adjust Context Directives**: Update interface signatures or file mappings in `.cursorrules`.
4. **Execute AI Refactoring Prompt**: Have the agent refactor logic in `src/`.
5. **Verify & Audit**: Confirm all tests turn **GREEN** and perform a git diff audit against the spec contract.

---

## 5. Reference Implementation & Security Guardrails

The included reference walkthrough (`SPEC-AUTH-001`) demonstrates a production password reset request endpoint enforcing critical security boundaries:
* **IP Security Blocklist**: Intercepts blacklisted IPs with HTTP `403 Forbidden`.
* **Rate-Limiting**: Enforces max 3 requests per 15-minute window (`429 Too Many Requests`).
* **Enumeration Prevention**: Returns identical HTTP `200 OK` messages regardless of whether the email identity exists.
* **Cryptographic Safety**: Hashes reset tokens with SHA-256 before storage and dispatches raw links asynchronously.

---

## 6. Quickstart

```bash
cd intentspec
npm install
npm test
```

---

## License

Distributed under the MIT License.
