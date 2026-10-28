import crypto from 'crypto';
import { User } from '../models/User';
import { IEmailService } from './interfaces/IEmailService';
import { ITokenRepository } from './interfaces/ITokenRepository';
import { IIPSecurityService } from './IPSecurityService';

/** Structured result — service methods never throw unhandled exceptions. */
export interface PasswordResetResult {
  success: boolean;
  error?: { code: 'IP_BLACKLISTED' | 'INTERNAL_ERROR'; message: string };
}

const TOKEN_TTL_MS = 15 * 60 * 1000; // 15-minute TTL (SPEC-AUTH-001 §2.3, updated from 30)
const RESET_LINK_BASE_URL = 'https://app.example.com/reset-password';

/**
 * Handles password reset request business logic per SPEC-AUTH-001.
 *
 * Security guardrails (SPEC §4):
 * - CSPRNG 256-bit tokens via crypto.randomBytes(32)
 * - Only SHA-256(raw_token) is persisted; raw tokens never stored or logged
 * - Uniform outcome for existing vs. non-existing accounts (no enumeration)
 * - Timing normalization: the non-existent-account branch performs
 *   equivalent cryptographic work to the happy path
 * - Blacklisted client IPs are rejected before any business logic or
 *   database access (SPEC §2, item 8)
 */
export class PasswordResetService {
  constructor(
    private readonly emailService: IEmailService,
    private readonly tokenRepository: ITokenRepository,
    private readonly ipSecurityService: IIPSecurityService
  ) {}

  async requestPasswordReset(email: string, ipAddress: string): Promise<PasswordResetResult> {
    try {
      // SPEC-AUTH-001 §2.8: block blacklisted IPs before any DB access.
      if (await this.ipSecurityService.isBlacklisted(ipAddress)) {
        return {
          success: false,
          error: {
            code: 'IP_BLACKLISTED',
            message: 'Requests from this IP address are not permitted.',
          },
        };
      }

      const user = await User.findOne({ where: { email, status: 'ACTIVE' } });

      if (user) {
        const rawToken = this.generateSecureToken();
        const tokenHash = this.hashToken(rawToken);

        // Newer requests overwrite prior tokens for the same user,
        // invalidating stale reset links (SPEC §4 single-use guardrail).
        await this.tokenRepository.save({
          email,
          tokenHash,
          expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
        });

        const resetLink = `${RESET_LINK_BASE_URL}?token=${rawToken}`;
        await this.emailService.sendPasswordResetEmail(email, resetLink);
      } else {
        // Timing-attack mitigation: perform equivalent crypto work so the
        // miss branch is not measurably faster than the hit branch.
        this.hashToken(this.generateSecureToken());
      }

      return { success: true };
    } catch (err) {
      // Defensive handling: return a structured error instead of throwing.
      // Callers still emit the uniform response to avoid information leaks.
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Password reset request could not be processed.',
        },
      };
    }
  }

  /** 256-bit cryptographically secure single-use token. */
  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /** Tokens are persisted only as SHA-256 hashes. */
  private hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }
}
