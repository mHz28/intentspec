import { IEmailService } from './interfaces/IEmailService';

/**
 * Default email dispatch implementation of IEmailService.
 * Auto-mocked in tests via jest.mock('../../src/services/EmailService').
 */
export class EmailService implements IEmailService {
  async sendPasswordResetEmail(email: string, resetLink: string): Promise<void> {
    // Placeholder transport: a real implementation would enqueue the
    // message on the outbound email queue (SPEC-AUTH-001 §2, item 5).
    // NOTE: never log resetLink in production — it contains the raw token.
    console.log(`[EmailService] Password reset email queued for ${email}`);
    void resetLink;
  }
}
