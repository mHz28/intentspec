export interface ResetTokenRecord {
  email: string;
  /** SHA-256 hash of the raw token — raw tokens are never persisted. */
  tokenHash: string;
  expiresAt: Date;
}

/**
 * Reset token persistence contract (SPEC-AUTH-001 §6.1).
 */
export interface ITokenRepository {
  save(record: ResetTokenRecord): Promise<void>;
  findByEmail(email: string): Promise<ResetTokenRecord | null>;
  clear(): Promise<void>;
}
