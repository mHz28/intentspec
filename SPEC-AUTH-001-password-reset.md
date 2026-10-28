# Feature Specification: Password Reset Request

**Spec ID**: SPEC-AUTH-001  
**Version**: 1.0.0  
**Status**: Approved for Implementation  
**Owner**: Lead Security Architect & AI Engineering Team  
**Target Component**: Authentication Service (`/src/services/auth`)  

---

## 1. Agile User Story & Intent

- **As a** registered application user who has lost access to my account,
- **I want to** submit my email address to request a password reset link,
- **So that** I can regain secure access to my account without exposing my account's existence to unauthorized third parties or malicious automated scripts.

### Business Value & Intent Context
Password recovery is a critical authentication capability that directly impacts user retention and operational support overhead. However, misconfigured password reset flows represent a primary vector for user enumeration attacks, brute-force token harvesting, and account takeover (ATO). This specification serves as a binding contract between product requirements, security architecture, and automated AI coding execution.

---

## 2. Scope & Architectural Boundaries

To prevent AI coding agents from making unguided architectural assumptions or introducing scope drift, the following boundaries are strictly enforced:

### In-Scope
1. Exposing an HTTP POST endpoint at `/api/v1/auth/password-reset-request` to ingest reset requests.
2. Validating input payload formats against system RFC-compliant email standards.
3. Generating a cryptographically secure, high-entropy single-use reset token with a strict 15-minute Time-To-Live (TTL) (updated from 30 minutes).
4. Persisting a hashed representation (SHA-256) of the reset token in storage rather than storing raw token strings.
5. Asynchronously dispatching a password reset link email containing the raw token via the system `EmailService` interface.
6. Enforcing rate-limiting constraints per IP address and email identity to prevent denial-of-service (DoS) and spam attacks.
7. Returning uniform HTTP responses for both existing and non-existing email queries to prevent user enumeration.
8. Validating incoming client IP addresses against IPSecurityService and blocking blacklisted IPs with an HTTP 403 Forbidden response.(new requirement)


### Out-of-Scope
- Processing the actual password change transaction when the reset token is submitted (covered under `SPEC-AUTH-002`).
- Password reset flows for currently authenticated active sessions in the application UI.
- Direct UI/UX page template rendering for the password reset request form.
- Modifications to Multi-Factor Authentication (MFA), SAML 2.0, or Social OAuth 2.0 identity providers.

---

## 3. Behavioral Acceptance Criteria (BDD / Gherkin)

### Scenario 1: Valid Account Password Reset Request (Happy Path)
```gherkin
Feature: Password Reset Request
  Scenario: Successfully processing a valid password reset request
    Given a registered user with email "user@example.com" exists in the user database
    And the user's account status is "ACTIVE"
    When an HTTP POST request is received at "/api/v1/auth/password-reset-request" with body:
      """
      {
        "email": "user@example.com"
      }
      """
    Then a 256-bit cryptographically secure token is generated
    And the SHA-256 hash of the token is saved in the database with a 30-minute expiration timestamp
    And an email task is queued via "EmailService" containing the reset URL with the raw token
    And the HTTP response status code is 200 OK
    And the response body matches:
      """
      {
        "status": "success",
        "message": "If an account with that email exists, a password reset link has been sent."
      }
      """
```

### Scenario 2: Non-Existent Account Request (User Enumeration Prevention)
```gherkin
  Scenario: Handling a reset request for an unregistered email address
    Given an account with email "unregistered@example.com" does NOT exist in the system
    When an HTTP POST request is received at "/api/v1/auth/password-reset-request" with body:
      """
      {
        "email": "unregistered@example.com"
      }
      """
    Then no reset token is generated or saved in the database
    And no email message is dispatched to "EmailService"
    And the processing time is padded to execute in constant-time relative to valid account lookups
    And the HTTP response status code is 200 OK
    And the response body is identical to a valid request:
      """
      {
        "status": "success",
        "message": "If an account with that email exists, a password reset link has been sent."
      }
      """
```

### Scenario 3: Rate Limiting Abuse Protection
```gherkin
  Scenario: Throttling excessive request attempts from a single IP address
    Given an IP address "192.0.2.45" has submitted 5 password reset requests within 15 minutes
    When a 6th HTTP POST request is received from IP "192.0.2.45" at "/api/v1/auth/password-reset-request"
    Then the request is rejected immediately without database queries or email dispatch
    And the HTTP response status code is 429 Too Many Requests
    And the response header contains "Retry-After: 900"
    And the response body matches:
      """
      {
        "error": "TOO_MANY_REQUESTS",
        "message": "Rate limit exceeded. Please try again later."
      }
      """
```

### Scenario 4: Invalid Email Payload Format
```gherkin
  Scenario: Rejecting malformed email addresses
    When an HTTP POST request is received at "/api/v1/auth/password-reset-request" with body:
      """
      {
        "email": "invalid-email-format"
      }
      """
    Then the HTTP response status code is 400 Bad Request
    And the response body matches:
      """
      {
        "error": "VALIDATION_ERROR",
        "message": "A valid RFC-compliant email address is required."
      }
      """
```

---

## 4. Technical & Security Guardrails

Developers and AI coding agents must strictly adhere to the following non-negotiable security requirements:

| Guardrail Dimension | Architectural Constraint | Security Rationale |
| :--- | :--- | :--- |
| **Cryptographic Token Security** | Generate reset tokens using cryptographically secure pseudorandom number generators (CSPRNG, e.g., `crypto.randomBytes(32)`). | Prevents attackers from predicting token sequences or seed values. |
| **Token Storage Protection** | Compute and store `SHA-256(raw_token)` in the database. Never persist raw reset tokens in databases or server logs. | Protects users if database backups or read replicas are compromised. |
| **Timing Attack Mitigation** | Implement artificial timing normalization or constant-time operations for existing vs. non-existing user lookup branches. | Eliminates side-channel timing analysis that leaks whether an email exists. |
| **Single-Use & Invalidation** | Mark tokens as revoked immediately upon use or when a newer reset request is requested for the same user ID. | Prevents replay attacks using captured or stale reset links. |
| **Rate Limiting** | Limit reset requests to a maximum of **3 requests per 15 minutes per email** and **5 requests per 15 minutes per IP**. | Mitigates email flooding, service bill exhaustion, and brute-force sweeps. |

---

## 5. API Data Contracts & Interface Signatures

### HTTP Endpoint Specification
- **Method**: `POST`
- **Path**: `/api/v1/auth/password-reset-request`
- **Content-Type**: `application/json`

### Request Payload Schema
```json
{
  "type": "object",
  "properties": {
    "email": {
      "type": "string",
      "format": "email",
      "maxLength": 255
    }
  },
  "required": ["email"],
  "additionalProperties": false
}
```

### Response Schemas

#### Standard Response (`HTTP 200 OK`)
```json
{
  "status": "success",
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

#### Client Validation Error (`HTTP 400 Bad Request`)
```json
{
  "error": "VALIDATION_ERROR",
  "message": "A valid RFC-compliant email address is required."
}
```

#### Throttling Response (`HTTP 429 Too Many Requests`)
```json
{
  "error": "TOO_MANY_REQUESTS",
  "message": "Rate limit exceeded. Please try again later."
}
```

---

## 6. Context Engineering Directives for AI Coding Agents

When triggering an AI coding agent (e.g., Claude Code, Cursor, or GitHub Copilot) to execute this specification, the agent must curate its working memory according to these directives:

### 1. Mandatory Context Ingestion (Must-Load)
The AI agent must load only the following interface contracts and models using **Skeleton Trimming** (loading class/interface signatures and method declarations while omitting method implementation bodies):
- User Model Signature: `/src/models/User.ts` (fields and type definitions only)
- Email Service Contract: `/src/services/IEmailService.ts`
- Security Configuration: `/src/config/security.ts`
- Token Repository Signature: `/src/repositories/ITokenRepository.ts`

### 2. Excluded Directories (Do Not Load)
To preserve the agent's context window and avoid context degradation, the agent MUST NOT load:
- Frontend UI components (`/src/frontend/**`)
- Unrelated microservices (`/src/billing/**`, `/src/analytics/**`)
- Database migration history files (`/migrations/**`)

### 3. Execution Rules & System Instructions
- **Rule 1**: Follow the project's TypeScript strict-mode configuration (`tsconfig.json`).
- **Rule 2**: Do not alter existing interface method signatures in `IEmailService.ts` or `User.ts`.
- **Rule 3**: Validate all code against unit and integration tests before marking tasks as complete.

---

## 7. Spec-TDD Verification Protocol

Implementation MUST follow the 5-step Spec-TDD loop to ensure full alignment between intent, tests, and generated code:

1. **Spec Ingestion**: The AI agent parses this specification document (`SPEC-AUTH-001-password-reset.md`).
2. **Spec-to-Test Generation**: The AI agent generates test suites (`/tests/unit/password-reset-request.test.ts`) covering Scenarios 1–4 **before writing any implementation code**.
3. **Failing Test Verification (Red Phase)**: Execute tests to verify that they fail for the correct expected reasons (e.g., endpoint returning HTTP 404 or method unhandled).
4. **Minimal Implementation (Green Phase)**: The AI agent writes the minimal code required in `/src/services/auth/PasswordResetService.ts` and `/src/controllers/AuthController.ts` to make all tests pass.
5. **Human Verification & Refactoring**: Review the git diff against the guardrail matrix in Section 4 to verify cryptographic entropy, constant-time operations, and rate limiting before approving the pull request.
