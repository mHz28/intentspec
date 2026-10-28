# Context Engineering Ruleset (.cursorrules / .clinerules)
# Project: IntentSpec Framework
# Purpose: Governs AI Coding Agent behavior, memory isolation, and Spec-Driven execution.

## 1. Core Operating Principles
- **Spec-First Execution**: NEVER write or modify application code without referencing the corresponding specification in `.spec/` (e.g., `SPEC-AUTH-001`).
- **Test-Driven Green Gate**: Implementation code is considered complete ONLY when all tests in `tests/` pass without modification to test assertions.
- **Token Budget Real Estate**: Treat the context window as premium space. Do NOT load full file trees or broad codebase directory dumps.

## 2. Context Engineering & Memory Directives
- **Skeleton Trimming**: When inspecting external modules or service dependencies, read only interface signatures, exported types, and function headers. Do NOT load full function implementation bodies unless explicitly required to fix a bug.
- **Must-Load Priority Files**:
  - Target feature specification: `.spec/SPEC-*.md`
  - Target test suite: `tests/unit/*.test.ts` or `tests/integration/*.test.ts`
  - Relevant domain models and interface contracts: `src/models/`, `src/services/interfaces/`
- **Explicit Exclusions (Ignore Rules)**:
  - Frontend UI components (`src/frontend/**`, `public/**`)
  - DB Migration SQL histories (`migrations/**`, `db/seeds/**`)
  - Unrelated domain modules (e.g., `src/billing/**`, `src/analytics/**`)
  - Dependency lockfiles (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`)

## 3. Architectural & Security Guardrails
- **No User Enumeration**: All authentication and recovery endpoints MUST return uniform success responses (`200 OK`) regardless of whether the target user exists.
- **Token Protection**: Raw tokens MUST NEVER be persisted in plaintext. Always store a cryptographically secure hash (e.g., SHA-256).
- **Constant-Time Verification**: Use timing-safe comparison functions (`crypto.timingSafeEqual`) for token and password verification to prevent side-channel leaks.
- **Rate Limiting Enforcement**: Endpoint handlers MUST integrate rate-limiting middleware before executing business logic.

## 4. Code Generation Rules
- Write explicit, strongly-typed TypeScript with clean interface definitions.
- Do NOT introduce unrequested third-party dependencies. Use existing system interfaces (`IEmailService`, `ITokenRepository`).
- Every service method must handle operational errors defensively and return structured error objects rather than throwing unhandled exceptions.

# Context Directives for Change Request
- Must-Load: /src/services/IPSecurityService.ts (interface only) 
- Strategy: Skeleton Trimming — load method signatures, strip function bodies.