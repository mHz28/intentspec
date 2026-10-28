/**
 * Email dispatch contract (SPEC-AUTH-001 §6.1).
 * Rule 2: do not alter existing interface method signatures.
 */
export interface IEmailService {
  /**
   * Asynchronously dispatches a password reset email containing the
   * reset link with the raw (un-hashed) token.
   */
  sendPasswordResetEmail(email: string, resetLink: string): Promise<void>;
}
