import {
  ITokenRepository,
  ResetTokenRecord,
} from '../services/interfaces/ITokenRepository';

export type { ResetTokenRecord };

/**
 * In-memory ITokenRepository implementation. Stores only the SHA-256 hash
 * of reset tokens — never the raw token (SPEC-AUTH-001 §4).
 */
export class TokenRepository {
  private static tokens = new Map<string, ResetTokenRecord>();

  static async save(record: ResetTokenRecord): Promise<void> {
    TokenRepository.tokens.set(record.email, record);
  }

  static async findByEmail(email: string): Promise<ResetTokenRecord | null> {
    return TokenRepository.tokens.get(email) ?? null;
  }

  static async clear(): Promise<void> {
    TokenRepository.tokens.clear();
  }
}

// Compile-time check: the static class satisfies the repository contract.
const _contract: ITokenRepository = TokenRepository;
void _contract;
